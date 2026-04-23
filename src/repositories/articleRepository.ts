import { Article } from "@/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { IArticleRepository } from "./interfaces";

export class ArticleRepository implements IArticleRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: number): Promise<Article | null> {
    const { data, error } = await this.supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to find article: ${error.message}`);
    }

    return data;
  }

  async save(article: Omit<Article, "summarized_at">): Promise<Article> {
    const { data, error } = await this.supabase
      .from("articles")
      .insert(article)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to save article: ${error.message}`);
    }

    return data;
  }

  async findRecent(limit: number = 20): Promise<Article[]> {
    const { data, error } = await this.supabase
      .from("articles")
      .select("*")
      .order("summarized_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch recent articles: ${error.message}`);
    }

    return data ?? [];
  }
}
