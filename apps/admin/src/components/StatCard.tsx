import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: number | string;
  icon: LucideIcon;
  tone?: "default" | "warning" | "danger";
}

const toneStyles = {
  default: "text-foreground",
  warning: "text-warning",
  danger: "text-danger",
};

export function StatCard({ label, value, icon: Icon, tone = "default" }: StatCardProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface p-5">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
        <Icon size={18} className="text-muted" />
      </div>
      <p className={`text-3xl font-semibold ${toneStyles[tone]}`}>{value}</p>
    </div>
  );
}
