import { HackerNewsService } from "@/services/hackerNewsService";

describe("HackerNewsService", () => {
  let service: HackerNewsService;
  const originalFetch = global.fetch;

  beforeEach(() => {
    service = new HackerNewsService();
    global.fetch = jest.fn();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  describe("getTopStoryId", () => {
    it("returns the first story ID", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [111, 222, 333],
      });

      const id = await service.getTopStoryId();

      expect(id).toBe(111);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://hacker-news.firebaseio.com/v0/topstories.json"
      );
    });

    it("throws on empty array", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => [],
      });

      await expect(service.getTopStoryId()).rejects.toThrow("No top stories found");
    });

    it("throws on fetch failure", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      await expect(service.getTopStoryId()).rejects.toThrow("HN API error: 500");
    });
  });

  describe("getStory", () => {
    it("returns story data", async () => {
      const mockStory = {
        id: 111,
        title: "Test Story",
        url: "https://example.com",
        score: 50,
        by: "author",
        time: 1704067200,
        type: "story",
      };

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => mockStory,
      });

      const story = await service.getStory(111);

      expect(story).toEqual(mockStory);
      expect(global.fetch).toHaveBeenCalledWith(
        "https://hacker-news.firebaseio.com/v0/item/111.json"
      );
    });

    it("throws on 404", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 404,
      });

      await expect(service.getStory(999)).rejects.toThrow(
        "HN API error fetching story 999: 404"
      );
    });

    it("throws when story is null", async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: async () => null,
      });

      await expect(service.getStory(999)).rejects.toThrow("Story 999 not found");
    });
  });
});
