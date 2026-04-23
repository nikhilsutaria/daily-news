import { IArticleRepository } from "@/repositories/interfaces";
import {
    IContentExtractor,
    IHackerNewsService,
    ISummarizerService,
} from "@/services/interfaces";
import { PipelineService } from "@/services/pipelineService";
import { Article, HNStory } from "@/types";

const mockStory: HNStory = {
  id: 111,
  title: "Test Story",
  url: "https://example.com/story",
  score: 100,
  by: "testauthor",
  time: 1704067200,
  type: "story",
};

const mockArticle: Article = {
  id: 111,
  title: "Test Story",
  url: "https://example.com/story",
  summary: "This is the summary.",
  hn_score: 100,
  author: "testauthor",
  created_at: "2024-01-01T00:00:00.000Z",
  summarized_at: "2024-01-01T01:00:00.000Z",
};

function createMockServices() {
  const hnService: jest.Mocked<IHackerNewsService> = {
    getTopStoryId: jest.fn().mockResolvedValue(111),
    getStory: jest.fn().mockResolvedValue(mockStory),
  };

  const extractor: jest.Mocked<IContentExtractor> = {
    extract: jest.fn().mockResolvedValue("Article content here"),
  };

  const summarizer: jest.Mocked<ISummarizerService> = {
    summarize: jest.fn().mockResolvedValue("This is the summary."),
  };

  const articleRepo: jest.Mocked<IArticleRepository> = {
    findById: jest.fn().mockResolvedValue(null),
    save: jest.fn().mockResolvedValue(mockArticle),
    findRecent: jest.fn().mockResolvedValue([]),
  };

  return { hnService, extractor, summarizer, articleRepo };
}

describe("PipelineService", () => {
  it("creates article on happy path", async () => {
    const { hnService, extractor, summarizer, articleRepo } = createMockServices();
    const pipeline = new PipelineService(hnService, extractor, summarizer, articleRepo);

    const result = await pipeline.run();

    expect(result.status).toBe("created");
    expect(result.article).toEqual(mockArticle);
    expect(hnService.getTopStoryId).toHaveBeenCalled();
    expect(articleRepo.findById).toHaveBeenCalledWith(111);
    expect(hnService.getStory).toHaveBeenCalledWith(111);
    expect(extractor.extract).toHaveBeenCalledWith("https://example.com/story");
    expect(summarizer.summarize).toHaveBeenCalledWith("Test Story", "Article content here");
    expect(articleRepo.save).toHaveBeenCalled();
  });

  it("skips when article already exists", async () => {
    const { hnService, extractor, summarizer, articleRepo } = createMockServices();
    articleRepo.findById.mockResolvedValue(mockArticle);
    const pipeline = new PipelineService(hnService, extractor, summarizer, articleRepo);

    const result = await pipeline.run();

    expect(result.status).toBe("skipped");
    expect(result.message).toContain("already summarized");
    expect(hnService.getStory).not.toHaveBeenCalled();
    expect(extractor.extract).not.toHaveBeenCalled();
    expect(summarizer.summarize).not.toHaveBeenCalled();
  });

  it("skips when story has no URL", async () => {
    const { hnService, extractor, summarizer, articleRepo } = createMockServices();
    hnService.getStory.mockResolvedValue({ ...mockStory, url: undefined });
    const pipeline = new PipelineService(hnService, extractor, summarizer, articleRepo);

    const result = await pipeline.run();

    expect(result.status).toBe("skipped");
    expect(result.message).toContain("no external URL");
    expect(extractor.extract).not.toHaveBeenCalled();
  });

  it("returns error when content extraction fails", async () => {
    const { hnService, extractor, summarizer, articleRepo } = createMockServices();
    extractor.extract.mockResolvedValue("");
    const pipeline = new PipelineService(hnService, extractor, summarizer, articleRepo);

    const result = await pipeline.run();

    expect(result.status).toBe("error");
    expect(result.message).toContain("Failed to extract content");
    expect(summarizer.summarize).not.toHaveBeenCalled();
  });

  it("returns error when HN API fails", async () => {
    const { hnService, extractor, summarizer, articleRepo } = createMockServices();
    hnService.getTopStoryId.mockRejectedValue(new Error("HN API down"));
    const pipeline = new PipelineService(hnService, extractor, summarizer, articleRepo);

    const result = await pipeline.run();

    expect(result.status).toBe("error");
    expect(result.message).toBe("HN API down");
  });

  it("returns error when Gemini fails", async () => {
    const { hnService, extractor, summarizer, articleRepo } = createMockServices();
    summarizer.summarize.mockRejectedValue(new Error("Rate limited"));
    const pipeline = new PipelineService(hnService, extractor, summarizer, articleRepo);

    const result = await pipeline.run();

    expect(result.status).toBe("error");
    expect(result.message).toBe("Rate limited");
  });

  it("returns error when DB save fails", async () => {
    const { hnService, extractor, summarizer, articleRepo } = createMockServices();
    articleRepo.save.mockRejectedValue(new Error("DB insert failed"));
    const pipeline = new PipelineService(hnService, extractor, summarizer, articleRepo);

    const result = await pipeline.run();

    expect(result.status).toBe("error");
    expect(result.message).toBe("DB insert failed");
  });
});
