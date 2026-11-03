import type { Habit } from "@tiagolifestyle/shared";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { MentorView } from "./MentorView";

export default async function MentorPage() {
  const supabase = await createServerSupabaseClient();
  const { data: habits } = await supabase.from("habits").select("*").order("order_index", { ascending: true });

  return <MentorView initialHabits={(habits ?? []) as Habit[]} />;
}
