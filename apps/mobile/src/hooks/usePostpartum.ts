import { useCallback, useEffect, useState } from "react";
import type { BabySex, DeliveryType, DiastasisAssessment, PelvicFloorAssessment, PostpartumProfile } from "@tiagolifestyle/shared";
import { supabase } from "@/lib/supabase";

export interface PostpartumProfileInput {
  birth_date: string | null;
  delivery_type: DeliveryType | null;
  gestational_weeks: number | null;
  first_child: boolean | null;
  baby_sex: BabySex | null;
  breastfeeding: boolean | null;
  complications: string | null;
}

export interface PelvicFloorInput {
  stress_incontinence: boolean;
  urgency_incontinence: boolean;
  pelvic_pain: boolean;
  notes: string | null;
}

export interface DiastasisInput {
  supraumbilical_cm: number | null;
  umbilical_cm: number | null;
  infraumbilical_cm: number | null;
  notes: string | null;
}

export function usePostpartum(clientId: string | undefined) {
  const [profile, setProfile] = useState<PostpartumProfile | null>(null);
  const [pelvicFloor, setPelvicFloor] = useState<PelvicFloorAssessment[]>([]);
  const [diastasis, setDiastasis] = useState<DiastasisAssessment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const load = useCallback(async () => {
    if (!clientId) return;
    setIsLoading(true);

    const [profileResult, pelvicResult, diastasisResult] = await Promise.all([
      supabase.from("postpartum_profiles").select("*").eq("client_id", clientId).maybeSingle(),
      supabase
        .from("pelvic_floor_assessments")
        .select("*")
        .eq("client_id", clientId)
        .order("assessed_at", { ascending: false })
        .limit(30),
      supabase
        .from("diastasis_assessments")
        .select("*")
        .eq("client_id", clientId)
        .order("assessed_at", { ascending: false })
        .limit(30),
    ]);

    setProfile((profileResult.data as PostpartumProfile | null) ?? null);
    setPelvicFloor((pelvicResult.data ?? []) as PelvicFloorAssessment[]);
    setDiastasis((diastasisResult.data ?? []) as DiastasisAssessment[]);
    setIsLoading(false);
  }, [clientId]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveProfile(values: PostpartumProfileInput) {
    if (!clientId) return;
    await supabase.from("postpartum_profiles").upsert({ client_id: clientId, ...values }, { onConflict: "client_id" });
    await load();
  }

  async function addPelvicFloorAssessment(values: PelvicFloorInput) {
    if (!clientId) return;
    await supabase.from("pelvic_floor_assessments").insert({ client_id: clientId, ...values });
    await load();
  }

  async function addDiastasisAssessment(values: DiastasisInput) {
    if (!clientId) return;
    await supabase.from("diastasis_assessments").insert({ client_id: clientId, ...values });
    await load();
  }

  return {
    profile,
    pelvicFloor,
    diastasis,
    isLoading,
    refresh: load,
    saveProfile,
    addPelvicFloorAssessment,
    addDiastasisAssessment,
  };
}
