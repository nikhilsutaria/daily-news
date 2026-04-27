import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";
import { corsHeaders } from "npm:@supabase/supabase-js@2/cors";

const HN_API_BASE = "https://hacker-news.firebaseio.com/v0";
const MAX_CONTENT_LENGTH = 10000;
const SUMMARIZER_SYSTEM_PROMPT =
  "You are a news summarizer. Given an article title and content, produce a single concise paragraph (3-5 sentences). Focus on key facts, significance, and implications. Do not include personal opinions.";

// ── Helpers ──────────────────────────────────────────────────────────

function env(key: string): string {
  const value = Deno.env.get(key);
  if (!value) throw new Error(`Missing env var: ${key}`);
  return value;
}

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

// ── HN ───────────────────────────────────────────────────────────────

async function getTopStoryId(): Promise<number> {
  const res = await fetch(`${HN_API_BASE}/topstories.json`);
  if (!res.ok) throw new Error(`HN API error: ${res.status}`);
  const ids: number[] = await res.json();
  if (!ids?.length) throw new Error("No top stories found");
  return ids[0];
}

interface HNStory {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number;
}

async function getStory(id: number): Promise<HNStory> {
  const res = await fetch(`${HN_API_BASE}/item/${id}.json`);
  if (!res.ok) throw new Error(`HN API error fetching story ${id}: ${res.status}`);
  const story = await res.json();
  if (!story) throw new Error(`Story ${id} not found`);
  return story;
}

// ── Content extraction (Jina) ────────────────────────────────────────

async function extractContent(url: string, jinaApiKey?: string): Promise<string> {
  const headers: Record<string, string> = { Accept: "text/plain" };
  if (jinaApiKey) headers["Authorization"] = `Bearer ${jinaApiKey}`;

  const res = await fetch(`https://r.jina.ai/${encodeURIComponent(url)}`, { headers });
  if (!res.ok) {
    console.error(`Jina API error: ${res.status} for ${url}`);
    return "";
  }
  const text = await res.text();
  return text.slice(0, MAX_CONTENT_LENGTH);
}

// ── Summarisation (Gemini REST) ──────────────────────────────────────

async function summarize(title: string, content: string, apiKey: string): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-flash-latest:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SUMMARIZER_SYSTEM_PROMPT }] },
        contents: [{ parts: [{ text: `Title: ${title}\n\nContent:\n${content}` }] }],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error ${res.status}: ${err}`);
  }

  const data = await res.json();
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("Gemini returned empty response");
  return text.trim();
}

// ── Pipeline ─────────────────────────────────────────────────────────

async function runPipeline() {
  const supabaseUrl = env("SUPABASE_URL");
  const supabaseKey = env("SUPABASE_SERVICE_ROLE_KEY");
  const geminiApiKey = env("GOOGLE_GEMINI_API_KEY");
  const jinaApiKey = Deno.env.get("JINA_API_KEY") || undefined;

  const supabase = createClient(supabaseUrl, supabaseKey);

  const topId = await getTopStoryId();

  // Check if already processed
  const { data: existing } = await supabase
    .from("articles")
    .select("*")
    .eq("id", topId)
    .maybeSingle();

  if (existing) {
    return { status: "skipped", article: existing, message: `Article ${topId} already summarized` };
  }

  const story = await getStory(topId);

  if (!story.url) {
    return { status: "skipped", message: `Story ${topId} has no external URL` };
  }

  const content = await extractContent(story.url, jinaApiKey);
  if (!content) {
    return { status: "error", message: `Failed to extract content from ${story.url}` };
  }

  const summary = await summarize(story.title, content, geminiApiKey);

  const { data: article, error } = await supabase
    .from("articles")
    .insert({
      id: story.id,
      title: story.title,
      url: story.url,
      summary,
      hn_score: story.score,
      author: story.by,
      created_at: new Date(story.time * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Failed to save article: ${error.message}`);

  return { status: "created", article, message: `Successfully summarized: ${story.title}` };
}

// ── Handler ──────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  // CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Auth check
  // - UI button & curl send: Bearer <TRIGGER_SECRET>
  // - pg_cron sends: Bearer <TRIGGER_SECRET>
  // - Dashboard test sends: a Supabase JWT (anon or service_role)
  const triggerSecret = env("TRIGGER_SECRET");
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "") ?? "";

  // Accept our custom trigger secret
  const isTriggerSecret = token === triggerSecret;

  // Accept valid Supabase JWTs (dashboard test sends these)
  let isSupabaseJwt = false;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    isSupabaseJwt = payload.iss === "supabase" && ["service_role", "anon"].includes(payload.role);
  } catch { /* not a JWT */ }

  if (!isTriggerSecret && !isSupabaseJwt) {
    return jsonResponse({ error: "Unauthorized" }, 401);
  }

  try {
    const result = await runPipeline();
    const statusCode = result.status === "error" ? 500 : 200;
    return jsonResponse(result, statusCode);
  } catch (error) {
    console.error("Pipeline failed:", error);
    return jsonResponse(
      { status: "error", message: error instanceof Error ? error.message : "Unknown error" },
      500
    );
  }
});
