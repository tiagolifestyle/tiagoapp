-- ─────────────────────────────────────────────────────────────
-- "Ativo até": data opcional a partir da qual um cliente com
-- status 'active' passa automaticamente a 'inactive'. A transição
-- é aplicada pela app (apps/admin) sempre que o coach abre o painel.
-- ─────────────────────────────────────────────────────────────

alter table clients add column active_until date;
