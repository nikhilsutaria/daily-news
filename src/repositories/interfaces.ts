import { Article } from "@/types";

export interface IArticleRepository {
  findById(id: number): Promise<Article | null>;
  save(article: Omit<Article, "summarized_at">): Promise<Article>;
  findRecent(limit?: number): Promise<Article[]>;
}
