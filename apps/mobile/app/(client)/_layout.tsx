import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/context/AuthContext";

type IconName = ComponentProps<typeof Ionicons>["name"];

function tabIcon(name: IconName) {
  // eslint-disable-next-line react/display-name
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} color={color} size={size} />
  );
}

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
          title: "Início",
          tabBarIcon: tabIcon("home"),
        }}
      />
      <Tabs.Screen
        name="workout"
        options={{
          title: t("dashboard.todayWorkout"),
          tabBarIcon: tabIcon("barbell"),
        }}
      />
      <Tabs.Screen
        name="nutrition"
        options={{
          title: t("dashboard.todayNutrition"),
          tabBarIcon: tabIcon("nutrition"),
        }}
      />
      <Tabs.Screen
        name="progress"
        options={{
          title: t("dashboard.progress"),
          tabBarIcon: tabIcon("trending-up"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile.title"),
          tabBarIcon: tabIcon("person"),
        }}
      />
      <Tabs.Screen name="coach" options={{ href: null }} />
    </Tabs>
  );
}
