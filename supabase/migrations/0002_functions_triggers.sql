-- ─────────────────────────────────────────────────────────────
-- Funções e triggers utilitários
-- ─────────────────────────────────────────────────────────────

-- Mantém updated_at atualizado automaticamente
create or replace function set_updated_at ()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare
  t text;
begin
  for t in
    select unnest(array[
      'profiles', 'clients', 'exercises', 'workout_templates', 'workout_plans',
      'workout_days', 'workout_exercises', 'nutrition_plans'
    ])
  loop
    execute format(
      'create trigger set_updated_at before update on %I for each row execute function set_updated_at();',
      t
    );
  end loop;
end;
$$;

-- Cria automaticamente uma linha em profiles (e clients, se aplicável)
-- quando um novo utilizador se regista via Supabase Auth.
-- O papel e nome vêm de raw_user_meta_data, definidos no signUp().
create or replace function handle_new_user ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  requested_role user_role;
begin
  requested_role := coalesce(
    (new.raw_user_meta_data ->> 'role')::user_role,
    'client'
  );

  insert into public.profiles (id, role, full_name, locale)
  values (
    new.id,
    requested_role,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    coalesce((new.raw_user_meta_data ->> 'locale')::app_locale, 'pt')
  );

  if requested_role = 'client' then
    insert into public.clients (id, coach_id)
    values (new.id, (new.raw_user_meta_data ->> 'coach_id')::uuid);

    insert into public.conversations (client_id, coach_id)
    values (new.id, (new.raw_user_meta_data ->> 'coach_id')::uuid);
  end if;

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users for each row
execute function handle_new_user ();

-- Regista automaticamente uma nova versão de plano de treino sempre que
-- um plano "active" é substituído por um novo (mantém o histórico legível
-- via parent_plan_id, ver 0001_init_schema.sql).
create or replace function next_plan_version (p_parent_plan_id uuid, p_table text)
returns int
language plpgsql
as $$
declare
  v_version int;
begin
  if p_table = 'workout_plans' then
    select coalesce(max(version), 0) + 1 into v_version
    from workout_plans
    where id = p_parent_plan_id or parent_plan_id = p_parent_plan_id;
  else
    select coalesce(max(version), 0) + 1 into v_version
    from nutrition_plans
    where id = p_parent_plan_id or parent_plan_id = p_parent_plan_id;
  end if;

  return v_version;
end;
$$;
