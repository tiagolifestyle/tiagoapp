import { View, type ViewProps } from "react-native";

export function Card({ className = "", ...props }: ViewProps & { className?: string }) {
  return (
    <View
      className={`rounded-3xl border border-border bg-surface p-5 ${className}`}
      {...props}
    />
  );
}
