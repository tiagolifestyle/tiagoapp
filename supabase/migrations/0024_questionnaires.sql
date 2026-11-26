-- ─────────────────────────────────────────────────────────────
-- Questionários (treino, pós-parto, alimentar) preenchidos pelo
-- cliente na app. Uma linha por cliente e questionário, com as
-- respostas em JSON; o cliente pode atualizá-las quando quiser.
-- Só o próprio cliente e o coach dele (ou admin) as veem.
-- ─────────────────────────────────────────────────────────────

create type questionnaire_kind as enum ('training', 'postpartum', 'nutrition');

create table questionnaire_responses (
  id uuid primary key default gen_random_uuid (),
  client_id uuid not null references clients (id) on delete cascade,
  kind questionnaire_kind not null,
  answers jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (client_id, kind)
);

create trigger set_updated_at before update on questionnaire_responses
for each row execute function set_updated_at ();

alter table questionnaire_responses enable row level security;

create policy "questionnaire_responses_select" on questionnaire_responses
for select using (client_id = auth.uid () or manages_client (client_id));

create policy "questionnaire_responses_insert_self" on questionnaire_responses
for insert with check (client_id = auth.uid ());

create policy "questionnaire_responses_update_self" on questionnaire_responses
for update using (client_id = auth.uid ())
with check (client_id = auth.uid ());
