import { ContentExtractor } from "@/services/contentExtractor";

describe("ContentExtractor", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("fetches content from Jina Reader API", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => "Article content here",
    });

    const extractor = new ContentExtractor();
    const result = await extractor.extract("https://example.com/article");

    expect(result).toBe("Article content here");
    expect(global.fetch).toHaveBeenCalledWith(
      "https://r.jina.ai/https%3A%2F%2Fexample.com%2Farticle",
      { headers: { Accept: "text/plain" } }
    );
  });

  it("adds authorization header when API key is provided", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => "Content",
    });

    const extractor = new ContentExtractor("my-api-key");
    await extractor.extract("https://example.com");

    expect(global.fetch).toHaveBeenCalledWith(
      expect.any(String),
      {
        headers: {
          Accept: "text/plain",
          Authorization: "Bearer my-api-key",
        },
      }
    );
  });

  it("truncates content exceeding 10000 characters", async () => {
    const longContent = "a".repeat(15000);
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      text: async () => longContent,
    });

    const extractor = new ContentExtractor();
    const result = await extractor.extract("https://example.com");

    expect(result.length).toBe(10000);
  });

  it("returns empty string on non-OK response", async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: false,
      status: 500,
    });

    const extractor = new ContentExtractor();
    const result = await extractor.extract("https://example.com");

    expect(result).toBe("");
  });

  it("returns empty string on fetch error", async () => {
    (global.fetch as jest.Mock).mockRejectedValue(new Error("Network error"));

    const extractor = new ContentExtractor();
    const result = await extractor.extract("https://example.com");

    expect(result).toBe("");
  });
});
