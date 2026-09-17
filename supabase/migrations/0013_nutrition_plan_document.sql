-- Permite anexar um documento (Word/PDF) com o plano alimentar completo a um
-- nutrition_plan, para o cliente poder descarregar na app.

alter table nutrition_plans
  add column document_url text,
  add column document_name text;

insert into storage.buckets (id, name, public)
values ('nutrition-documents', 'nutrition-documents', false)
on conflict (id) do nothing;

-- nutrition-documents: caminho esperado "{client_id}/{filename}" — o próprio
-- cliente pode ler (descarregar), só o coach responsável pode escrever/apagar.
create policy "nutrition_documents_owner_read" on storage.objects
for select using (
  bucket_id = 'nutrition-documents'
  and (
    (storage.foldername (name)) [1] = auth.uid ()::text
    or manages_client (((storage.foldername (name)) [1])::uuid)
  )
);

create policy "nutrition_documents_staff_write" on storage.objects
for insert with check (
  bucket_id = 'nutrition-documents'
  and manages_client (((storage.foldername (name)) [1])::uuid)
);

create policy "nutrition_documents_staff_update" on storage.objects
for update using (
  bucket_id = 'nutrition-documents'
  and manages_client (((storage.foldername (name)) [1])::uuid)
);

create policy "nutrition_documents_staff_delete" on storage.objects
for delete using (
  bucket_id = 'nutrition-documents'
  and manages_client (((storage.foldername (name)) [1])::uuid)
);
