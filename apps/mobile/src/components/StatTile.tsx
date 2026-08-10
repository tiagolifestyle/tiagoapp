import { View, Text } from "react-native";
import { Card } from "./Card";

interface StatTileProps {
  label: string;
  value: string;
  trend?: string;
  className?: string;
}

export function StatTile({ label, value, trend, className = "" }: StatTileProps) {
  return (
    <Card className={`flex-1 gap-1.5 ${className}`}>
      <Text className="text-xs uppercase tracking-wide text-muted">{label}</Text>
      <View className="flex-row items-baseline gap-2">
        <Text className="text-2xl font-semibold text-foreground">{value}</Text>
        {trend ? <Text className="text-sm font-medium text-success">{trend}</Text> : null}
      </View>
    </Card>
  );
}
