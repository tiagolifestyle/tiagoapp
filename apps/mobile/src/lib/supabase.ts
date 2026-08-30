import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createSupabaseClient } from "@tiagolifestyle/shared";

export const supabase = createSupabaseClient({
  url: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  anonKey: process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "",
  storage: AsyncStorage,
  detectSessionInUrl: Platform.OS === "web",
});
