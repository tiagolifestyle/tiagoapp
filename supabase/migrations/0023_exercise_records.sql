-- ─────────────────────────────────────────────────────────────
-- Recordes por exercício (Masculino / Feminino). O coach escolhe os
-- exercícios da biblioteca e escreve quem tem o recorde e o peso,
-- depois de validar o vídeo. O recorde fica até alguém o bater.
-- Os clientes veem-nos através de get_records(), que só devolve a
-- alcunha (ou primeiro nome + inicial), o peso e os pontos para o
-- nível — "Anónimo" se o cliente se escondeu do ranking.
-- ─────────────────────────────────────────────────────────────

create type client_sex as enum ('male', 'female');

alter table clients add column sex client_sex;

create table exercise_records (
  id uuid primary key default gen_random_uuid (),
  exercise_id uuid not null references exercises (id) on delete cascade,
  gender client_sex not null,
  order_index int not null default 0,
  holder_client_id uuid references clients (id) on delete set null,
  weight_kg numeric(6, 2),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (exercise_id, gender)
);

create trigger set_updated_at before update on exercise_records
for each row execute function set_updated_at ();

alter table exercise_records enable row level security;

create policy "exercise_records_staff" on exercise_records
for all using (is_staff ())
with check (is_staff ());

create or replace function get_records ()
returns table (
  id uuid,
  gender text,
  order_index int,
  exercise_name text,
  image_url text,
  weight_kg numeric,
  holder_name text,
  holder_hidden boolean,
  holder_points int
)
language sql
stable
security definer
set search_path = public
as $$
  select
    r.id,
    r.gender::text,
    r.order_index,
    e.name,
    e.image_url,
    case when r.holder_client_id is not null then r.weight_kg end,
    case
      when p.id is null or not p.show_in_ranking then null
      else coalesce(
        nullif(btrim(p.ranking_nickname), ''),
        split_part(trim(p.full_name), ' ', 1)
          || case
            when position(' ' in trim(p.full_name)) > 0
              then ' ' || left(regexp_replace(trim(p.full_name), '^.*\s', ''), 1) || '.'
            else ''
          end
      )
    end,
    p.id is not null and not p.show_in_ranking,
    case
      when p.id is not null
        then (select count(*) from workout_completions w where w.client_id = p.id)::int
    end
  from exercise_records r
  join exercises e on e.id = r.exercise_id
  left join profiles p on p.id = r.holder_client_id
  where auth.uid () is not null
  order by r.gender, r.order_index, e.name;
$$;

revoke all on function get_records () from public, anon;
grant execute on function get_records () to authenticated;
