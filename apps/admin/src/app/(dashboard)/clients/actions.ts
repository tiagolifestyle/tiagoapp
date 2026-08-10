"use server";

import { redirect } from "next/navigation";
import { createClientSchema } from "@tiagolifestyle/shared";
import { createServerSupabaseClient, createAdminSupabaseClient } from "@/lib/supabase/server";

export interface CreateClientState {
  error: string | null;
}

export async function createClientAction(
  _prevState: CreateClientState,
  formData: FormData
): Promise<CreateClientState> {
  const supabase = await createServerSupabaseClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "Sessão expirada. Inicia sessão novamente." };

  const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();

  if (!profile || (profile.role !== "admin" && profile.role !== "coach")) {
    return { error: "Sem permissões para criar clientes." };
  }

  const parsed = createClientSchema.safeParse({
    email: formData.get("email"),
    fullName: formData.get("fullName"),
    goal: formData.get("goal") || undefined,
    locale: formData.get("locale") || "pt",
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos." };
  }

  const admin = createAdminSupabaseClient();

  const { data: invited, error: inviteError } = await admin.auth.admin.inviteUserByEmail(
    parsed.data.email,
    {
      data: {
        role: "client",
        full_name: parsed.data.fullName,
        locale: parsed.data.locale,
        coach_id: user.id,
      },
    }
  );

  if (inviteError || !invited?.user) {
    return { error: inviteError?.message ?? "Não foi possível convidar o cliente." };
  }

  if (parsed.data.goal) {
    await admin.from("clients").update({ goal: parsed.data.goal }).eq("id", invited.user.id);
  }

  redirect(`/clients/${invited.user.id}`);
}
