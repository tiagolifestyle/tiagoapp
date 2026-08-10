import { createServerSupabaseClient } from "@/lib/supabase/server";
import { ExerciseLibraryView } from "./ExerciseLibraryView";

export default async function ExercisesPage() {
  const supabase = await createServerSupabaseClient();
  const { data: exercises } = await supabase.from("exercises").select("*").order("name", { ascending: true });

  return <ExerciseLibraryView initialExercises={exercises ?? []} />;
}
