import { createLogger } from "@/lib/logger";
import { getEnv } from "@/config/env";
import { createSupabaseClient } from "@/lib/supabase";
import { ArticleRepository } from "@/repositories/articleRepository";
import { ContentExtractor } from "@/services/contentExtractor";
import { HackerNewsService } from "@/services/hackerNewsService";
import { PipelineService } from "@/services/pipelineService";
import { SummarizerService } from "@/services/summarizerService";
import { NextRequest, NextResponse } from "next/server";

const log = createLogger("api/trigger");

export async function POST(request: NextRequest) {
  try {
    const env = getEnv();

    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${env.triggerSecret}`) {
      log.warn("Auth failed", { headerPresent: !!authHeader });
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    log.info("Trigger request authorized");

    const supabase = createSupabaseClient();
    const pipeline = new PipelineService(
      new HackerNewsService(),
      new ContentExtractor(env.jinaApiKey),
      new SummarizerService(env.geminiApiKey),
      new ArticleRepository(supabase)
    );

    const result = await pipeline.run();

    if (result.status === "error") {
      log.error("Trigger pipeline error", null, { message: result.message });
    } else {
      log.info("Trigger pipeline completed", { status: result.status, message: result.message });
    }

    const statusCode = result.status === "error" ? 500 : 200;
    return NextResponse.json(result, { status: statusCode });
  } catch (error) {
    log.error("Trigger unhandled error", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal server error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json(
    { error: "Method not allowed. Use POST." },
    { status: 405 }
  );
}
