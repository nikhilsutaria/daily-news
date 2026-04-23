import { HNStory } from "@/types";
import { IHackerNewsService } from "./interfaces";

const HN_API_BASE = "https://hacker-news.firebaseio.com/v0";

export class HackerNewsService implements IHackerNewsService {
  async getTopStoryId(): Promise<number> {
    const response = await fetch(`${HN_API_BASE}/topstories.json`);

    if (!response.ok) {
      throw new Error(`HN API error: ${response.status}`);
    }

    const ids: number[] = await response.json();

    if (!ids || ids.length === 0) {
      throw new Error("No top stories found");
    }

    return ids[0];
  }

  async getStory(id: number): Promise<HNStory> {
    const response = await fetch(`${HN_API_BASE}/item/${id}.json`);

    if (!response.ok) {
      throw new Error(`HN API error fetching story ${id}: ${response.status}`);
    }

    const story = await response.json();

    if (!story) {
      throw new Error(`Story ${id} not found`);
    }

    return story;
  }
}
