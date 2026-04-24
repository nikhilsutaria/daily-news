import { createLogger } from "@/lib/logger";
import { IContentExtractor } from "./interfaces";

const MAX_CONTENT_LENGTH = 10000;
const log = createLogger("ContentExtractor");

export class ContentExtractor implements IContentExtractor {
  constructor(private apiKey?: string) {}

  async extract(url: string): Promise<string> {
    log.info("Extracting content", { url, hasApiKey: !!this.apiKey });

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
        log.error("Jina API returned non-OK", null, { url, status: response.status });
        return "";
      }

      const text = await response.text();
      log.info("Content extracted", { url, length: text.length, truncated: text.length > MAX_CONTENT_LENGTH });
      return text.slice(0, MAX_CONTENT_LENGTH);
    } catch (error) {
      log.error("Content extraction failed", error, { url });
      return "";
    }
  }
}
