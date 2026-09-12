-- ─────────────────────────────────────────────────────────────
-- Dias da semana para o plano alimentar: cada refeição passa a
-- poder ter um dia associado (0=Domingo..6=Sábado, igual à
-- convenção já usada em workout_days.weekday), para o admin criar
-- refeições diferentes por dia e o cliente ver o dia certo.
-- ─────────────────────────────────────────────────────────────

alter table meals add column weekday int check (weekday between 0 and 6);
