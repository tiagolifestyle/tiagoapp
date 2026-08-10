import { createClient, type SupabaseClientOptions } from "@supabase/supabase-js";

/**
 * Storage adapter mínimo compatível com o `AuthStorage` do supabase-js.
 * Cada app passa a sua implementação (AsyncStorage no Expo, cookies/localStorage no Next.js).
 */
export interface AuthStorageAdapter {
  getItem(key: string): Promise<string | null> | string | null;
  setItem(key: string, value: string): Promise<void> | void;
  removeItem(key: string): Promise<void> | void;
}

export interface CreateSupabaseClientOptions {
  url: string;
  anonKey: string;
  storage?: AuthStorageAdapter;
  autoRefreshToken?: boolean;
  persistSession?: boolean;
}

export function createSupabaseClient({
  url,
  anonKey,
  storage,
  autoRefreshToken = true,
  persistSession = true,
}: CreateSupabaseClientOptions) {
  if (!url || !anonKey) {
    throw new Error(
      "Supabase URL/anon key em falta. Confirma o teu ficheiro .env (ver .env.example)."
    );
  }

  const options: SupabaseClientOptions<"public"> = {
    auth: {
      storage: storage as never,
      autoRefreshToken,
      persistSession,
      detectSessionInUrl: false,
    },
  };

  return createClient(url, anonKey, options);
}

export type SupabaseClient = ReturnType<typeof createSupabaseClient>;
