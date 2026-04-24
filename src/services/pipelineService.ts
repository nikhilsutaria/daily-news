import { createLogger } from "@/lib/logger";
import { IArticleRepository } from "@/repositories/interfaces";
import { PipelineResult } from "@/types";
import {
  IContentExtractor,
  IHackerNewsService,
  IPipelineService,
  ISummarizerService,
} from "./interfaces";

const log = createLogger("PipelineService");

export class PipelineService implements IPipelineService {
  constructor(
    private hnService: IHackerNewsService,
    private extractor: IContentExtractor,
    private summarizer: ISummarizerService,
    private articleRepo: IArticleRepository
  ) {}

  async run(): Promise<PipelineResult> {
    log.info("Pipeline started");

    try {
      const topId = await this.hnService.getTopStoryId();

      const existing = await this.articleRepo.findById(topId);
      if (existing) {
        log.info("Article already exists, skipping", { storyId: topId });
        return {
          status: "skipped",
          article: existing,
          message: `Article ${topId} already summarized`,
        };
      }

      const story = await this.hnService.getStory(topId);

      if (!story.url) {
        log.warn("Story has no external URL", { storyId: topId, title: story.title });
        return {
          status: "skipped",
          message: `Story ${topId} has no external URL`,
        };
      }

      const content = await this.extractor.extract(story.url);

      if (!content) {
        log.error("Content extraction returned empty", null, { storyId: topId, url: story.url });
        return {
          status: "error",
          message: `Failed to extract content from ${story.url}`,
        };
      }

      const summary = await this.summarizer.summarize(story.title, content);

      const article = await this.articleRepo.save({
        id: story.id,
        title: story.title,
        url: story.url,
        summary,
        hn_score: story.score,
        author: story.by,
        created_at: new Date(story.time * 1000).toISOString(),
      });

      log.info("Pipeline completed successfully", { storyId: topId, title: story.title });
      return {
        status: "created",
        article,
        message: `Successfully summarized: ${story.title}`,
      };
    } catch (error) {
      log.error("Pipeline failed with exception", error);
      return {
        status: "error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}
