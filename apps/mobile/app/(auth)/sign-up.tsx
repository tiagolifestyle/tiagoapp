import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Link, router } from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { signUpSchema } from "@tiagolifestyle/shared";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";

export default function SignUpScreen() {
  const { t } = useTranslation();
  const { signUp } = useAuth();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);

    const result = signUpSchema.safeParse({
      fullName: fullName.trim(),
      email: email.trim(),
      password,
      confirmPassword,
    });

    if (!result.success) {
      const issue = result.error.issues[0];
      if (issue?.path[0] === "confirmPassword" && issue.message.includes("coincidem")) {
        setError(t("auth.passwordMismatch"));
      } else if (issue?.path[0] === "password" || issue?.path[0] === "confirmPassword") {
        setError(t("auth.passwordTooShort"));
      } else {
        setError(t("auth.invalidCredentials"));
      }
      return;
    }

    setLoading(true);
    const { error: signUpError } = await signUp(result.data.fullName, result.data.email, result.data.password);
    setLoading(false);

    if (signUpError) {
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
            <Text className="text-3xl font-semibold text-foreground">{t("auth.signUpTitle")}</Text>
            <Text className="text-base text-muted">{t("auth.signUpSubtitle")}</Text>
          </View>

          <View className="gap-4">
            <TextField label={t("auth.fullName")} value={fullName} onChangeText={setFullName} autoComplete="name" />
            <TextField label={t("auth.email")} value={email} onChangeText={setEmail}
              autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
            <TextField label={t("auth.password")} value={password} onChangeText={setPassword}
              secureTextEntry autoComplete="password-new" />
            <TextField label={t("auth.confirmPassword")} value={confirmPassword} onChangeText={setConfirmPassword}
              secureTextEntry autoComplete="password-new" />
            {error ? <Text className="text-sm text-danger">{error}</Text> : null}

            <Button label={t("auth.signUpButton")} onPress={handleSubmit} loading={loading} />

            <Link href="/(auth)/login" className="mt-2 self-center">
              <Text className="text-sm text-muted">{t("auth.alreadyHaveAccount")} {t("auth.backToLogin")}</Text>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
