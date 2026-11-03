// Ícones que o coach pode escolher para cada hábito do Mentor LifeStyle.
// A app (Ionicons) e o admin (lucide) têm cada um o seu mapa para estas chaves.
export const HABIT_ICONS = [
  "sunrise",
  "bed",
  "phone",
  "calendar",
  "dumbbell",
  "food",
  "water",
  "walk",
  "book",
  "brain",
  "headphones",
  "moon",
  "heart",
  "leaf",
  "smile",
  "coffee",
  "sparkles",
  "clock",
  "people",
  "journal",
] as const;

export type HabitIcon = (typeof HABIT_ICONS)[number];
