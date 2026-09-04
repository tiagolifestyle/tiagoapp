-- ─────────────────────────────────────────────────────────────
-- Pós-parto: dados do parto, avaliação do soalho pélvico e
-- avaliação da diástase abdominal. Preenchido pelo próprio cliente,
-- revisto pelo coach.
-- ─────────────────────────────────────────────────────────────

create type delivery_type as enum ('vaginal', 'cesarean');
create type baby_sex as enum ('boy', 'girl', 'twins');

create table postpartum_profiles (
  client_id uuid primary key references clients (id) on delete cascade,
  birth_date date,
  delivery_type delivery_type,
  gestational_weeks int,
  first_child boolean,
  baby_sex baby_sex,
  breastfeeding boolean,
  complications text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table pelvic_floor_assessments (
  id uuid primary key default gen_random_uuid (),
  client_id uuid not null references clients (id) on delete cascade,
  assessed_at date not null default current_date,
  stress_incontinence boolean not null default false,
  urgency_incontinence boolean not null default false,
  pelvic_pain boolean not null default false,
  notes text,
  created_at timestamptz not null default now()
);

create index pelvic_floor_assessments_client_id_idx on pelvic_floor_assessments (client_id, assessed_at desc);

create table diastasis_assessments (
  id uuid primary key default gen_random_uuid (),
  client_id uuid not null references clients (id) on delete cascade,
  assessed_at date not null default current_date,
  supraumbilical_cm numeric(4, 1),
  umbilical_cm numeric(4, 1),
  infraumbilical_cm numeric(4, 1),
  notes text,
  created_at timestamptz not null default now()
);

create index diastasis_assessments_client_id_idx on diastasis_assessments (client_id, assessed_at desc);

-- ─── RLS ─────────────────────────────────────────────────────────

alter table postpartum_profiles enable row level security;

create policy "postpartum_profiles_select" on postpartum_profiles
for select using (client_id = auth.uid () or manages_client (client_id));

create policy "postpartum_profiles_insert_self" on postpartum_profiles
for insert with check (client_id = auth.uid ());

create policy "postpartum_profiles_update_self" on postpartum_profiles
for update using (client_id = auth.uid () or manages_client (client_id));

alter table pelvic_floor_assessments enable row level security;

create policy "pelvic_floor_assessments_select" on pelvic_floor_assessments
for select using (client_id = auth.uid () or manages_client (client_id));

create policy "pelvic_floor_assessments_insert_self" on pelvic_floor_assessments
for insert with check (client_id = auth.uid ());

alter table diastasis_assessments enable row level security;

create policy "diastasis_assessments_select" on diastasis_assessments
for select using (client_id = auth.uid () or manages_client (client_id));

create policy "diastasis_assessments_insert_self" on diastasis_assessments
for insert with check (client_id = auth.uid ());
