import { View, Text } from "react-native";
import { Card } from "./Card";

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
      style={accentColor ? { borderColor: accentColor, backgroundColor: `${accentColor}1A` } : undefined}
    >
      <Text className="text-xs uppercase tracking-wide text-muted" style={accentColor ? { color: accentColor } : undefined}>
        {label}
      </Text>
      <View className="flex-row items-baseline gap-2">
        <Text className="text-2xl font-semibold text-foreground">{value}</Text>
        {trend ? <Text className="text-sm font-medium text-success">{trend}</Text> : null}
      </View>
    </Card>
  );
}
