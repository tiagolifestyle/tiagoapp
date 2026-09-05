-- ─────────────────────────────────────────────────────────────
-- Avaliação do coach sobre se cada zona da diástase está
-- "funcional" ou não. Só o coach edita (via manages_client, já
-- coberto pela policy postpartum_profiles_update_self existente);
-- o cliente só vê.
-- ─────────────────────────────────────────────────────────────

alter table postpartum_profiles add column supraumbilical_functional boolean;
alter table postpartum_profiles add column umbilical_functional boolean;
alter table postpartum_profiles add column infraumbilical_functional boolean;

-- O coach precisa de poder criar a linha (upsert) mesmo que o cliente
-- ainda não tenha preenchido nada, para poder guardar a avaliação
-- "Funcional?" primeiro.
drop policy "postpartum_profiles_insert_self" on postpartum_profiles;

create policy "postpartum_profiles_insert" on postpartum_profiles
for insert with check (client_id = auth.uid () or manages_client (client_id));
