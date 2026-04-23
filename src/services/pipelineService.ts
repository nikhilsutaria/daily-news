import { IArticleRepository } from "@/repositories/interfaces";
import { PipelineResult } from "@/types";
import {
  IContentExtractor,
  IHackerNewsService,
  IPipelineService,
  ISummarizerService,
} from "./interfaces";

export class PipelineService implements IPipelineService {
  constructor(
    private hnService: IHackerNewsService,
    private extractor: IContentExtractor,
    private summarizer: ISummarizerService,
    private articleRepo: IArticleRepository
  ) {}

  async run(): Promise<PipelineResult> {
    try {
      const topId = await this.hnService.getTopStoryId();

      const existing = await this.articleRepo.findById(topId);
      if (existing) {
        return {
          status: "skipped",
          article: existing,
          message: `Article ${topId} already summarized`,
        };
      }

      const story = await this.hnService.getStory(topId);

      if (!story.url) {
        return {
          status: "skipped",
          message: `Story ${topId} has no external URL`,
        };
      }

      const content = await this.extractor.extract(story.url);

      if (!content) {
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

      return {
        status: "created",
        article,
        message: `Successfully summarized: ${story.title}`,
      };
    } catch (error) {
      return {
        status: "error",
        message:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }
}
