"use client";

import { useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import type { Client } from "@tiagolifestyle/shared";
import { StatusBadge } from "@/components/StatusBadge";
import { InfoTab } from "./tabs/InfoTab";
import { WorkoutTab } from "./tabs/WorkoutTab";
import { NutritionTab } from "./tabs/NutritionTab";
import { ProgressTab } from "./tabs/ProgressTab";
import { CheckinsTab } from "./tabs/CheckinsTab";
import { MessagesTab } from "./tabs/MessagesTab";
import { NotesTab } from "./tabs/NotesTab";

const TABS = [
  { key: "info", label: "Informação" },
  { key: "workout", label: "Treino" },
  { key: "nutrition", label: "Nutrição" },
  { key: "progress", label: "Progresso" },
  { key: "checkins", label: "Check-ins" },
  { key: "messages", label: "Mensagens" },
  { key: "notes", label: "Notas privadas" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function ClientProfileView({
  clientId,
  initialClient,
  initialProfileName,
}: {
  clientId: string;
  initialClient: Client;
  initialProfileName: string;
}) {
  const searchParams = useSearchParams();
  const requestedTab = searchParams.get("tab");
  const initialTab = TABS.some((tab) => tab.key === requestedTab) ? (requestedTab as TabKey) : "info";
  const [activeTab, setActiveTab] = useState<TabKey>(initialTab);

  return (
    <div className="flex flex-col gap-6">
      <div>
        <Link href="/clients" className="mb-4 flex items-center gap-2 text-sm text-muted hover:text-foreground">
          <ArrowLeft size={16} />
          Voltar aos clientes
        </Link>

        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-surface-elevated text-lg font-medium text-foreground">
            {initialProfileName.slice(0, 2).toUpperCase()}
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">{initialProfileName}</h1>
            <div className="mt-1 flex items-center gap-2">
              <StatusBadge status={initialClient.status} />
              <span className="text-sm text-muted capitalize">{initialClient.subscription_tier}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-1 overflow-x-auto border-b border-border">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`whitespace-nowrap border-b-2 px-4 py-3 text-sm font-medium transition ${
              activeTab === tab.key
                ? "border-accent text-foreground"
                : "border-transparent text-muted hover:text-foreground"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div>
        {activeTab === "info" && <InfoTab clientId={clientId} initialClient={initialClient} />}
        {activeTab === "workout" && <WorkoutTab clientId={clientId} />}
        {activeTab === "nutrition" && <NutritionTab clientId={clientId} />}
        {activeTab === "progress" && <ProgressTab clientId={clientId} />}
        {activeTab === "checkins" && <CheckinsTab clientId={clientId} />}
        {activeTab === "messages" && <MessagesTab clientId={clientId} />}
        {activeTab === "notes" && <NotesTab clientId={clientId} initialNotes={initialClient.notes_private} />}
      </div>
    </div>
  );
}
