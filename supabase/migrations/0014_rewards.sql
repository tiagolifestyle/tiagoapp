-- ─────────────────────────────────────────────────────────────
-- Recompensas por consistência: o coach cria promoções que se
-- desbloqueiam por pontos (1 ponto = 1 dia de treino concluído,
-- nunca volta a zero). O cliente resgata cada promoção uma vez e
-- o coach marca-a como entregue.
-- ─────────────────────────────────────────────────────────────

create table rewards (
  id uuid primary key default gen_random_uuid (),
  title_pt text not null,
  title_es text not null,
  title_en text not null,
  description_pt text,
  description_es text,
  description_en text,
  points_required int not null check (points_required >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger set_updated_at before update on rewards
for each row execute function set_updated_at ();

create table reward_redemptions (
  id uuid primary key default gen_random_uuid (),
  reward_id uuid not null references rewards (id) on delete cascade,
  client_id uuid not null references clients (id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  delivered_at timestamptz,
  unique (reward_id, client_id)
);

create index reward_redemptions_client_id_idx on reward_redemptions (client_id);

alter table rewards enable row level security;

create policy "rewards_select_authenticated" on rewards
for select using (auth.uid () is not null);

create policy "rewards_write_staff" on rewards
for all using (is_staff ())
with check (is_staff ());

alter table reward_redemptions enable row level security;

create policy "reward_redemptions_select" on reward_redemptions
for select using (client_id = auth.uid () or manages_client (client_id));

-- O cliente só consegue resgatar se já tiver os pontos necessários.
create policy "reward_redemptions_insert_self" on reward_redemptions
for insert with check (
  client_id = auth.uid ()
  and (select count(*) from workout_completions wc where wc.client_id = auth.uid ())
    >= (select r.points_required from rewards r where r.id = reward_id)
);

create policy "reward_redemptions_update_staff" on reward_redemptions
for update using (manages_client (client_id))
with check (manages_client (client_id));

create policy "reward_redemptions_delete_staff" on reward_redemptions
for delete using (manages_client (client_id));
