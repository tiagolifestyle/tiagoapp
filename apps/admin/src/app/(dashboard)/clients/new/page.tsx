"use client";

import { useActionState } from "react";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { createClientAction, type CreateClientState } from "../actions";

const initialState: CreateClientState = { error: null };

export default function NewClientPage() {
  const [state, formAction, isPending] = useActionState(createClientAction, initialState);

  return (
    <div className="max-w-lg">
      <Link href="/clients" className="mb-6 flex items-center gap-2 text-sm text-muted hover:text-foreground">
        <ArrowLeft size={16} />
        Voltar aos clientes
      </Link>

      <h1 className="mb-1 text-2xl font-semibold text-foreground">Novo cliente</h1>
      <p className="mb-8 text-sm text-muted">
        Enviamos um convite por email para o cliente definir a sua própria password.
      </p>

      <form action={formAction} className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted" htmlFor="fullName">
            Nome completo
          </label>
          <input
            id="fullName"
            name="fullName"
            required
            className="rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted" htmlFor="goal">
            Objetivo
          </label>
          <input
            id="goal"
            name="goal"
            placeholder="Ex: hipertrofia, perda de gordura…"
            className="rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
          />
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-muted" htmlFor="locale">
            Idioma
          </label>
          <select
            id="locale"
            name="locale"
            defaultValue="pt"
            className="rounded-2xl border border-border bg-surface-elevated px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
          >
            <option value="pt">Português</option>
            <option value="es">Español</option>
          </select>
        </div>

        {state.error && <p className="text-sm text-danger">{state.error}</p>}

        <button
          type="submit"
          disabled={isPending}
          className="mt-2 rounded-2xl bg-accent px-6 py-3 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
        >
          {isPending ? "A criar…" : "Criar e convidar cliente"}
        </button>
      </form>
    </div>
  );
}
