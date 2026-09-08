import { createServerSupabaseClient } from "@/lib/supabase/server";
import { PostpartumContentView } from "./PostpartumContentView";

export default async function PostpartumContentPage() {
  const supabase = await createServerSupabaseClient();
  const { data: cards } = await supabase
    .from("postpartum_content_cards")
    .select("*")
    .order("category", { ascending: true })
    .order("order_index", { ascending: true });

  return <PostpartumContentView initialCards={cards ?? []} />;
}
