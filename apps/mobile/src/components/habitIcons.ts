import type { Ionicons } from "@expo/vector-icons";
import type { HabitIcon } from "@tiagolifestyle/shared";

type IoniconName = keyof typeof Ionicons.glyphMap;

export const HABIT_ICON_NAMES: Record<HabitIcon, IoniconName> = {
  sunrise: "sunny-outline",
  bed: "bed-outline",
  phone: "phone-portrait-outline",
  calendar: "calendar-outline",
  dumbbell: "barbell-outline",
  food: "nutrition-outline",
  water: "water-outline",
  walk: "walk-outline",
  book: "book-outline",
  brain: "bulb-outline",
  headphones: "headset-outline",
  moon: "moon-outline",
  heart: "heart-outline",
  leaf: "leaf-outline",
  smile: "happy-outline",
  coffee: "cafe-outline",
  sparkles: "sparkles-outline",
  clock: "time-outline",
  people: "people-outline",
  journal: "pencil-outline",
};

export function habitIconName(icon: string): IoniconName {
  return HABIT_ICON_NAMES[icon as HabitIcon] ?? "sparkles-outline";
}
