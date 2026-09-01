"use client";

export const WEEKDAY_ORDER = [1, 2, 3, 4, 5, 6, 0];
export const WEEKDAY_LABELS: Record<number, string> = {
  0: "Domingo",
  1: "Segunda",
  2: "Terça",
  3: "Quarta",
  4: "Quinta",
  5: "Sexta",
  6: "Sábado",
};
const WEEKDAY_SHORT: Record<number, string> = {
  0: "Dom",
  1: "Seg",
  2: "Ter",
  3: "Qua",
  4: "Qui",
  5: "Sex",
  6: "Sáb",
};

interface WeekdayTabsProps {
  selected: number;
  onSelect: (weekday: number) => void;
  countFor: (weekday: number) => number;
}

export function WeekdayTabs({ selected, onSelect, countFor }: WeekdayTabsProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1">
      {WEEKDAY_ORDER.map((weekday) => {
        const isSelected = selected === weekday;
        const count = countFor(weekday);
        return (
          <button
            key={weekday}
            onClick={() => onSelect(weekday)}
            className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold uppercase tracking-wide transition ${
              isSelected ? "border-accent text-accent" : "border-border text-muted hover:text-foreground"
            }`}
          >
            {WEEKDAY_SHORT[weekday]}
            {count > 0 && (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-accent px-1.5 text-xs font-bold text-background">
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
