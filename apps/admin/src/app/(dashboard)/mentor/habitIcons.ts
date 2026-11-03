import {
  Sunrise,
  BedDouble,
  Smartphone,
  CalendarCheck,
  Dumbbell,
  Salad,
  Droplets,
  Footprints,
  BookOpen,
  Brain,
  Headphones,
  Moon,
  Heart,
  Leaf,
  Smile,
  Coffee,
  Sparkles,
  Clock,
  Users,
  PenLine,
  type LucideIcon,
} from "lucide-react";
import type { HabitIcon } from "@tiagolifestyle/shared";

// Mesmas chaves que a app usa (lá com Ionicons), para o ícone ser o mesmo nos dois lados.
export const HABIT_ICON_COMPONENTS: Record<HabitIcon, LucideIcon> = {
  sunrise: Sunrise,
  bed: BedDouble,
  phone: Smartphone,
  calendar: CalendarCheck,
  dumbbell: Dumbbell,
  food: Salad,
  water: Droplets,
  walk: Footprints,
  book: BookOpen,
  brain: Brain,
  headphones: Headphones,
  moon: Moon,
  heart: Heart,
  leaf: Leaf,
  smile: Smile,
  coffee: Coffee,
  sparkles: Sparkles,
  clock: Clock,
  people: Users,
  journal: PenLine,
};

export function habitIconComponent(icon: string): LucideIcon {
  return HABIT_ICON_COMPONENTS[icon as HabitIcon] ?? Sparkles;
}
