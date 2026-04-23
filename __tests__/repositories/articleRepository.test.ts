import { ArticleRepository } from "@/repositories/articleRepository";
import { Article } from "@/types";

const mockArticle: Article = {
  id: 12345,
  title: "Test Article",
  url: "https://example.com/article",
  summary: "This is a test summary.",
  hn_score: 100,
  author: "testuser",
  created_at: "2024-01-01T00:00:00.000Z",
  summarized_at: "2024-01-01T01:00:00.000Z",
};

function createMockSupabase(overrides: Record<string, unknown> = {}) {
  const chainable = {
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    single: jest.fn().mockResolvedValue({ data: mockArticle, error: null }),
    ...overrides,
  };

  // Make each method return the chainable for chaining
  Object.keys(chainable).forEach((key) => {
    const fn = chainable[key as keyof typeof chainable];
    if (typeof fn === "function" && (fn as jest.Mock).mockReturnThis) {
      // Already set up via mockReturnThis or specific return
    }
  });

  return {
    from: jest.fn().mockReturnValue(chainable),
    _chain: chainable,
  };
}

describe("ArticleRepository", () => {
  describe("findById", () => {
    it("returns article when found", async () => {
      const supabase = createMockSupabase({
        maybeSingle: jest.fn().mockResolvedValue({ data: mockArticle, error: null }),
      });
      const repo = new ArticleRepository(supabase as never);

      const result = await repo.findById(12345);

      expect(result).toEqual(mockArticle);
      expect(supabase.from).toHaveBeenCalledWith("articles");
      expect(supabase._chain.eq).toHaveBeenCalledWith("id", 12345);
    });

    it("returns null when not found", async () => {
      const supabase = createMockSupabase({
        maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
      });
      const repo = new ArticleRepository(supabase as never);

      const result = await repo.findById(99999);

      expect(result).toBeNull();
    });

    it("throws on Supabase error", async () => {
      const supabase = createMockSupabase({
        maybeSingle: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "DB error" },
        }),
      });
      const repo = new ArticleRepository(supabase as never);

      await expect(repo.findById(12345)).rejects.toThrow("Failed to find article: DB error");
    });
  });

  describe("save", () => {
    it("inserts and returns article", async () => {
      const supabase = createMockSupabase({
        single: jest.fn().mockResolvedValue({ data: mockArticle, error: null }),
      });
      const repo = new ArticleRepository(supabase as never);

      const { summarized_at: _, ...input } = mockArticle;
      const result = await repo.save(input);

      expect(result).toEqual(mockArticle);
      expect(supabase._chain.insert).toHaveBeenCalledWith(input);
    });

    it("throws on Supabase error", async () => {
      const supabase = createMockSupabase({
        single: jest.fn().mockResolvedValue({
          data: null,
          error: { message: "Insert failed" },
        }),
      });
      const repo = new ArticleRepository(supabase as never);

      const { summarized_at: _, ...input } = mockArticle;
      await expect(repo.save(input)).rejects.toThrow("Failed to save article: Insert failed");
    });
  });

  describe("findRecent", () => {
    it("returns articles ordered by summarized_at", async () => {
      const articles = [mockArticle];
      const supabase = createMockSupabase();
      // Override limit to return data directly (terminal method for findRecent)
      supabase._chain.limit = jest.fn().mockResolvedValue({ data: articles, error: null });
      const repo = new ArticleRepository(supabase as never);

      const result = await repo.findRecent(10);

      expect(result).toEqual(articles);
      expect(supabase._chain.order).toHaveBeenCalledWith("summarized_at", { ascending: false });
      expect(supabase._chain.limit).toHaveBeenCalledWith(10);
    });

    it("returns empty array when no articles", async () => {
      const supabase = createMockSupabase();
      supabase._chain.limit = jest.fn().mockResolvedValue({ data: null, error: null });
      const repo = new ArticleRepository(supabase as never);

      const result = await repo.findRecent();

      expect(result).toEqual([]);
    });

    it("uses default limit of 20", async () => {
      const supabase = createMockSupabase();
      supabase._chain.limit = jest.fn().mockResolvedValue({ data: [], error: null });
      const repo = new ArticleRepository(supabase as never);

      await repo.findRecent();

      expect(supabase._chain.limit).toHaveBeenCalledWith(20);
    });

    it("throws on Supabase error", async () => {
      const supabase = createMockSupabase();
      supabase._chain.limit = jest.fn().mockResolvedValue({
        data: null,
        error: { message: "Query failed" },
      });
      const repo = new ArticleRepository(supabase as never);

      await expect(repo.findRecent()).rejects.toThrow("Failed to fetch recent articles: Query failed");
    });
  });
});
