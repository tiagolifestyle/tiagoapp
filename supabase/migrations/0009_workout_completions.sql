-- ─────────────────────────────────────────────────────────────
-- Registo explícito de "Treino completo": um clique do cliente por
-- dia, usado para calcular a consistência (dias de dedicação
-- acumulados, usados pelo coach para decidir promoções).
-- ─────────────────────────────────────────────────────────────

create table workout_completions (
  id uuid primary key default gen_random_uuid (),
  client_id uuid not null references clients (id) on delete cascade,
  completed_at date not null default current_date,
  created_at timestamptz not null default now(),
  unique (client_id, completed_at)
);

create index workout_completions_client_id_idx on workout_completions (client_id, completed_at desc);

alter table workout_completions enable row level security;

create policy "workout_completions_select" on workout_completions
for select using (client_id = auth.uid () or manages_client (client_id));

create policy "workout_completions_insert_self" on workout_completions
for insert with check (client_id = auth.uid ());
