-- ─────────────────────────────────────────────────────────────
-- Conteúdo de Pós-parto passa a ter título/texto em 3 idiomas
-- (PT/ES/EN), escritos pelo coach — sem tradução automática, sem
-- custos externos. O conteúdo existente é copiado para os 3 campos
-- como ponto de partida para o coach rever/traduzir.
-- ─────────────────────────────────────────────────────────────

alter table postpartum_content_cards add column title_pt text;
alter table postpartum_content_cards add column title_es text;
alter table postpartum_content_cards add column title_en text;
alter table postpartum_content_cards add column body_pt text;
alter table postpartum_content_cards add column body_es text;
alter table postpartum_content_cards add column body_en text;

update postpartum_content_cards
set title_pt = title, title_es = title, title_en = title,
    body_pt = body, body_es = body, body_en = body;

alter table postpartum_content_cards alter column title_pt set not null;
alter table postpartum_content_cards alter column title_es set not null;
alter table postpartum_content_cards alter column title_en set not null;

alter table postpartum_content_cards drop column title;
alter table postpartum_content_cards drop column body;
