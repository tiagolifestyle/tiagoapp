import { View, Text } from "react-native";
import { Card } from "./Card";

// Mesma base fixa de "vidro escuro" usada nos cartões de refeição — independente
// do tema claro/escuro do telemóvel, para o tile manter sempre o mesmo aspeto.
const GLASS_BASE = "#1B1B22F2";
const GLASS_TEXT = "#F5F5F2";

interface StatTileProps {
  label: string;
  value: string;
  trend?: string;
  className?: string;
  accentColor?: string;
}

export function StatTile({ label, value, trend, className = "", accentColor }: StatTileProps) {
  return (
    <Card
      className={`flex-1 gap-1.5 ${className}`}
      style={accentColor ? { borderColor: accentColor, backgroundColor: GLASS_BASE } : undefined}
    >
      <Text className="text-xs uppercase tracking-wide text-muted" style={accentColor ? { color: accentColor } : undefined}>
        {label}
      </Text>
      <View className="flex-row items-baseline gap-2">
        <Text
          className={`text-2xl font-semibold ${accentColor ? "" : "text-foreground"}`}
          style={accentColor ? { color: GLASS_TEXT } : undefined}
        >
          {value}
        </Text>
        {trend ? <Text className="text-sm font-medium text-success">{trend}</Text> : null}
      </View>
    </Card>
  );
}
