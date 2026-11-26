-- Quando o cliente guarda um questionário, o que ele respondeu passa
-- para os dados dele, sem o coach ter de preencher à mão:
--   · sexo e altura → ficha do cliente (só se ainda estiverem vazios)
--   · peso → primeiro registo no Progresso (só se ainda não houver peso)
-- Valores fora do normal (altura 100–250 cm, peso 30–300 kg) são ignorados.

create or replace function sync_questionnaire_to_client ()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  raw_height text := replace(btrim(coalesce(new.answers ->> 'height', '')), ',', '.');
  raw_weight text := replace(btrim(coalesce(new.answers ->> 'weight', '')), ',', '.');
  sex_answer text := new.answers ->> 'sex';
  v_height numeric;
  v_weight numeric;
begin
  if sex_answer in ('male', 'female') then
    update clients set sex = sex_answer::client_sex where id = new.client_id and sex is null;
  end if;

  if raw_height ~ '^\d+(\.\d+)?$' then
    v_height := raw_height::numeric;
    if v_height <= 3 then v_height := v_height * 100; end if;
    if v_height between 100 and 250 then
      update clients set height_cm = round(v_height, 1) where id = new.client_id and clients.height_cm is null;
    end if;
  end if;

  if raw_weight ~ '^\d+(\.\d+)?$' then
    v_weight := raw_weight::numeric;
    if v_weight between 30 and 300
      and not exists (
        select 1 from progress_metrics pm where pm.client_id = new.client_id and pm.weight_kg is not null
      ) then
      insert into progress_metrics (client_id, weight_kg) values (new.client_id, round(v_weight, 1));
    end if;
  end if;

  return new;
end;
$$;

create trigger sync_questionnaire_to_client
after insert or update of answers on questionnaire_responses
for each row execute function sync_questionnaire_to_client ();
