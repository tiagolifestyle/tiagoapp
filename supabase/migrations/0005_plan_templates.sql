-- ─────────────────────────────────────────────────────────────
-- Simplifica templates: em vez de uma tabela separada
-- (workout_templates) sem estrutura de dias/exercícios própria,
-- um template passa a ser um workout_plan com client_id nulo e
-- is_template = true. Isto permite reutilizar toda a estrutura de
-- workout_days/workout_exercises já existente ao duplicar um
-- template para um cliente.
-- ─────────────────────────────────────────────────────────────

alter table workout_plans
  drop constraint workout_plans_client_id_fkey,
  alter column client_id drop not null,
  add column is_template boolean not null default false,
  add constraint workout_plans_client_id_fkey
    foreign key (client_id) references clients (id) on delete cascade,
  add constraint workout_plans_template_or_client_chk
    check (
      (is_template = true and client_id is null)
      or (is_template = false and client_id is not null)
    );

alter table workout_plans drop column template_id;

drop table if exists workout_templates;

-- ─── RLS: permitir a admin/coach gerir templates (client_id nulo) ──

create or replace function manages_plan_client (p_client_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    case
      when p_client_id is null then is_staff ()
      else manages_client (p_client_id)
    end;
$$;

drop policy "workout_plans_select" on workout_plans;
drop policy "workout_plans_write_staff" on workout_plans;

create policy "workout_plans_select" on workout_plans
for select using (
  client_id = auth.uid () or manages_plan_client (client_id)
);

create policy "workout_plans_write_staff" on workout_plans
for all using (manages_plan_client (client_id))
with check (manages_plan_client (client_id));

drop policy "workout_days_select" on workout_days;
drop policy "workout_days_write_staff" on workout_days;

create policy "workout_days_select" on workout_days
for select using (
  exists (
    select 1 from workout_plans p
    where p.id = plan_id and (p.client_id = auth.uid () or manages_plan_client (p.client_id))
  )
);

create policy "workout_days_write_staff" on workout_days
for all using (
  exists (select 1 from workout_plans p where p.id = plan_id and manages_plan_client (p.client_id))
)
with check (
  exists (select 1 from workout_plans p where p.id = plan_id and manages_plan_client (p.client_id))
);

drop policy "workout_exercises_select" on workout_exercises;
drop policy "workout_exercises_write_staff" on workout_exercises;

create policy "workout_exercises_select" on workout_exercises
for select using (
  exists (
    select 1 from workout_days d
    join workout_plans p on p.id = d.plan_id
    where d.id = day_id and (p.client_id = auth.uid () or manages_plan_client (p.client_id))
  )
);

create policy "workout_exercises_write_staff" on workout_exercises
for all using (
  exists (
    select 1 from workout_days d
    join workout_plans p on p.id = d.plan_id
    where d.id = day_id and manages_plan_client (p.client_id)
  )
)
with check (
  exists (
    select 1 from workout_days d
    join workout_plans p on p.id = d.plan_id
    where d.id = day_id and manages_plan_client (p.client_id)
  )
);

create index workout_plans_is_template_idx on workout_plans (is_template);
