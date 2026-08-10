const STYLES: Record<string, string> = {
  active: "bg-success/15 text-success",
  inactive: "bg-danger/15 text-danger",
  paused: "bg-warning/15 text-warning",
  draft: "bg-muted/15 text-muted",
  completed: "bg-success/15 text-success",
  archived: "bg-muted/15 text-muted",
  pending: "bg-warning/15 text-warning",
  reviewed: "bg-success/15 text-success",
};

const LABELS: Record<string, string> = {
  active: "Ativo",
  inactive: "Inativo",
  paused: "Em pausa",
  draft: "Rascunho",
  completed: "Concluído",
  archived: "Arquivado",
  pending: "Pendente",
  reviewed: "Respondido",
};

export function StatusBadge({ status }: { status: string }) {
  return (
    <span className={`rounded-full px-3 py-1 text-xs font-medium ${STYLES[status] ?? "bg-muted/15 text-muted"}`}>
      {LABELS[status] ?? status}
    </span>
  );
}
