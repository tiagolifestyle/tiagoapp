import { Redirect, Stack } from "expo-router";
import { ActivityIndicator, View } from "react-native";
import { useAuth } from "@/context/AuthContext";

export default function AuthLayout() {
  const { session, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator color="#C9A227" />
      </View>
    );
  }

  if (session) {
    return <Redirect href="/(client)" />;
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}
