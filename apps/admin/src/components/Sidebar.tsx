"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Dumbbell,
  LayoutTemplate,
  LogOut,
} from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase/browser";

const NAV_ITEMS = [
  { href: "/", label: "Visão geral", icon: LayoutDashboard },
  { href: "/clients", label: "Clientes", icon: Users },
  { href: "/exercises", label: "Biblioteca de exercícios", icon: Dumbbell },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
];

export function Sidebar({ coachName }: { coachName: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createBrowserSupabaseClient();
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <aside className="flex h-screen w-64 flex-col justify-between border-r border-border bg-surface px-4 py-6">
      <div>
        <div className="mb-8 px-2">
          <p className="text-sm font-medium uppercase tracking-widest text-accent">TiagoLifeStyle</p>
          <p className="mt-0.5 text-xs text-muted">{coachName}</p>
        </div>

        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition ${
                  isActive
                    ? "bg-surface-elevated text-foreground"
                    : "text-muted hover:bg-surface-elevated hover:text-foreground"
                }`}
              >
                <Icon size={18} />
                {label}
              </Link>
            );
          })}
        </nav>
      </div>

      <button
        onClick={handleLogout}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition hover:bg-surface-elevated hover:text-danger"
      >
        <LogOut size={18} />
        Terminar sessão
      </button>
    </aside>
  );
}
