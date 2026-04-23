export default function Loading() {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-zinc-100 dark:bg-zinc-800 rounded-lg h-40"
        />
      ))}
    </div>
  );
}
