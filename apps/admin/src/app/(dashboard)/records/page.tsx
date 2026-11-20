import type { ClientSex, ExerciseRecord } from "@tiagolifestyle/shared";
import { createServerSupabaseClient } from "@/lib/supabase/server";
import { RecordsView, type RecordClient, type RecordExercise } from "./RecordsView";

export default async function RecordsPage() {
  const supabase = await createServerSupabaseClient();

  const [{ data: records }, { data: exercises }, { data: clients }] = await Promise.all([
    supabase.from("exercise_records").select("*").order("order_index", { ascending: true }),
    supabase.from("exercises").select("id, name, image_url").order("name", { ascending: true }),
    supabase.from("clients").select("id, sex, profiles!clients_id_fkey(full_name)"),
  ]);

  const clientRows: RecordClient[] = (clients ?? [])
    .map((client) => {
      const profile = Array.isArray(client.profiles) ? client.profiles[0] : client.profiles;
      return {
        id: client.id as string,
        sex: (client.sex as ClientSex | null) ?? null,
        name: (profile?.full_name as string | undefined) ?? "—",
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name, "pt"));

  return (
    <RecordsView
      initialRecords={(records ?? []) as ExerciseRecord[]}
      exercises={(exercises ?? []) as RecordExercise[]}
      clients={clientRows}
    />
  );
}
