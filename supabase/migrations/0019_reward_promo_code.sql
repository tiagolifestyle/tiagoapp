-- ─────────────────────────────────────────────────────────────
-- Uma promoção pode ter um código promocional (igual para todos),
-- que o cliente vê depois de resgatar. Com código, o resgate fica
-- logo "entregue", tal como as promoções que desbloqueiam os pratos.
-- ─────────────────────────────────────────────────────────────

alter table rewards add column promo_code text;

create or replace function mark_auto_delivered_redemption ()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1 from rewards r
    where r.id = new.reward_id
      and (r.unlocks_special_dishes or coalesce(r.promo_code, '') <> '')
  ) then
    new.delivered_at := now();
  end if;
  return new;
end;
$$;
