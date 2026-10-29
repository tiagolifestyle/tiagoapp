-- Lista de compras escrita pelo coach para cada plano alimentar.
-- Formato: [{"category": "Proteína", "items": ["Pechuga de pollo — 850 g", ...]}, ...]
-- As permissões já são as do nutrition_plans (o cliente lê o seu, o coach escreve).

alter table nutrition_plans
  add column shopping_list jsonb;
