import EmptyState from "@/components/EmptyState";
import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";

describe("EmptyState", () => {
  it("renders empty state message", () => {
    render(<EmptyState />);

    expect(screen.getByText("No articles yet.")).toBeInTheDocument();
    expect(
      screen.getByText(
        "The daily summarizer runs automatically, or you can trigger it manually."
      )
    ).toBeInTheDocument();
  });
});
