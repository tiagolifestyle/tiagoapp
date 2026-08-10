import { Pressable, Text, ActivityIndicator, type PressableProps } from "react-native";

interface ButtonProps extends PressableProps {
  label: string;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
}

const variantStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "bg-accent",
  secondary: "bg-surface-elevated border border-border",
  ghost: "bg-transparent",
};

const variantTextStyles: Record<NonNullable<ButtonProps["variant"]>, string> = {
  primary: "text-background",
  secondary: "text-foreground",
  ghost: "text-accent",
};

export function Button({ label, variant = "primary", loading, disabled, ...props }: ButtonProps) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      className={`items-center justify-center rounded-2xl px-6 py-4 active:opacity-80 ${variantStyles[variant]} ${
        disabled || loading ? "opacity-50" : ""
      }`}
      {...props}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#0B0B0F" : "#F5F5F2"} />
      ) : (
        <Text className={`text-base font-semibold ${variantTextStyles[variant]}`}>{label}</Text>
      )}
    </Pressable>
  );
}
