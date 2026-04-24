import { createLogger } from "@/lib/logger";
import { Article } from "@/types";
import { SupabaseClient } from "@supabase/supabase-js";
import { IArticleRepository } from "./interfaces";

const log = createLogger("ArticleRepository");

export class ArticleRepository implements IArticleRepository {
  constructor(private supabase: SupabaseClient) {}

  async findById(id: number): Promise<Article | null> {
    log.info("Looking up article", { articleId: id });
    const { data, error } = await this.supabase
      .from("articles")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      log.error("Article lookup failed", null, { articleId: id, supabaseError: error.message });
      throw new Error(`Failed to find article: ${error.message}`);
    }

    log.info("Article lookup result", { articleId: id, found: !!data });
    return data;
  }

  async save(article: Omit<Article, "summarized_at">): Promise<Article> {
    log.info("Saving article", { articleId: article.id, title: article.title });
    const { data, error } = await this.supabase
      .from("articles")
      .insert(article)
      .select()
      .single();

    if (error) {
      log.error("Article save failed", null, { articleId: article.id, supabaseError: error.message });
      throw new Error(`Failed to save article: ${error.message}`);
    }

    log.info("Article saved", { articleId: article.id });
    return data;
  }

  async findRecent(limit: number = 20): Promise<Article[]> {
    log.info("Fetching recent articles", { limit });
    const { data, error } = await this.supabase
      .from("articles")
      .select("*")
      .order("summarized_at", { ascending: false })
      .limit(limit);

    if (error) {
      log.error("Recent articles fetch failed", null, { supabaseError: error.message });
      throw new Error(`Failed to fetch recent articles: ${error.message}`);
    }

    log.info("Fetched recent articles", { count: data?.length ?? 0 });
    return data ?? [];
  }
}
