import { useState } from "react";
import { View, Text, KeyboardAvoidingView, Platform, ScrollView, Pressable, Linking } from "react-native";
import { Link } from "expo-router";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { createClient } from "@supabase/supabase-js";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/Button";
import { TextField } from "@/components/TextField";

// Conta de gestão (email fixo, apenas identificador — nunca um segredo).
// A password real fica guardada apenas no Supabase Auth, nunca no código.
const MANAGER_EMAIL = "tiago.fcb7@gmail.com";
const ADMIN_DASHBOARD_URL = process.env.EXPO_PUBLIC_ADMIN_URL;

export default function LoginScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const [managerOpen, setManagerOpen] = useState(false);
  const [managerPassword, setManagerPassword] = useState("");
  const [managerError, setManagerError] = useState<string | null>(null);
  const [managerLoading, setManagerLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    setLoading(true);
    const { error: signInError } = await signIn(email.trim(), password);
    setLoading(false);
    if (signInError) setError(t("auth.invalidCredentials"));
  }

  async function handleManagerAccess() {
    setManagerError(null);
    setManagerLoading(true);

    // Cliente Supabase à parte (sem persistência de sessão) só para verificar
    // a password de gestor, sem nunca mexer na sessão da app normal.
    const probeClient = createClient(
      process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
      process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { data, error: probeError } = await probeClient.auth.signInWithPassword({
      email: MANAGER_EMAIL,
      password: managerPassword,
    });

    if (probeError || !data.user) {
      setManagerLoading(false);
      setManagerError(t("auth.managerInvalid"));
      return;
    }

    const { data: profileRow } = await probeClient
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    await probeClient.auth.signOut();
    setManagerLoading(false);

    if (profileRow?.role !== "admin" && profileRow?.role !== "coach") {
      setManagerError(t("auth.managerInvalid"));
      return;
    }

    if (!ADMIN_DASHBOARD_URL) {
      setManagerError(t("auth.managerNoUrl"));
      return;
    }

    setManagerPassword("");
    setManagerOpen(false);
    Linking.openURL(ADMIN_DASHBOARD_URL);
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} className="flex-1">
        <ScrollView contentContainerClassName="flex-1 justify-center px-6" keyboardShouldPersistTaps="handled">
          <View className="mb-10 gap-2">
            <Text className="text-3xl font-semibold text-foreground">{t("auth.loginTitle")}</Text>
            <Text className="text-base text-muted">{t("auth.loginSubtitle")}</Text>
          </View>

          <View className="gap-4">
            <TextField label={t("auth.email")} value={email} onChangeText={setEmail}
              autoCapitalize="none" keyboardType="email-address" autoComplete="email" />
            <TextField label={t("auth.password")} value={password} onChangeText={setPassword}
              secureTextEntry autoComplete="password" />
            {error ? <Text className="text-sm text-danger">{error}</Text> : null}

            <Button label={t("auth.loginButton")} onPress={handleSubmit} loading={loading} />

            <Link href="/(auth)/forgot-password" className="mt-2 self-center">
              <Text className="text-sm text-muted">{t("auth.forgotPassword")}</Text>
            </Link>

            <View className="mt-4 flex-row items-center justify-center gap-1">
              <Text className="text-sm text-muted">{t("auth.noAccount")}</Text>
              <Link href="/(auth)/sign-up">
                <Text className="text-sm font-medium text-accent">{t("auth.createAccount")}</Text>
              </Link>
            </View>
          </View>
        </ScrollView>

        <View className="items-center pb-6">
          {managerOpen ? (
            <View className="w-full gap-2 px-6">
              <TextField
                label={t("auth.managerPassword")}
                value={managerPassword}
                onChangeText={setManagerPassword}
                secureTextEntry
              />
              {managerError ? <Text className="text-sm text-danger">{managerError}</Text> : null}
              <Button
                label={t("auth.managerAccess")}
                variant="secondary"
                onPress={handleManagerAccess}
                loading={managerLoading}
              />
            </View>
          ) : (
            <Pressable accessibilityRole="button" onPress={() => setManagerOpen(true)}>
              <Text className="text-xs text-muted">{t("auth.manager")}</Text>
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
