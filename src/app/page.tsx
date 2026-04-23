import ArticleList from "@/components/ArticleList";
import TriggerButton from "@/components/TriggerButton";
import { createSupabaseClient } from "@/lib/supabase";
import { ArticleRepository } from "@/repositories/articleRepository";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function Home() {
  const supabase = createSupabaseClient();
  const repo = new ArticleRepository(supabase);
  const articles = await repo.findRecent(30);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex justify-end">
        <TriggerButton />
      </div>
      <ArticleList articles={articles} />
    </div>
  );
}
