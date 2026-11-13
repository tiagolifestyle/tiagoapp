-- Alcunha para o ranking, escolhida pelo cliente no Perfil (2 a 20
-- caracteres, única sem distinguir maiúsculas). Sem alcunha, o ranking
-- continua a mostrar o primeiro nome + inicial do apelido.

alter table profiles
  add column ranking_nickname text
  check (ranking_nickname is null or char_length(btrim(ranking_nickname)) between 2 and 20);

create unique index profiles_ranking_nickname_unique on profiles (lower(btrim(ranking_nickname)))
where ranking_nickname is not null;

create or replace function get_ranking (period text default 'all')
returns table (
  rank int,
  display_name text,
  points int,
  total_points int,
  is_me boolean
)
language sql
stable
security definer
set search_path = public
as $$
  with eligible as (
    select p.id, trim(p.full_name) as full_name, nullif(btrim(p.ranking_nickname), '') as nickname
    from profiles p
    join clients c on c.id = p.id
    where p.role = 'client' and p.show_in_ranking
  ),
  scored as (
    select
      e.id,
      e.full_name,
      e.nickname,
      (
        select count(*) from workout_completions w
        where w.client_id = e.id
          and (
            period <> 'month'
            or w.completed_at >= date_trunc('month', now() at time zone 'Europe/Lisbon')::date
          )
      )::int as points,
      (select count(*) from workout_completions w where w.client_id = e.id)::int as total_points
    from eligible e
  ),
  ranked as (
    select
      row_number() over (order by s.points desc, s.total_points desc, s.full_name)::int as rank,
      coalesce(
        s.nickname,
        split_part(s.full_name, ' ', 1)
          || case
            when position(' ' in s.full_name) > 0
              then ' ' || left(regexp_replace(s.full_name, '^.*\s', ''), 1) || '.'
            else ''
          end
      ) as display_name,
      s.points,
      s.total_points,
      s.id = auth.uid () as is_me
    from scored s
  )
  select r.rank, r.display_name, r.points, r.total_points, r.is_me
  from ranked r
  where auth.uid () is not null and (r.rank <= 10 or r.is_me)
  order by r.rank;
$$;
