export type LevelKey = "bronze" | "silver" | "gold" | "platinum" | "diamond";

export interface Level {
  key: LevelKey;
  name: string;
  minPoints: number;
  color: string;
}

// Os nomes ficam sempre em inglês, em todos os idiomas.
export const LEVELS: Level[] = [
  { key: "bronze", name: "Bronze", minPoints: 0, color: "#CD7F32" },
  { key: "silver", name: "Silver", minPoints: 30, color: "#C0C7D0" },
  { key: "gold", name: "Gold", minPoints: 75, color: "#E3B53B" },
  { key: "platinum", name: "Platinum", minPoints: 150, color: "#7FD4D8" },
  { key: "diamond", name: "Diamond", minPoints: 250, color: "#8EC5FF" },
];

export function getLevel(points: number): { current: Level; next: Level | null } {
  let index = 0;
  for (let i = 0; i < LEVELS.length; i++) {
    if (points >= LEVELS[i].minPoints) index = i;
  }
  return { current: LEVELS[index], next: LEVELS[index + 1] ?? null };
}
