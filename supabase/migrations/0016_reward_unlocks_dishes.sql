-- ─────────────────────────────────────────────────────────────
-- Uma promoção pode desbloquear os Pratos especiais. Enquanto o
-- cliente não a resgatar, os pratos ficam bloqueados para ele; o
-- resgate dessas promoções é automático e fica logo "entregue".
-- Sem nenhuma promoção marcada, os pratos ficam abertos a todos.
-- ─────────────────────────────────────────────────────────────

alter table rewards add column unlocks_special_dishes boolean not null default false;

create or replace function mark_auto_delivered_redemption ()
returns trigger
language plpgsql
as $$
begin
  if exists (select 1 from rewards r where r.id = new.reward_id and r.unlocks_special_dishes) then
    new.delivered_at := now();
  end if;
  return new;
end;
$$;

create trigger mark_auto_delivered_redemption before insert on reward_redemptions
for each row execute function mark_auto_delivered_redemption ();

drop policy "special_dishes_select_authenticated" on special_dishes;

create policy "special_dishes_select_unlocked" on special_dishes
for select using (
  auth.uid () is not null
  and (
    is_staff ()
    or not exists (select 1 from rewards r where r.unlocks_special_dishes)
    or exists (
      select 1 from reward_redemptions rr
      join rewards r on r.id = rr.reward_id
      where r.unlocks_special_dishes and rr.client_id = auth.uid ()
    )
  )
);
