"use client";

import { useEffect, useState } from "react";
import type { BabySex, DeliveryType, DiastasisAssessment, PelvicFloorAssessment, PostpartumProfile } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Card } from "@/components/Card";

const SUB_TABS = [
  { key: "birth", label: "Parto" },
  { key: "pelvicFloor", label: "Soalho Pélvico" },
  { key: "diastasis", label: "Diástase" },
] as const;

type SubTabKey = (typeof SUB_TABS)[number]["key"];

const DELIVERY_LABELS: Record<DeliveryType, string> = {
  vaginal: "Normal",
  cesarean: "Cesariana",
};

const BABY_SEX_LABELS: Record<BabySex, string> = {
  boy: "Menino",
  girl: "Menina",
  twins: "Gémeos",
};

function yesNo(value: boolean | null) {
  if (value == null) return "—";
  return value ? "Sim" : "Não";
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2.5 last:border-b-0">
      <span className="text-sm text-muted">{label}</span>
      <span className="text-sm font-medium text-foreground">{value}</span>
    </div>
  );
}

type TriState = "" | "yes" | "no";

function triStateToValue(value: TriState): boolean | null {
  if (value === "yes") return true;
  if (value === "no") return false;
  return null;
}

function valueToTriState(value: boolean | null): TriState {
  if (value === true) return "yes";
  if (value === false) return "no";
  return "";
}

function FunctionalSelect({ label, value, onChange }: { label: string; value: TriState; onChange: (value: TriState) => void }) {
  return (
    <div className="flex flex-1 flex-col gap-2">
      <label className="text-sm font-medium text-muted">{label}</label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value as TriState)}
        className="rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
      >
        <option value="">Não avaliado</option>
        <option value="yes">Sim</option>
        <option value="no">Não</option>
      </select>
    </div>
  );
}

