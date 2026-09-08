-- ─────────────────────────────────────────────────────────────
-- Conteúdo educativo de Pós-parto (Informação / Hipopresivos):
-- cartões globais escritos pelo coach, iguais para todos os
-- clientes — não são dados por cliente.
-- ─────────────────────────────────────────────────────────────

create type postpartum_content_category as enum ('info', 'hypopressive');

create table postpartum_content_cards (
  id uuid primary key default gen_random_uuid (),
  category postpartum_content_category not null,
  title text not null,
  body text,
  image_url text,
  video_url text,
  order_index int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index postpartum_content_cards_category_idx on postpartum_content_cards (category, order_index);

alter table postpartum_content_cards enable row level security;

create policy "postpartum_content_cards_select_authenticated" on postpartum_content_cards
for select using (auth.uid () is not null);

create policy "postpartum_content_cards_write_staff" on postpartum_content_cards
for all using (is_staff ())
with check (is_staff ());
