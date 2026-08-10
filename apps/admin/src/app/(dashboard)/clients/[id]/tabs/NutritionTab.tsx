"use client";

import { useEffect, useState } from "react";
import { Plus } from "lucide-react";
import type { Meal, MealItem, NutritionPlan } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { Card } from "@/components/Card";
import { StatusBadge } from "@/components/StatusBadge";

interface EditableMeal extends Meal {
  items: MealItem[];
}

const MACRO_FIELDS = [
  { key: "calories", label: "Calorias" },
  { key: "protein_g", label: "Proteína (g)" },
  { key: "carbs_g", label: "Hidratos (g)" },
  { key: "fat_g", label: "Gordura (g)" },
  { key: "water_ml", label: "Água (ml)" },
] as const;

export function NutritionTab({ clientId }: { clientId: string }) {
  const [plans, setPlans] = useState<NutritionPlan[]>([]);
  const [activePlanId, setActivePlanId] = useState<string | null>(null);
  const [meals, setMeals] = useState<EditableMeal[]>([]);
  const [macros, setMacros] = useState<Partial<NutritionPlan>>({});
  const [saving, setSaving] = useState(false);

  async function loadPlans() {
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase
      .from("nutrition_plans")
      .select("*")
      .eq("client_id", clientId)
      .order("created_at", { ascending: false });
    setPlans((data ?? []) as NutritionPlan[]);
  }

  useEffect(() => {
    loadPlans();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clientId]);

  async function openPlan(plan: NutritionPlan) {
    setActivePlanId(plan.id);
    setMacros(plan);
    const supabase = createBrowserSupabaseClient();
    const { data } = await supabase
      .from("meals")
      .select("*, items:meal_items(*)")
      .eq("nutrition_plan_id", plan.id)
      .order("order_index", { ascending: true });
    setMeals((data ?? []) as EditableMeal[]);
  }

  async function createPlan() {
    const supabase = createBrowserSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const { data: plan } = await supabase
      .from("nutrition_plans")
      .insert({ client_id: clientId, name: "Novo plano alimentar", status: "draft", created_by: user?.id })
      .select()
      .single();
    if (plan) {
      await loadPlans();
      openPlan(plan as NutritionPlan);
    }
  }

  function addMeal() {
    setMeals((prev) => [
      ...prev,
      { id: `tmp-${Date.now()}`, nutrition_plan_id: activePlanId!, name: "Nova refeição", time: null, order_index: prev.length, notes: null, items: [] },
    ]);
  }

  function addItem(mealIndex: number) {
    setMeals((prev) =>
      prev.map((meal, index) =>
        index === mealIndex
          ? { ...meal, items: [...meal.items, { id: `tmp-${Date.now()}`, meal_id: meal.id, food_name: "", quantity: null, unit: null, notes: null }] }
          : meal
      )
    );
  }

  async function handleSave() {
    if (!activePlanId) return;
    setSaving(true);
    const supabase = createBrowserSupabaseClient();

    await supabase.from("nutrition_plans").update(macros).eq("id", activePlanId);

    for (const meal of meals) {
      const isNewMeal = meal.id.startsWith("tmp-");
      const { items, ...mealData } = meal;
      let mealId = meal.id;

      if (isNewMeal) {
        const { data: inserted } = await supabase
          .from("meals")
          .insert({ ...mealData, id: undefined, nutrition_plan_id: activePlanId })
          .select()
          .single();
        mealId = inserted?.id ?? mealId;
      } else {
        await supabase.from("meals").update(mealData).eq("id", meal.id);
      }

      for (const item of items) {
        if (item.id.startsWith("tmp-")) {
          await supabase.from("meal_items").insert({ ...item, id: undefined, meal_id: mealId });
        } else {
          await supabase.from("meal_items").update(item).eq("id", item.id);
        }
      }
    }

    await loadPlans();
    setSaving(false);
  }

  const activePlan = plans.find((plan) => plan.id === activePlanId);

  return (
    <div className="flex flex-col gap-4">
      <button
        onClick={createPlan}
        className="flex w-fit items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90"
      >
        <Plus size={16} />
        Criar plano alimentar
      </button>

      <div className="flex flex-col gap-3">
        {plans.map((plan) => (
          <button
            key={plan.id}
            onClick={() => openPlan(plan)}
            className={`flex items-center justify-between rounded-2xl border p-5 text-left transition ${
              activePlanId === plan.id ? "border-accent bg-surface-elevated" : "border-border bg-surface hover:bg-surface-elevated"
            }`}
          >
            <span className="font-medium text-foreground">{plan.name}</span>
            <StatusBadge status={plan.status} />
          </button>
        ))}
      </div>

      {activePlan && (
        <Card className="flex flex-col gap-6">
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-5">
            {MACRO_FIELDS.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <label className="text-xs font-medium text-muted">{field.label}</label>
                <input
                  type="number"
                  value={(macros[field.key] as number | null) ?? ""}
                  onChange={(event) => setMacros((prev) => ({ ...prev, [field.key]: Number(event.target.value) || null }))}
                  className="rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                />
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-4">
            {meals.map((meal, mealIndex) => (
              <div key={meal.id} className="rounded-2xl border border-border p-4">
                <input
                  value={meal.name}
                  onChange={(event) =>
                    setMeals((prev) => prev.map((m, i) => (i === mealIndex ? { ...m, name: event.target.value } : m)))
                  }
                  className="mb-3 w-full bg-transparent text-base font-medium text-foreground outline-none"
                />
                {meal.items.map((item, itemIndex) => (
                  <div key={item.id} className="mb-2 flex items-center gap-2">
                    <input
                      placeholder="Alimento"
                      value={item.food_name}
                      onChange={(event) =>
                        setMeals((prev) =>
                          prev.map((m, i) =>
                            i === mealIndex
                              ? { ...m, items: m.items.map((it, j) => (j === itemIndex ? { ...it, food_name: event.target.value } : it)) }
                              : m
                          )
                        )
                      }
                      className="flex-1 rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                    />
                    <input
                      placeholder="Qtd."
                      value={item.quantity ?? ""}
                      onChange={(event) =>
                        setMeals((prev) =>
                          prev.map((m, i) =>
                            i === mealIndex
                              ? {
                                  ...m,
                                  items: m.items.map((it, j) =>
                                    j === itemIndex ? { ...it, quantity: Number(event.target.value) || null } : it
                                  ),
                                }
                              : m
                          )
                        )
                      }
                      className="w-20 rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                    />
                    <input
                      placeholder="un."
                      value={item.unit ?? ""}
                      onChange={(event) =>
                        setMeals((prev) =>
                          prev.map((m, i) =>
                            i === mealIndex
                              ? { ...m, items: m.items.map((it, j) => (j === itemIndex ? { ...it, unit: event.target.value } : it)) }
                              : m
                          )
                        )
                      }
                      className="w-16 rounded-xl border border-border bg-surface-elevated px-3 py-2 text-sm text-foreground outline-none focus:border-accent"
                    />
                  </div>
                ))}
                <button onClick={() => addItem(mealIndex)} className="mt-1 flex items-center gap-1 text-xs text-accent">
                  <Plus size={14} /> Adicionar alimento
                </button>
              </div>
            ))}

            <button onClick={addMeal} className="flex w-fit items-center gap-2 text-sm text-accent">
              <Plus size={16} /> Adicionar refeição
            </button>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="w-fit rounded-2xl bg-accent px-6 py-2.5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
          >
            {saving ? "A guardar…" : "Guardar plano"}
          </button>
        </Card>
      )}
    </div>
  );
}
