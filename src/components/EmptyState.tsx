export default function EmptyState() {
  return (
    <div className="text-center py-16">
      <p className="text-zinc-500 dark:text-zinc-400 text-lg">
        No articles yet.
      </p>
      <p className="text-zinc-400 dark:text-zinc-500 text-sm mt-2">
        The daily summarizer runs automatically, or you can trigger it manually.
      </p>
    </div>
  );
}
