"use client";

import { useState } from "react";
import { X } from "lucide-react";
import type { SpecialDish, SpecialDishCategory } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export const DISH_CATEGORY_LABELS: Record<SpecialDishCategory, string> = {
  breakfast: "Pequeno-almoço",
  lunch_dinner: "Almoço / Jantar",
  snack: "Lanche",
  dessert: "Sobremesa",
};

type Lang = "pt" | "es" | "en";

const LANGS: { key: Lang; label: string }[] = [
  { key: "pt", label: "Português" },
  { key: "es", label: "Español" },
  { key: "en", label: "English" },
];

interface LocalizedTexts {
  name: string;
  ingredients: string;
  preparation: string;
  notes: string;
}

function initialTexts(dish: SpecialDish | null, lang: Lang): LocalizedTexts {
  return {
    name: dish?.[`name_${lang}`] ?? "",
    ingredients: dish?.[`ingredients_${lang}`] ?? "",
    preparation: dish?.[`preparation_${lang}`] ?? "",
    notes: dish?.[`notes_${lang}`] ?? "",
  };
}

function parseOptionalNumber(value: string) {
  const trimmed = value.trim().replace(",", ".");
  if (trimmed === "") return null;
  const parsed = Number(trimmed);
  return Number.isNaN(parsed) ? null : parsed;
}

interface DishFormModalProps {
  dish: SpecialDish | null;
  onClose: () => void;
  onSaved: (dish: SpecialDish) => void;
}

export function DishFormModal({ dish, onClose, onSaved }: DishFormModalProps) {
  const [category, setCategory] = useState<SpecialDishCategory>(dish?.category ?? "lunch_dinner");
  const [texts, setTexts] = useState<Record<Lang, LocalizedTexts>>({
    pt: initialTexts(dish, "pt"),
    es: initialTexts(dish, "es"),
    en: initialTexts(dish, "en"),
  });
  const [imageUrl, setImageUrl] = useState(dish?.image_url ?? "");
  const [calories, setCalories] = useState(dish?.calories?.toString() ?? "");
  const [protein, setProtein] = useState(dish?.protein_g?.toString() ?? "");
  const [carbs, setCarbs] = useState(dish?.carbs_g?.toString() ?? "");
  const [fat, setFat] = useState(dish?.fat_g?.toString() ?? "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateText(lang: Lang, field: keyof LocalizedTexts, value: string) {
    setTexts((prev) => ({ ...prev, [lang]: { ...prev[lang], [field]: value } }));
  }

  async function handleUploadImage(file: File) {
    setUploading(true);
    setError(null);
    const supabase = createBrowserSupabaseClient();
    const safeName = file.name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `dishes/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("exercise-media").upload(path, file);
    if (uploadError) {
      setError(uploadError.message);
    } else {
      const { data } = supabase.storage.from("exercise-media").getPublicUrl(path);
      setImageUrl(data.publicUrl);
    }
    setUploading(false);
  }

  async function handleSave() {
    setSaving(true);
    setError(null);
    const supabase = createBrowserSupabaseClient();
    const caloriesValue = parseOptionalNumber(calories);

    const payload = {
      category,
      image_url: imageUrl || null,
      calories: caloriesValue == null ? null : Math.round(caloriesValue),
      protein_g: parseOptionalNumber(protein),
      carbs_g: parseOptionalNumber(carbs),
      fat_g: parseOptionalNumber(fat),
      ...Object.fromEntries(
        LANGS.flatMap(({ key }) => [
          [`name_${key}`, texts[key].name.trim()],
          [`ingredients_${key}`, texts[key].ingredients.trim() || null],
          [`preparation_${key}`, texts[key].preparation.trim() || null],
          [`notes_${key}`, texts[key].notes.trim() || null],
        ])
      ),
    };

    const query = dish
      ? supabase.from("special_dishes").update(payload).eq("id", dish.id).select().single()
      : supabase.from("special_dishes").insert(payload).select().single();

    const { data, error: saveError } = await query;
    setSaving(false);
    if (saveError) setError(saveError.message);
    else if (data) onSaved(data as SpecialDish);
  }

  const canSave = LANGS.every(({ key }) => texts[key].name.trim()) && !uploading;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-2xl border border-border bg-surface p-6">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{dish ? "Editar prato" : "Novo prato"}</h2>
          <button onClick={onClose} className="text-muted hover:text-foreground">
            <X size={20} />
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <Field label="Foto do prato">
            <div className="flex items-center gap-3">
              {imageUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={imageUrl} alt="" className="h-16 w-16 rounded-lg object-cover" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={(e) => e.target.files?.[0] && handleUploadImage(e.target.files[0])}
                className="text-sm text-muted"
              />
              {uploading && <span className="text-xs text-muted">A carregar…</span>}
            </div>
          </Field>

          <Field label="Categoria">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as SpecialDishCategory)}
              className={inputClass}
            >
              {(Object.keys(DISH_CATEGORY_LABELS) as SpecialDishCategory[]).map((key) => (
                <option key={key} value={key}>
                  {DISH_CATEGORY_LABELS[key]}
                </option>
              ))}
            </select>
          </Field>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            <Field label="Calorias">
              <input inputMode="numeric" value={calories} onChange={(e) => setCalories(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Proteína (g)">
              <input inputMode="decimal" value={protein} onChange={(e) => setProtein(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Hidratos (g)">
              <input inputMode="decimal" value={carbs} onChange={(e) => setCarbs(e.target.value)} className={inputClass} />
            </Field>
            <Field label="Gordura (g)">
              <input inputMode="decimal" value={fat} onChange={(e) => setFat(e.target.value)} className={inputClass} />
            </Field>
          </div>

          {LANGS.map(({ key, label }) => (
            <div key={key} className="flex flex-col gap-3 rounded-xl border border-border p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-accent">{label}</p>
              <Field label="Nome do prato">
                <input value={texts[key].name} onChange={(e) => updateText(key, "name", e.target.value)} className={inputClass} />
              </Field>
              <Field label="Ingredientes (um por linha, ex: Peito de frango - 150 g)">
                <textarea
                  rows={5}
                  value={texts[key].ingredients}
                  onChange={(e) => updateText(key, "ingredients", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Modo de preparação (opcional)">
                <textarea
                  rows={4}
                  value={texts[key].preparation}
                  onChange={(e) => updateText(key, "preparation", e.target.value)}
                  className={inputClass}
                />
              </Field>
              <Field label="Observação (opcional, ex: não apto para pós-parto ou intolerância à lactose)">
                <textarea
                  rows={2}
                  value={texts[key].notes}
                  onChange={(e) => updateText(key, "notes", e.target.value)}
                  className={inputClass}
                />
              </Field>
            </div>
          ))}

          {error && <p className="text-sm text-danger">{error}</p>}

          <button
            onClick={handleSave}
            disabled={saving || !canSave}
            className="mt-2 rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "A guardar…" : "Guardar prato"}
          </button>
        </div>
      </div>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-surface-elevated px-3 py-2.5 text-sm text-foreground outline-none focus:border-accent";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-medium text-muted">{label}</label>
      {children}
    </div>
  );
}
