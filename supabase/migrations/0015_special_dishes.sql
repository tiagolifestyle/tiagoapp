-- ─────────────────────────────────────────────────────────────
-- Pratos especiais: ideias de refeições criadas pelo coach, iguais
-- para todos os clientes, com texto em PT/ES/EN. As fotos ficam no
-- bucket público exercise-media (pasta dishes/).
-- ─────────────────────────────────────────────────────────────

create type special_dish_category as enum ('breakfast', 'lunch_dinner', 'snack', 'dessert');

create table special_dishes (
  id uuid primary key default gen_random_uuid (),
  category special_dish_category not null,
  name_pt text not null,
  name_es text not null,
  name_en text not null,
  ingredients_pt text,
  ingredients_es text,
  ingredients_en text,
  preparation_pt text,
  preparation_es text,
  preparation_en text,
  notes_pt text,
  notes_es text,
  notes_en text,
  image_url text,
  calories int,
  protein_g numeric(6, 1),
  carbs_g numeric(6, 1),
  fat_g numeric(6, 1),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index special_dishes_category_idx on special_dishes (category);

create trigger set_updated_at before update on special_dishes
for each row execute function set_updated_at ();

alter table special_dishes enable row level security;

create policy "special_dishes_select_authenticated" on special_dishes
for select using (auth.uid () is not null);

create policy "special_dishes_write_staff" on special_dishes
for all using (is_staff ())
with check (is_staff ());
