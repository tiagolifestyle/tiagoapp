import { useState } from "react";
import { View, Text, FlatList, KeyboardAvoidingView, Platform } from "react-native";
import { useTranslation } from "react-i18next";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuth } from "@/context/AuthContext";
import { useConversation } from "@/hooks/useConversation";
import { TextField } from "@/components/TextField";
import { Button } from "@/components/Button";

export default function CoachScreen() {
  const { t } = useTranslation();
  const { profile } = useAuth();
  const { messages, sendMessage } = useConversation(profile?.id);
  const [draft, setDraft] = useState("");

  async function handleSend() {
    const text = draft;
    setDraft("");
    await sendMessage(text);
  }

  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top"]}>
      <Text className="mt-4 px-5 text-2xl font-semibold text-foreground">{t("dashboard.coachMessages")}</Text>

      <FlatList
        className="flex-1 px-5"
        contentContainerClassName="gap-3 py-4"
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => {
          const isMine = item.sender_id === profile?.id;
          return (
            <View className={`max-w-[80%] rounded-2xl px-4 py-3 ${isMine ? "self-end bg-accent" : "self-start bg-surface"}`}>
              <Text className={isMine ? "text-background" : "text-foreground"}>{item.body}</Text>
            </View>
          );
        }}
      />

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View className="flex-row items-end gap-3 border-t border-border px-5 py-4">
          <View className="flex-1">
            <TextField label="" placeholder="…" value={draft} onChangeText={setDraft} />
          </View>
          <Button label={t("common.save")} onPress={handleSend} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
