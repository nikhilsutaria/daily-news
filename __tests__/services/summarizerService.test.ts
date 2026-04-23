jest.mock("@google/generative-ai", () => {
  const mockGenerateContent = jest.fn();
  return {
    GoogleGenerativeAI: jest.fn().mockImplementation(() => ({
      getGenerativeModel: jest.fn().mockReturnValue({
        generateContent: mockGenerateContent,
      }),
    })),
    __mockGenerateContent: mockGenerateContent,
  };
});

import { SummarizerService } from "@/services/summarizerService";

const { __mockGenerateContent: mockGenerateContent } =
  jest.requireMock("@google/generative-ai");

describe("SummarizerService", () => {
  let service: SummarizerService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SummarizerService("test-api-key");
  });

  it("returns summary text from Gemini", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => "This is a summary of the article.",
      },
    });

    const result = await service.summarize("Test Title", "Test content");

    expect(result).toBe("This is a summary of the article.");
    expect(mockGenerateContent).toHaveBeenCalledWith(
      "Title: Test Title\n\nContent:\nTest content"
    );
  });

  it("trims whitespace from response", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => "  Summary with whitespace  \n",
      },
    });

    const result = await service.summarize("Title", "Content");

    expect(result).toBe("Summary with whitespace");
  });

  it("throws when Gemini returns empty text", async () => {
    mockGenerateContent.mockResolvedValue({
      response: {
        text: () => "",
      },
    });

    await expect(service.summarize("Title", "Content")).rejects.toThrow(
      "Gemini returned empty response"
    );
  });

  it("throws when Gemini API fails", async () => {
    mockGenerateContent.mockRejectedValue(new Error("API rate limited"));

    await expect(service.summarize("Title", "Content")).rejects.toThrow(
      "API rate limited"
    );
  });
});
