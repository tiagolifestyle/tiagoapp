-- ─────────────────────────────────────────────────────────────
-- TiagoLifeStyle — schema inicial
-- Convenção: todas as tabelas de negócio referenciam profiles.id,
-- que por sua vez referencia auth.users.id (Supabase Auth).
-- ─────────────────────────────────────────────────────────────

create extension if not exists "pgcrypto";

-- ─── Perfis e papéis ────────────────────────────────────────────

create type user_role as enum ('admin', 'coach', 'client');
create type app_locale as enum ('pt', 'es', 'en');
create type client_status as enum ('active', 'inactive', 'paused');
create type subscription_tier as enum ('free', 'premium', 'vip');
create type plan_status as enum ('draft', 'active', 'completed', 'archived');
create type checkin_status as enum ('pending', 'reviewed');
create type photo_angle as enum ('front', 'side', 'back');

create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role user_role not null default 'client',
  full_name text not null,
  avatar_url text,
  phone text,
  locale app_locale not null default 'pt',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table profiles is 'Extensão de auth.users com papel e dados de perfil.';

-- ─── Clientes ───────────────────────────────────────────────────

create table clients (
  id uuid primary key references profiles (id) on delete cascade,
  coach_id uuid references profiles (id) on delete set null,
  goal text,
  birth_date date,
  height_cm numeric(5, 1),
  starting_weight_kg numeric(5, 1),
  status client_status not null default 'active',
  subscription_tier subscription_tier not null default 'free',
  notes_private text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index clients_coach_id_idx on clients (coach_id);

-- ─── Biblioteca de exercícios ───────────────────────────────────

create table exercises (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  category text,
  muscle_group text,
  equipment text,
  difficulty text check (difficulty in ('iniciante', 'intermedio', 'avancado')),
  image_url text,
  video_url text,
  instructions text,
  common_mistakes text,
  tips text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index exercises_muscle_group_idx on exercises (muscle_group);
create index exercises_name_idx on exercises using gin (to_tsvector('portuguese', name));

-- ─── Templates e planos de treino ───────────────────────────────

create table workout_templates (
  id uuid primary key default gen_random_uuid (),
  name text not null,
  description text,
  category text,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table workout_plans (
  id uuid primary key default gen_random_uuid (),
  client_id uuid not null references clients (id) on delete cascade,
  template_id uuid references workout_templates (id) on delete set null,
  name text not null,
  start_date date,
  end_date date,
  status plan_status not null default 'draft',
  version int not null default 1,
  parent_plan_id uuid references workout_plans (id) on delete set null,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_plans_client_id_idx on workout_plans (client_id);
create index workout_plans_parent_plan_id_idx on workout_plans (parent_plan_id);

create table workout_days (
  id uuid primary key default gen_random_uuid (),
  plan_id uuid not null references workout_plans (id) on delete cascade,
  name text not null,
  day_order int not null default 0,
  weekday int check (weekday between 0 and 6),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_days_plan_id_idx on workout_days (plan_id);

create table workout_exercises (
  id uuid primary key default gen_random_uuid (),
  day_id uuid not null references workout_days (id) on delete cascade,
  exercise_id uuid not null references exercises (id) on delete restrict,
  order_index int not null default 0,
  sets int,
  reps text,
  load text,
  rest_seconds int,
  rir numeric(3, 1),
  rpe numeric(3, 1),
  tempo text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index workout_exercises_day_id_idx on workout_exercises (day_id);
create index workout_exercises_exercise_id_idx on workout_exercises (exercise_id);

create table exercise_logs (
  id uuid primary key default gen_random_uuid (),
  client_id uuid not null references clients (id) on delete cascade,
  workout_exercise_id uuid references workout_exercises (id) on delete set null,
  performed_at timestamptz not null default now(),
  sets_completed jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now()
);

create index exercise_logs_client_id_idx on exercise_logs (client_id);

-- ─── Nutrição ───────────────────────────────────────────────────

create table nutrition_plans (
  id uuid primary key default gen_random_uuid (),
  client_id uuid not null references clients (id) on delete cascade,
  name text not null,
  calories int,
  protein_g int,
  carbs_g int,
  fat_g int,
  water_ml int,
  version int not null default 1,
  parent_plan_id uuid references nutrition_plans (id) on delete set null,
  status plan_status not null default 'draft',
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index nutrition_plans_client_id_idx on nutrition_plans (client_id);

create table meals (
  id uuid primary key default gen_random_uuid (),
  nutrition_plan_id uuid not null references nutrition_plans (id) on delete cascade,
  name text not null,
  time time,
  order_index int not null default 0,
  notes text
);

create index meals_nutrition_plan_id_idx on meals (nutrition_plan_id);

create table meal_items (
  id uuid primary key default gen_random_uuid (),
  meal_id uuid not null references meals (id) on delete cascade,
  food_name text not null,
  quantity numeric(7, 2),
  unit text,
  notes text
);

create index meal_items_meal_id_idx on meal_items (meal_id);

-- ─── Progresso ──────────────────────────────────────────────────

create table progress_metrics (
  id uuid primary key default gen_random_uuid (),
  client_id uuid not null references clients (id) on delete cascade,
  recorded_at date not null default current_date,
  weight_kg numeric(5, 1),
  body_fat_pct numeric(4, 1),
  measurements jsonb not null default '{}'::jsonb,
  energy_level int check (energy_level between 1 and 5),
  sleep_hours numeric(3, 1),
  perceived_effort int check (perceived_effort between 1 and 5),
  notes text,
  created_at timestamptz not null default now()
);

create index progress_metrics_client_id_idx on progress_metrics (client_id, recorded_at desc);

create table progress_photos (
  id uuid primary key default gen_random_uuid (),
  client_id uuid not null references clients (id) on delete cascade,
  angle photo_angle not null,
  storage_path text not null,
  taken_at date not null default current_date,
  created_at timestamptz not null default now()
);

create index progress_photos_client_id_idx on progress_photos (client_id, taken_at desc);

-- ─── Check-ins ──────────────────────────────────────────────────

create table checkins (
  id uuid primary key default gen_random_uuid (),
  client_id uuid not null references clients (id) on delete cascade,
  week_start date not null,
  answers jsonb not null default '{}'::jsonb,
  coach_response text,
  status checkin_status not null default 'pending',
  submitted_at timestamptz,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  unique (client_id, week_start)
);

create index checkins_client_id_idx on checkins (client_id);
create index checkins_status_idx on checkins (status);

-- ─── Mensagens ──────────────────────────────────────────────────

create table conversations (
  id uuid primary key default gen_random_uuid (),
  client_id uuid not null references clients (id) on delete cascade,
  coach_id uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (client_id)
);

create table messages (
  id uuid primary key default gen_random_uuid (),
  conversation_id uuid not null references conversations (id) on delete cascade,
  sender_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index messages_conversation_id_idx on messages (conversation_id, created_at);

-- ─── Notificações ───────────────────────────────────────────────

create table notifications (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references profiles (id) on delete cascade,
  type text not null,
  title text not null,
  body text,
  data jsonb not null default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index notifications_user_id_idx on notifications (user_id, created_at desc);

-- ─── Gamificação ────────────────────────────────────────────────

create table badges (
  id uuid primary key default gen_random_uuid (),
  code text not null unique,
  name text not null,
  description text,
  icon text
);

create table client_badges (
  id uuid primary key default gen_random_uuid (),
  client_id uuid not null references clients (id) on delete cascade,
  badge_id uuid not null references badges (id) on delete cascade,
  earned_at timestamptz not null default now(),
  meta jsonb not null default '{}'::jsonb,
  unique (client_id, badge_id, earned_at)
);

create index client_badges_client_id_idx on client_badges (client_id);
