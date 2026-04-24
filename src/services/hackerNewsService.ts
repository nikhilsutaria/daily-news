import { createLogger } from "@/lib/logger";
import { HNStory } from "@/types";
import { IHackerNewsService } from "./interfaces";

const HN_API_BASE = "https://hacker-news.firebaseio.com/v0";
const log = createLogger("HackerNewsService");

export class HackerNewsService implements IHackerNewsService {
  async getTopStoryId(): Promise<number> {
    log.info("Fetching top story IDs");
    const response = await fetch(`${HN_API_BASE}/topstories.json`);

    if (!response.ok) {
      log.error("Top stories API failed", null, { status: response.status });
      throw new Error(`HN API error: ${response.status}`);
    }

    const ids: number[] = await response.json();

    if (!ids || ids.length === 0) {
      log.error("No top stories returned from API");
      throw new Error("No top stories found");
    }

    log.info("Got top story", { storyId: ids[0] });
    return ids[0];
  }

  async getStory(id: number): Promise<HNStory> {
    log.info("Fetching story details", { storyId: id });
    const response = await fetch(`${HN_API_BASE}/item/${id}.json`);

    if (!response.ok) {
      log.error("Story fetch failed", null, { storyId: id, status: response.status });
      throw new Error(`HN API error fetching story ${id}: ${response.status}`);
    }

    const story = await response.json();

    if (!story) {
      log.error("Story not found", null, { storyId: id });
      throw new Error(`Story ${id} not found`);
    }

    log.info("Fetched story", { storyId: id, title: story.title, url: story.url });
    return story;
  }
}
