import { useState } from "react";
import { View, Text } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const { resetPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setLoading(true);
    await resetPassword(email.trim());
    setLoading(false);
    setSent(true);
  }

  return (
    <SafeAreaView className="flex-1 bg-background px-6 pt-8">
      <Button label={t("common.back")} variant="ghost" onPress={() => router.back()} />

      <View className="mt-8 gap-2">
        <Text className="text-3xl font-semibold text-foreground">{t("auth.resetPasswordTitle")}</Text>
        <Text className="text-base text-muted">{t("auth.resetPasswordSubtitle")}</Text>
      </View>

      <View className="mt-8 gap-4">
        <TextField
          label={t("auth.email")}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />
        {sent ? (
          <Text className="text-sm text-success">✓ {t("auth.resetPasswordSubtitle")}</Text>
        ) : (
          <Button label={t("auth.sendResetLink")} onPress={handleSubmit} loading={loading} />
        )}
      </View>
    </SafeAreaView>
  );
}
