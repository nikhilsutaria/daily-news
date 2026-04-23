import { IContentExtractor } from "./interfaces";

const MAX_CONTENT_LENGTH = 10000;

export class ContentExtractor implements IContentExtractor {
  constructor(private apiKey?: string) {}

  async extract(url: string): Promise<string> {
    const headers: Record<string, string> = {
      Accept: "text/plain",
    };

    if (this.apiKey) {
      headers["Authorization"] = `Bearer ${this.apiKey}`;
    }

    try {
      const response = await fetch(
        `https://r.jina.ai/${encodeURIComponent(url)}`,
        { headers }
      );

      if (!response.ok) {
        return "";
      }

      const text = await response.text();
      return text.slice(0, MAX_CONTENT_LENGTH);
    } catch {
      return "";
    }
  }
}
