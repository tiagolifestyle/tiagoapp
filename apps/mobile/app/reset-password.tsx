import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { updatePassword } = useAuth();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);

    if (password.length < 8) {
      setError(t("auth.passwordTooShort"));
      return;
    }
    if (password !== confirmPassword) {
      setError(t("auth.passwordMismatch"));
      return;
    }

    setLoading(true);
    const { error: updateError } = await updatePassword(password);
    setLoading(false);

    if (updateError) {
      setError(t("auth.signUpError"));
      return;
    }

    router.replace("/(client)");
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-1 justify-center px-6" keyboardShouldPersistTaps="handled">
          <View className="mb-10 gap-2">
            <Text className="text-3xl font-semibold text-foreground">{t("auth.changePassword")}</Text>
            <Text className="text-base text-muted">{t("auth.resetPasswordSubtitle")}</Text>
          </View>

          <View className="gap-4">
            <TextField label={t("auth.password")} value={password} onChangeText={setPassword}
              secureTextEntry autoComplete="password-new" />
            <TextField label={t("auth.confirmPassword")} value={confirmPassword} onChangeText={setConfirmPassword}
              secureTextEntry autoComplete="password-new" />
            {error ? <Text className="text-sm text-danger">{error}</Text> : null}

            <Button label={t("auth.changePassword")} onPress={handleSubmit} loading={loading} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
