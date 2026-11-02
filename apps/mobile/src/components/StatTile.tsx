import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { Card } from "./Card";
import { useTheme } from "@/context/ThemeContext";
import { darkenColor } from "@/lib/darkenColor";

// Mesma base fixa de "vidro escuro" usada nos cartões de refeição — independente
// do tema claro/escuro do telemóvel, para o tile manter sempre o mesmo aspeto.
// Com lightInLightMode, no modo claro o tile fica claro com texto escuro (como as refeições).
const GLASS_BASE = "#1B1B22F2";
const GLASS_TEXT = "#F5F5F2";
const LIGHT_BASE = "#FFFFFF";
const LIGHT_TEXT = "#14141A";

interface StatTileProps {
  label: string;
  value: string;
  trend?: string;
  className?: string;
  accentColor?: string;
  lightInLightMode?: boolean;
}

export function StatTile({ label, value, trend, className = "", accentColor, lightInLightMode }: StatTileProps) {
  const { theme } = useTheme();
  const isLight = !!lightInLightMode && theme === "light";

  if (accentColor) {
    return (
      <View
        className={`flex-1 rounded-3xl ${className}`}
        style={{
          shadowColor: accentColor,
          shadowOpacity: 0.35,
          shadowRadius: 18,
          shadowOffset: { width: 0, height: 10 },
          elevation: 10,
        }}
      >
        <View className="overflow-hidden rounded-3xl border" style={{ borderColor: `${accentColor}3D` }}>
          <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: isLight ? LIGHT_BASE : GLASS_BASE }} />
          <LinearGradient
            colors={[`${accentColor}29`, `${accentColor}05`, "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0 }}
          />
          <LinearGradient
            colors={[`${accentColor}E6`, `${accentColor}00`]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={{ position: "absolute", top: 0, left: 0, right: 0, height: 2 }}
          />

          <View className="gap-1.5 p-5">
            <Text
              className="text-xs uppercase tracking-wide"
              style={{ color: isLight ? darkenColor(accentColor) : accentColor }}
            >
              {label}
            </Text>
            <View className="flex-row items-baseline gap-2">
              <Text className="text-2xl font-semibold" style={{ color: isLight ? LIGHT_TEXT : GLASS_TEXT }}>
                {value}
              </Text>
              {trend ? <Text className="text-sm font-medium text-success">{trend}</Text> : null}
            </View>
          </View>
        </View>
      </View>
    );
  }

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
