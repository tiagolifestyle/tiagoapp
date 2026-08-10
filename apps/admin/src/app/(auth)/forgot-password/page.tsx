"use client";

import { useState, type FormEvent } from "react";
import Link from "next/link";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    setSent(true);
  }

  return (
    <div className="w-full max-w-sm">
      <h1 className="mb-1 text-2xl font-semibold text-foreground">Recuperar password</h1>
      <p className="mb-8 text-sm text-muted">Enviamos-te um link para redefinires a tua password.</p>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <input
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          className="rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
        />
        {sent ? (
          <p className="text-sm text-success">✓ Verifica o teu email.</p>
        ) : (
          <button
            type="submit"
            disabled={loading}
            className="rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "A enviar…" : "Enviar link"}
          </button>
        )}
        <Link href="/login" className="text-center text-sm text-muted hover:text-foreground">
          Voltar ao login
        </Link>
      </form>
    </div>
  );
}
