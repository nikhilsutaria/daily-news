import { getEnv } from "@/config/env";
import { createSupabaseClient } from "@/lib/supabase";
import { ArticleRepository } from "@/repositories/articleRepository";
import { ContentExtractor } from "@/services/contentExtractor";
import { HackerNewsService } from "@/services/hackerNewsService";
import { PipelineService } from "@/services/pipelineService";
import { SummarizerService } from "@/services/summarizerService";
import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const env = getEnv();

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${env.cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createSupabaseClient();
  const pipeline = new PipelineService(
    new HackerNewsService(),
    new ContentExtractor(env.jinaApiKey),
    new SummarizerService(env.geminiApiKey),
    new ArticleRepository(supabase)
  );

  const result = await pipeline.run();

  const statusCode = result.status === "error" ? 500 : 200;
  return NextResponse.json(result, { status: statusCode });
}
