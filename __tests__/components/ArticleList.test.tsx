import ArticleList from "@/components/ArticleList";
import { Article } from "@/types";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

const mockArticles: Article[] = [
  {
    id: 1,
    title: "First Article",
    url: "https://example.com/1",
    summary: "Summary one",
    hn_score: 100,
    author: "user1",
    created_at: "2024-01-01T00:00:00.000Z",
    summarized_at: "2024-01-01T01:00:00.000Z",
  },
  {
    id: 2,
    title: "Second Article",
    url: "https://example.com/2",
    summary: "Summary two",
    hn_score: 200,
    author: "user2",
    created_at: "2024-01-02T00:00:00.000Z",
    summarized_at: "2024-01-02T01:00:00.000Z",
  },
];

describe("ArticleList", () => {
  it("renders multiple article cards", () => {
    render(<ArticleList articles={mockArticles} />);

    expect(screen.getByText("First Article")).toBeInTheDocument();
    expect(screen.getByText("Second Article")).toBeInTheDocument();
  });

  it("renders empty state when no articles", () => {
    render(<ArticleList articles={[]} />);

    expect(screen.getByText("No articles yet.")).toBeInTheDocument();
  });
});
