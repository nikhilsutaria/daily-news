import { Article } from "@/types";
import ArticleCard from "./ArticleCard";
import EmptyState from "./EmptyState";

export default function ArticleList({ articles }: { articles: Article[] }) {
  if (articles.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="flex flex-col gap-4">
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
}
