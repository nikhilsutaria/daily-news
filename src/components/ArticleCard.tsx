import { Article } from "@/types";

function timeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const diffMs = now.getTime() - date.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffDays = Math.floor(diffHours / 24);

  if (diffDays > 0) {
    return `${diffDays}d ago`;
  }
  if (diffHours > 0) {
    return `${diffHours}h ago`;
  }
  return "just now";
}

export default function ArticleCard({ article }: { article: Article }) {
  return (
    <article className="bg-white dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-5 transition-shadow hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {article.url ? (
            <a
              href={article.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-lg font-semibold text-zinc-900 dark:text-zinc-100 hover:text-orange-600 dark:hover:text-orange-400 transition-colors"
            >
              {article.title}
            </a>
          ) : (
            <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
              {article.title}
            </span>
          )}
        </div>
        <span className="flex-shrink-0 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200">
          {article.hn_score} pts
        </span>
      </div>

      <p className="mt-3 text-zinc-600 dark:text-zinc-300 leading-relaxed">
        {article.summary}
      </p>

      <div className="mt-3 flex items-center gap-3 text-xs text-zinc-400 dark:text-zinc-500">
        <span>by {article.author}</span>
        <span aria-hidden="true">&middot;</span>
        <span>{timeAgo(article.summarized_at)}</span>
      </div>
    </article>
  );
}
