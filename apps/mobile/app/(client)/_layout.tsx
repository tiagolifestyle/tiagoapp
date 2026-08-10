import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";

export default function ClientLayout() {
  const { session, isLoading } = useAuth();
  const { t } = useTranslation();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#C9A227" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { backgroundColor: "#0B0B0F", borderTopColor: "#2A2A35" },
        tabBarActiveTintColor: "#C9A227",
        tabBarInactiveTintColor: "#6B6B76",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("dashboard.todayPlanIntro") ? "Início" : "Início",
          tabBarIcon: ({ color, size }) => <Ionicons name="home" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: t("dashboard.todayWorkout"),
          tabBarIcon: ({ color, size }) => <Ionicons name="barbell" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: t("dashboard.todayNutrition"),
          tabBarIcon: ({ color, size }) => <Ionicons name="nutrition" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t("dashboard.progress"),
          tabBarIcon: ({ color, size }) => <Ionicons name="trending-up" color={color} size={size} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile.title"),
          tabBarIcon: ({ color, size }) => <Ionicons name="person" color={color} size={size} />,
        }}
      />
      <Tabs.Screen name="coach" options={{ href: null }} />
    </Tabs>
  );
}
