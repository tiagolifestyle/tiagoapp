"use client";

import { useState } from "react";
import { Plus, Pencil, Trash2, Gift, CheckCircle2 } from "lucide-react";
import { LEVELS, type Reward, type RewardRedemption } from "@tiagolifestyle/shared";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";
import { RewardFormModal } from "./RewardFormModal";

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-PT");
}

export function RewardsView({
  initialRewards,
  initialRedemptions,
  clientNames,
}: {
  initialRewards: Reward[];
  initialRedemptions: RewardRedemption[];
  clientNames: Record<string, string>;
}) {
  const [rewards, setRewards] = useState(initialRewards);
  const [redemptions, setRedemptions] = useState(initialRedemptions);
  const [editingReward, setEditingReward] = useState<Reward | null | undefined>(undefined);

  const sortedRewards = [...rewards].sort((a, b) => a.points_required - b.points_required);
  const pending = redemptions.filter((r) => !r.delivered_at);
  const delivered = redemptions.filter((r) => r.delivered_at);
  const rewardTitle = (id: string) => rewards.find((r) => r.id === id)?.title_pt ?? "Promoção eliminada";

  function handleSaved(reward: Reward) {
    setRewards((prev) => {
      const exists = prev.some((r) => r.id === reward.id);
      return exists ? prev.map((r) => (r.id === reward.id ? reward : r)) : [...prev, reward];
    });
    setEditingReward(undefined);
  }

  async function handleDelete(reward: Reward) {
    if (!confirm(`Eliminar "${reward.title_pt}"? Os resgates desta promoção também serão eliminados.`)) return;
    const supabase = createBrowserSupabaseClient();
    const { error } = await supabase.from("rewards").delete().eq("id", reward.id);
    if (!error) {
      setRewards((prev) => prev.filter((r) => r.id !== reward.id));
      setRedemptions((prev) => prev.filter((r) => r.reward_id !== reward.id));
    }
  }

  async function handleMarkDelivered(redemption: RewardRedemption) {
    const supabase = createBrowserSupabaseClient();
    const deliveredAt = new Date().toISOString();
    const { error } = await supabase
      .from("reward_redemptions")
      .update({ delivered_at: deliveredAt })
      .eq("id", redemption.id);
    if (!error) {
      setRedemptions((prev) => prev.map((r) => (r.id === redemption.id ? { ...r, delivered_at: deliveredAt } : r)));
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-semibold text-foreground">Recompensas</h1>
          <p className="mt-1 text-sm text-muted">
            Promoções que os clientes desbloqueiam com pontos (1 dia de treino concluído = 1 ponto, nunca volta a zero).
          </p>
        </div>
        <button
          onClick={() => setEditingReward(null)}
          className="flex items-center gap-2 rounded-2xl bg-accent px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90"
        >
          <Plus size={16} />
          Nova promoção
        </button>
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">
          Resgates por entregar{" "}
          {pending.length > 0 && (
            <span className="ml-1 rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-background">{pending.length}</span>
          )}
        </h2>
        {pending.length === 0 ? (
          <p className="rounded-2xl border border-border bg-surface p-5 text-sm text-muted">Não há resgates pendentes.</p>
        ) : (
          pending.map((redemption) => (
            <div
              key={redemption.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent bg-surface p-5"
            >
              <div>
                <p className="font-medium text-foreground">{clientNames[redemption.client_id] ?? "Cliente"}</p>
                <p className="mt-0.5 text-sm text-muted">
                  {rewardTitle(redemption.reward_id)} · resgatado em {formatDate(redemption.redeemed_at)}
                </p>
              </div>
              <button
                onClick={() => handleMarkDelivered(redemption)}
                className="flex items-center gap-2 rounded-2xl border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-surface-elevated"
              >
                <CheckCircle2 size={16} className="text-success" />
                Marcar como entregue
              </button>
            </div>
          ))
        )}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Promoções</h2>
        {sortedRewards.length === 0 && (
          <p className="rounded-2xl border border-border bg-surface p-6 text-center text-sm text-muted">
            Ainda não criaste nenhuma promoção.
          </p>
        )}
        {sortedRewards.map((reward) => (
          <div key={reward.id} className="flex items-start gap-4 rounded-2xl border border-border bg-surface p-5">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-surface-elevated">
              <Gift size={20} className="text-accent" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-foreground">{reward.title_pt}</p>
              {reward.description_pt && <p className="mt-1 line-clamp-2 text-sm text-muted">{reward.description_pt}</p>}
              <p className="mt-1 text-xs font-semibold text-accent">{reward.points_required} pontos</p>
              {reward.unlocks_special_dishes && (
                <p className="mt-1 text-xs font-medium text-success">Desbloqueia os Pratos especiais (entrega automática)</p>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-muted">
              <button onClick={() => setEditingReward(reward)} className="flex items-center gap-1 hover:text-foreground">
                <Pencil size={14} /> Editar
              </button>
              <button onClick={() => handleDelete(reward)} className="flex items-center gap-1 hover:text-danger">
                <Trash2 size={14} /> Eliminar
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        <h2 className="text-lg font-semibold text-foreground">Níveis</h2>
        <div className="flex flex-wrap gap-3">
          {LEVELS.map((level, index) => {
            const nextLevel = LEVELS[index + 1];
            return (
              <div key={level.key} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/levels/${level.key}.png`} alt="" className="h-10 w-10" />
                <div>
                  <p className="text-sm font-semibold" style={{ color: level.color }}>
                    {level.name}
                  </p>
                  <p className="text-xs text-muted">
                    {nextLevel ? `${level.minPoints}–${nextLevel.minPoints - 1}` : `${level.minPoints}+`} pontos
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {delivered.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-foreground">Histórico de entregas</h2>
          {delivered.map((redemption) => (
            <div key={redemption.id} className="rounded-2xl border border-border bg-surface px-5 py-3 text-sm">
              <span className="font-medium text-foreground">{clientNames[redemption.client_id] ?? "Cliente"}</span>
              <span className="text-muted">
                {" "}
                · {rewardTitle(redemption.reward_id)} · entregue em {formatDate(redemption.delivered_at!)}
              </span>
            </div>
          ))}
        </div>
      )}

      {editingReward !== undefined && (
        <RewardFormModal reward={editingReward} onClose={() => setEditingReward(undefined)} onSaved={handleSaved} />
      )}
    </div>
  );
}
