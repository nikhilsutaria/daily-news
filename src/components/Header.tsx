export default function Header() {
  return (
    <header className="border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950">
      <div className="max-w-3xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">
          Daily News
        </h1>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          AI-summarized Hacker News top stories
        </p>
      </div>
    </header>
  );
}
