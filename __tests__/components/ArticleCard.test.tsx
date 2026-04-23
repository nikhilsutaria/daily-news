import ArticleCard from "@/components/ArticleCard";
import { Article } from "@/types";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

const mockArticle: Article = {
  id: 111,
  title: "Test Article Title",
  url: "https://example.com/article",
  summary: "This is the article summary paragraph.",
  hn_score: 150,
  author: "testuser",
  created_at: "2024-01-01T00:00:00.000Z",
  summarized_at: new Date().toISOString(),
};

describe("ArticleCard", () => {
  it("renders title, summary, score, and author", () => {
    render(<ArticleCard article={mockArticle} />);

    expect(screen.getByText("Test Article Title")).toBeInTheDocument();
    expect(screen.getByText("This is the article summary paragraph.")).toBeInTheDocument();
    expect(screen.getByText("150 pts")).toBeInTheDocument();
    expect(screen.getByText("by testuser")).toBeInTheDocument();
  });

  it("renders title as a link when URL is present", () => {
    render(<ArticleCard article={mockArticle} />);

    const link = screen.getByText("Test Article Title");
    expect(link.tagName).toBe("A");
    expect(link).toHaveAttribute("href", "https://example.com/article");
    expect(link).toHaveAttribute("target", "_blank");
  });

  it("renders title as span when URL is null", () => {
    const articleNoUrl = { ...mockArticle, url: null };
    render(<ArticleCard article={articleNoUrl} />);

    const title = screen.getByText("Test Article Title");
    expect(title.tagName).toBe("SPAN");
  });
});
