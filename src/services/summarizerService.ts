import { GoogleGenerativeAI } from "@google/generative-ai";
import { ISummarizerService } from "./interfaces";

const SYSTEM_PROMPT = `You are a news summarizer. Given an article title and content, produce a single concise paragraph (3-5 sentences). Focus on key facts, significance, and implications. Do not include personal opinions.`;

export class SummarizerService implements ISummarizerService {
  private model;

  constructor(apiKey: string) {
    const genAI = new GoogleGenerativeAI(apiKey);
    this.model = genAI.getGenerativeModel({
      model: "gemini-2.0-flash",
      systemInstruction: SYSTEM_PROMPT,
    });
  }

  async summarize(title: string, content: string): Promise<string> {
    const prompt = `Title: ${title}\n\nContent:\n${content}`;

    const result = await this.model.generateContent(prompt);
    const response = result.response;
    const text = response.text();

    if (!text) {
      throw new Error("Gemini returned empty response");
    }

    return text.trim();
  }
}
