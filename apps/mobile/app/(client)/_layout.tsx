import { useEffect, useState } from "react";
import { Redirect, Tabs } from "expo-router";
import { ActivityIndicator, View, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { useTranslation } from "react-i18next";
import type { ClientStatus } from "@tiagolifestyle/shared";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/Button";

type IconName = ComponentProps<typeof Ionicons>["name"];

function tabIcon(name: IconName) {
  // eslint-disable-next-line react/display-name
  return ({ color, size }: { color: string; size: number }) => (
    <Ionicons name={name} color={color} size={size} />
  );
}

export default function ClientLayout() {
  const { session, profile, isLoading, signOut } = useAuth();
  const { t } = useTranslation();
  const [clientStatus, setClientStatus] = useState<ClientStatus | null>(null);
  const [statusLoading, setStatusLoading] = useState(true);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("clients")
      .select("status")
      .eq("id", profile.id)
      .maybeSingle()
      .then(({ data }) => {
        setClientStatus((data?.status as ClientStatus | undefined) ?? null);
        setStatusLoading(false);
      });
  }, [profile]);

  if (isLoading || (session && statusLoading)) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#C9A227" />
      </View>
    );
  }

  if (!session) {
    return <Redirect href="/(auth)/login" />;
  }

  if (clientStatus === "inactive") {
    return (
      <View className="flex-1 items-center justify-center gap-4 bg-background px-8">
        <Ionicons name="lock-closed-outline" size={40} color="#C9A227" />
        <Text className="text-center text-xl font-semibold text-foreground">{t("account.inactiveTitle")}</Text>
        <Text className="text-center text-base text-muted">{t("account.inactiveMessage")}</Text>
        <Button label={t("auth.logout")} variant="ghost" onPress={signOut} />
      </View>
    );
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
      <Tabs.Screen name="checkin" options={{ href: null }} />
    </Tabs>
  );
}
