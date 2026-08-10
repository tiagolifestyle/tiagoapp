-- ─────────────────────────────────────────────────────────────
-- Row Level Security — isolamento de dados entre clientes
--
-- Modelo de permissões:
--   admin  → acesso total a todos os clientes e conteúdo
--   coach  → acesso total aos clientes que lhe estão atribuídos (clients.coach_id)
--   client → acesso apenas aos seus próprios dados
-- ─────────────────────────────────────────────────────────────

create or replace function auth_role ()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid ();
$$;

create or replace function is_admin ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth_role () = 'admin';
$$;

create or replace function is_staff ()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select auth_role () in ('admin', 'coach');
$$;

-- true se o utilizador autenticado é admin, ou é o coach atribuído a este cliente
create or replace function manages_client (p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    is_admin ()
    or exists (
      select 1 from clients
      where id = p_client_id and coach_id = auth.uid ()
    );
$$;

-- ─── profiles ───────────────────────────────────────────────────

alter table profiles enable row level security;

create policy "profiles_select_self_or_staff" on profiles
for select using (id = auth.uid () or is_staff ());

create policy "profiles_update_self" on profiles
for update using (id = auth.uid ())
with check (id = auth.uid ());

create policy "profiles_update_staff" on profiles
for update using (is_staff ());

-- ─── clients ────────────────────────────────────────────────────

alter table clients enable row level security;

create policy "clients_select" on clients
for select using (id = auth.uid () or manages_client (id));

create policy "clients_insert_staff" on clients
for insert with check (is_staff ());

create policy "clients_update_staff" on clients
for update using (manages_client (id));

create policy "clients_delete_admin" on clients
for delete using (is_admin ());

-- ─── exercises & templates (biblioteca partilhada) ──────────────

alter table exercises enable row level security;

create policy "exercises_select_authenticated" on exercises
for select using (auth.uid () is not null);

create policy "exercises_write_staff" on exercises
for all using (is_staff ())
with check (is_staff ());

alter table workout_templates enable row level security;

create policy "workout_templates_select_staff" on workout_templates
for select using (is_staff ());

create policy "workout_templates_write_staff" on workout_templates
for all using (is_staff ())
with check (is_staff ());

-- ─── workout_plans / days / exercises ────────────────────────────

alter table workout_plans enable row level security;

create policy "workout_plans_select" on workout_plans
for select using (client_id = auth.uid () or manages_client (client_id));

create policy "workout_plans_write_staff" on workout_plans
for all using (manages_client (client_id))
with check (manages_client (client_id));

alter table workout_days enable row level security;

create policy "workout_days_select" on workout_days
for select using (
  exists (
    select 1 from workout_plans p
    where p.id = plan_id and (p.client_id = auth.uid () or manages_client (p.client_id))
  )
);

create policy "workout_days_write_staff" on workout_days
for all using (
  exists (select 1 from workout_plans p where p.id = plan_id and manages_client (p.client_id))
)
with check (
  exists (select 1 from workout_plans p where p.id = plan_id and manages_client (p.client_id))
);

alter table workout_exercises enable row level security;

create policy "workout_exercises_select" on workout_exercises
for select using (
  exists (
    select 1 from workout_days d
    join workout_plans p on p.id = d.plan_id
    where d.id = day_id and (p.client_id = auth.uid () or manages_client (p.client_id))
  )
);

create policy "workout_exercises_write_staff" on workout_exercises
for all using (
  exists (
    select 1 from workout_days d
    join workout_plans p on p.id = d.plan_id
    where d.id = day_id and manages_client (p.client_id)
  )
)
with check (
  exists (
    select 1 from workout_days d
    join workout_plans p on p.id = d.plan_id
    where d.id = day_id and manages_client (p.client_id)
  )
);

-- ─── exercise_logs (registo de performance do cliente) ──────────

alter table exercise_logs enable row level security;

create policy "exercise_logs_select" on exercise_logs
for select using (client_id = auth.uid () or manages_client (client_id));

create policy "exercise_logs_insert_self" on exercise_logs
for insert with check (client_id = auth.uid () or manages_client (client_id));

create policy "exercise_logs_update_own" on exercise_logs
for update using (client_id = auth.uid () or manages_client (client_id));

-- ─── nutrition_plans / meals / meal_items ────────────────────────

alter table nutrition_plans enable row level security;

create policy "nutrition_plans_select" on nutrition_plans
for select using (client_id = auth.uid () or manages_client (client_id));

create policy "nutrition_plans_write_staff" on nutrition_plans
for all using (manages_client (client_id))
with check (manages_client (client_id));

alter table meals enable row level security;

create policy "meals_select" on meals
for select using (
  exists (
    select 1 from nutrition_plans np
    where np.id = nutrition_plan_id and (np.client_id = auth.uid () or manages_client (np.client_id))
  )
);

create policy "meals_write_staff" on meals
for all using (
  exists (select 1 from nutrition_plans np where np.id = nutrition_plan_id and manages_client (np.client_id))
)
with check (
  exists (select 1 from nutrition_plans np where np.id = nutrition_plan_id and manages_client (np.client_id))
);

alter table meal_items enable row level security;

create policy "meal_items_select" on meal_items
for select using (
  exists (
    select 1 from meals m
    join nutrition_plans np on np.id = m.nutrition_plan_id
    where m.id = meal_id and (np.client_id = auth.uid () or manages_client (np.client_id))
  )
);

create policy "meal_items_write_staff" on meal_items
for all using (
  exists (
    select 1 from meals m
    join nutrition_plans np on np.id = m.nutrition_plan_id
    where m.id = meal_id and manages_client (np.client_id)
  )
)
with check (
  exists (
    select 1 from meals m
    join nutrition_plans np on np.id = m.nutrition_plan_id
    where m.id = meal_id and manages_client (np.client_id)
  )
);

-- ─── progress_metrics / progress_photos ─────────────────────────

alter table progress_metrics enable row level security;

create policy "progress_metrics_select" on progress_metrics
for select using (client_id = auth.uid () or manages_client (client_id));

create policy "progress_metrics_insert_self" on progress_metrics
for insert with check (client_id = auth.uid () or manages_client (client_id));

create policy "progress_metrics_update_own" on progress_metrics
for update using (client_id = auth.uid () or manages_client (client_id));

alter table progress_photos enable row level security;

create policy "progress_photos_select" on progress_photos
for select using (client_id = auth.uid () or manages_client (client_id));

create policy "progress_photos_insert_self" on progress_photos
for insert with check (client_id = auth.uid () or manages_client (client_id));

create policy "progress_photos_delete_own" on progress_photos
for delete using (client_id = auth.uid () or manages_client (client_id));

-- ─── checkins ───────────────────────────────────────────────────

alter table checkins enable row level security;

create policy "checkins_select" on checkins
for select using (client_id = auth.uid () or manages_client (client_id));

create policy "checkins_insert_self" on checkins
for insert with check (client_id = auth.uid ());

create policy "checkins_update_self_before_review" on checkins
for update using (client_id = auth.uid () and status = 'pending');

create policy "checkins_update_staff" on checkins
for update using (manages_client (client_id));

-- ─── conversations / messages ────────────────────────────────────

alter table conversations enable row level security;

create policy "conversations_select" on conversations
for select using (client_id = auth.uid () or manages_client (client_id));

alter table messages enable row level security;

create policy "messages_select" on messages
for select using (
  exists (
    select 1 from conversations c
    where c.id = conversation_id and (c.client_id = auth.uid () or manages_client (c.client_id))
  )
);

create policy "messages_insert" on messages
for insert with check (
  sender_id = auth.uid ()
  and exists (
    select 1 from conversations c
    where c.id = conversation_id and (c.client_id = auth.uid () or manages_client (c.client_id))
  )
);

create policy "messages_update_read_receipt" on messages
for update using (
  exists (
    select 1 from conversations c
    where c.id = conversation_id and (c.client_id = auth.uid () or manages_client (c.client_id))
  )
);

-- ─── notifications ──────────────────────────────────────────────

alter table notifications enable row level security;

create policy "notifications_select_own" on notifications
for select using (user_id = auth.uid ());

create policy "notifications_update_own" on notifications
for update using (user_id = auth.uid ());

create policy "notifications_insert_staff" on notifications
for insert with check (is_staff () or user_id = auth.uid ());

-- ─── badges / client_badges ──────────────────────────────────────

alter table badges enable row level security;

create policy "badges_select_authenticated" on badges
for select using (auth.uid () is not null);

create policy "badges_write_admin" on badges
for all using (is_admin ())
with check (is_admin ());

alter table client_badges enable row level security;

create policy "client_badges_select" on client_badges
for select using (client_id = auth.uid () or manages_client (client_id));

create policy "client_badges_insert_staff" on client_badges
for insert with check (is_staff ());
