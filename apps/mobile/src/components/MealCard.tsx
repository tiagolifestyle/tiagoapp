import { View, Text } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import type { PlanMeal } from "@/hooks/useNutritionPlan";

// Base fixa do "vidro escuro" — independente do tema claro/escuro do telemóvel,
// para o cartão manter sempre o mesmo aspeto premium.
const GLASS_BASE = "#1B1B22F2";

function formatTime(time: string | null) {
  return time ? time.slice(0, 5) : null;
}

interface MealCardProps {
  meal: PlanMeal;
  accentColor: string;
}

export function MealCard({ meal, accentColor }: MealCardProps) {
  const time = formatTime(meal.time);

  return (
    <View
      className="rounded-3xl"
      style={{
        shadowColor: accentColor,
        shadowOpacity: 0.35,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 10,
      }}
    >
      <View
        className="overflow-hidden rounded-3xl border"
        style={{ borderColor: `${accentColor}3D` }}
      >
        <View style={{ position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: GLASS_BASE }} />
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

        <View className="gap-3 p-5">
          <View className="flex-row items-center justify-between">
            <Text className="text-lg font-semibold" style={{ color: accentColor }}>
              {meal.name}
            </Text>
            {time ? (
              <View className="rounded-full px-2.5 py-1" style={{ backgroundColor: `${accentColor}1F` }}>
                <Text className="text-xs font-semibold" style={{ color: accentColor }}>
                  {time}
                </Text>
              </View>
            ) : null}
          </View>

          <View className="gap-2.5">
            {meal.items.map((item) => (
              <View key={item.id} className="flex-row items-center justify-between">
                <Text className="flex-1 pr-3 text-sm text-muted">{item.food_name}</Text>
                {item.quantity ? (
                  <Text className="text-sm font-bold" style={{ color: accentColor }}>
                    {item.quantity}
                    {item.unit ?? ""}
                  </Text>
                ) : null}
              </View>
            ))}
          </View>
        </View>
      </View>
    </View>
  );
}
