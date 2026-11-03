-- ─────────────────────────────────────────────────────────────
-- Mentor LifeStyle: hábitos diários escritos pelo coach, iguais para
-- todos os clientes, com texto em PT/ES/EN e um ícone. O que cada
-- cliente marca como concluído fica só no telemóvel dele e recomeça
-- à meia-noite — não há registo na base de dados.
-- ─────────────────────────────────────────────────────────────

create table habits (
  id uuid primary key default gen_random_uuid (),
  title_pt text not null,
  title_es text not null,
  title_en text not null,
  icon text not null default 'sparkles',
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on habits
for each row execute function set_updated_at ();

alter table habits enable row level security;

create policy "habits_select_authenticated" on habits
for select using (auth.uid () is not null);

create policy "habits_write_staff" on habits
for all using (is_staff ())
with check (is_staff ());
