import type { Exercise, WorkoutDay, WorkoutExercise } from "@tiagolifestyle/shared";

export interface BuilderExercise extends WorkoutExercise {
  exercise: Exercise;
}

export interface BuilderDay extends WorkoutDay {
  exercises: BuilderExercise[];
}