export function PostpartumTab({ clientId }: { clientId: string }) {
  const [subTab, setSubTab] = useState<SubTabKey>("birth");
  const [profile, setProfile] = useState<PostpartumProfile | null>(null);
  const [pelvicFloor, setPelvicFloor] = useState<PelvicFloorAssessment[]>([]);
  const [diastasis, setDiastasis] = useState<DiastasisAssessment[]>([]);

  const [supraFunctional, setSupraFunctional] = useState<TriState>("");
  const [umbilicalFunctional, setUmbilicalFunctional] = useState<TriState>("");
  const [infraFunctional, setInfraFunctional] = useState<TriState>("");
  const [savingFunctional, setSavingFunctional] = useState(false);

  useEffect(() => {
    if (!profile) return;
    setSupraFunctional(valueToTriState(profile.supraumbilical_functional));
    setUmbilicalFunctional(valueToTriState(profile.umbilical_functional));
    setInfraFunctional(valueToTriState(profile.infraumbilical_functional));
  }, [profile]);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();

    supabase
      .from("postpartum_profiles")
      .select("*")
      .eq("client_id", clientId)
      .maybeSingle()
      .then(({ data }) => setProfile((data as PostpartumProfile | null) ?? null));

    supabase
      .from("pelvic_floor_assessments")
      .select("*")
      .eq("client_id", clientId)
      .order("assessed_at", { ascending: false })
      .then(({ data }) => setPelvicFloor((data ?? []) as PelvicFloorAssessment[]));

    supabase
      .from("diastasis_assessments")
      .select("*")
      .eq("client_id", clientId)
      .order("assessed_at", { ascending: false })
      .then(({ data }) => setDiastasis((data ?? []) as DiastasisAssessment[]));
  }, [clientId]);

  async function handleSaveFunctional() {
    setSavingFunctional(true);
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase
      .from("postpartum_profiles")
      .upsert(
        {
          client_id: clientId,
          supraumbilical_functional: triStateToValue(supraFunctional),
          umbilical_functional: triStateToValue(umbilicalFunctional),
          infraumbilical_functional: triStateToValue(infraFunctional),
        },
        { onConflict: "client_id" }
      )
      .select("*")
      .single();
    setProfile((data as PostpartumProfile | null) ?? null);
    setSavingFunctional(false);
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2">
        {SUB_TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSubTab(tab.key)}
            className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
              subTab === tab.key ? "border-accent text-accent" : "border-border text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {subTab === "birth" && (
        <Card className="max-w-xl p-0">
          <div className="px-6 py-1">
            <Field label="Data do parto" value={profile?.birth_date ?? "—"} />
            <Field label="Tipo de parto" value={profile?.delivery_type ? DELIVERY_LABELS[profile.delivery_type] : "—"} />
            <Field label="Semanas de gestação" value={profile?.gestational_weeks != null ? String(profile.gestational_weeks) : "—"} />
            <Field label="Primeiro filho" value={yesNo(profile?.first_child ?? null)} />
            <Field label="Sexo do bebé" value={profile?.baby_sex ? BABY_SEX_LABELS[profile.baby_sex] : "—"} />
            <Field label="Em lactância" value={yesNo(profile?.breastfeeding ?? null)} />
            <Field label="Complicações" value={profile?.complications ?? "—"} />
          </div>
          {!profile && <p className="px-6 py-4 text-sm text-muted">O cliente ainda não preencheu os dados do parto.</p>}
        </Card>
      )}

      {subTab === "pelvicFloor" && (
        <Card className="divide-y divide-border p-0">
          {pelvicFloor.length === 0 && <p className="px-6 py-6 text-sm text-muted">Sem avaliações ainda.</p>}
          {pelvicFloor.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-1 px-6 py-3 text-sm">
              <span className="text-muted">{entry.assessed_at}</span>
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                <span className="text-foreground">Perda de urina ao esforço: <span className="font-medium">{yesNo(entry.stress_incontinence)}</span></span>
                <span className="text-foreground">Urgência urinária: <span className="font-medium">{yesNo(entry.urgency_incontinence)}</span></span>
                <span className="text-foreground">Dor pélvica: <span className="font-medium">{yesNo(entry.pelvic_pain)}</span></span>
              </div>
              {entry.notes && <span className="text-muted">{entry.notes}</span>}
            </div>
          ))}
        </Card>
      )}

      {subTab === "diastasis" && (
        <>
          <Card className="max-w-xl gap-4">
            <p className="text-sm font-medium text-foreground">Funcional?</p>
            <div className="flex flex-wrap gap-4">
              <FunctionalSelect label="Separação supraumbilical" value={supraFunctional} onChange={setSupraFunctional} />
              <FunctionalSelect label="Separação umbilical" value={umbilicalFunctional} onChange={setUmbilicalFunctional} />
              <FunctionalSelect label="Separação infraumbilical" value={infraFunctional} onChange={setInfraFunctional} />
            </div>
            <button
              onClick={handleSaveFunctional}
              disabled={savingFunctional}
              className="self-start rounded-2xl bg-accent px-6 py-2.5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
            >
              {savingFunctional ? "A guardar…" : "Guardar"}
            </button>
          </Card>

          <Card className="divide-y divide-border p-0">
            {diastasis.length === 0 && <p className="px-6 py-6 text-sm text-muted">Sem avaliações ainda.</p>}
          {diastasis.map((entry) => (
            <div key={entry.id} className="flex flex-col gap-1 px-6 py-3 text-sm">
              <span className="text-muted">{entry.assessed_at}</span>
              <div className="flex flex-wrap gap-x-6 gap-y-1">
                {entry.supraumbilical_cm != null && (
                  <span className="text-foreground">Supraumbilical: <span className="font-medium">{entry.supraumbilical_cm} cm</span></span>
                )}
                {entry.umbilical_cm != null && (
                  <span className="text-foreground">Umbilical: <span className="font-medium">{entry.umbilical_cm} cm</span></span>
                )}
                {entry.infraumbilical_cm != null && (
                  <span className="text-foreground">Infraumbilical: <span className="font-medium">{entry.infraumbilical_cm} cm</span></span>
                )}
              </div>
              {entry.notes && <span className="text-muted">{entry.notes}</span>}
            </div>
          ))}
          </Card>
        </>
      )}
    </div>
  );
}
