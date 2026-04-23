export interface HNStory {
  id: number;
  title: string;
  url?: string;
  score: number;
  by: string;
  time: number;
  type: string;
}

export interface Article {
  id: number;
  title: string;
  url: string | null;
  summary: string;
  hn_score: number;
  author: string;
  created_at: string;
  summarized_at: string;
}

export interface PipelineResult {
  status: "created" | "skipped" | "error";
  article?: Article;
  message: string;
}
