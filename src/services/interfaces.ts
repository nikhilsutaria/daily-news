import { HNStory, PipelineResult } from "@/types";

export interface IHackerNewsService {
  getTopStoryId(): Promise<number>;
  getStory(id: number): Promise<HNStory>;
}

export interface IContentExtractor {
  extract(url: string): Promise<string>;
}

export interface ISummarizerService {
  summarize(title: string, content: string): Promise<string>;
}

export interface IPipelineService {
  run(): Promise<PipelineResult>;
}
