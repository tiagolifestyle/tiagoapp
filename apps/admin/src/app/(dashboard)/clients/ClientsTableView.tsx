"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUp, ArrowDown, ArrowUpDown, Search } from "lucide-react";
import type { ClientStatus, SubscriptionTier } from "@tiagolifestyle/shared";
import { StatusBadge } from "@/components/StatusBadge";

const TIER_LABELS: Record<SubscriptionTier, string> = {
  free: "Basic",
  premium: "Premium",
  vip: "VIP",
};

const STATUS_RANK: Record<ClientStatus, number> = {
  active: 0,
  paused: 1,
  inactive: 2,
};

export interface ClientRow {
  id: string;
  goal: string | null;
  status: ClientStatus;
  subscription_tier: SubscriptionTier;
  name: string;
}

type SortKey = "name" | "goal" | "plan" | "status";
type SortDir = "asc" | "desc";

const COLUMNS: { key: SortKey; label: string }[] = [
  { key: "name", label: "Nome" },
  { key: "goal", label: "Objetivo" },
  { key: "plan", label: "Plano" },
  { key: "status", label: "Estado" },
];

export function ClientsTableView({ clients }: { clients: ClientRow[] }) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");

  function handleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  const visibleClients = useMemo(() => {
    const filtered = clients.filter((client) => client.name.toLowerCase().includes(search.trim().toLowerCase()));

    if (!sortKey) return filtered;

    const sorted = [...filtered].sort((a, b) => {
      let result = 0;
      if (sortKey === "name") result = a.name.localeCompare(b.name, "pt");
      else if (sortKey === "goal") result = (a.goal ?? "").localeCompare(b.goal ?? "", "pt");
      else if (sortKey === "plan") result = TIER_LABELS[a.subscription_tier].localeCompare(TIER_LABELS[b.subscription_tier], "pt");
      else if (sortKey === "status") result = STATUS_RANK[a.status] - STATUS_RANK[b.status];
      return sortDir === "asc" ? result : -result;
    });
    return sorted;
  }, [clients, search, sortKey, sortDir]);

  return (
    <div className="flex flex-col gap-4">
      <div className="relative max-w-xs">
        <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Pesquisar por nome…"
          className="w-full rounded-2xl border border-border bg-surface-elevated py-2.5 pl-9 pr-4 text-sm text-foreground outline-none focus:border-accent"
        />
      </div>

      <div className="overflow-hidden rounded-2xl border border-border">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface text-xs uppercase tracking-wide text-muted">
            <tr>
              {COLUMNS.map((column) => (
                <th key={column.key} className="px-5 py-3 font-medium">
                  <button
                    onClick={() => handleSort(column.key)}
                    className="flex items-center gap-1.5 hover:text-foreground"
                  >
                    {column.label}
                    {sortKey === column.key ? (
                      sortDir === "asc" ? (
                        <ArrowUp size={13} />
                      ) : (
                        <ArrowDown size={13} />
                      )
                    ) : (
                      <ArrowUpDown size={13} className="opacity-40" />
                    )}
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-border bg-surface/40">
            {visibleClients.map((client) => (
              <tr key={client.id} className="transition hover:bg-surface-elevated">
                <td className="px-5 py-4">
                  <Link href={`/clients/${client.id}`} className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-surface-elevated text-sm font-medium text-foreground">
                      {client.name.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="font-medium text-foreground">{client.name}</span>
                  </Link>
                </td>
                <td className="px-5 py-4 text-muted">{client.goal ?? "—"}</td>
                <td className="px-5 py-4 text-muted">{TIER_LABELS[client.subscription_tier]}</td>
                <td className="px-5 py-4">
                  <StatusBadge status={client.status} />
                </td>
              </tr>
            ))}
            {!clients.length && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-muted">
                  Ainda não tens clientes. Cria o primeiro.
                </td>
              </tr>
            )}
            {clients.length > 0 && !visibleClients.length && (
              <tr>
                <td colSpan={4} className="px-5 py-10 text-center text-muted">
                  Nenhum cliente encontrado para &quot;{search}&quot;.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
