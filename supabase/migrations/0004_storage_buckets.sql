-- ─────────────────────────────────────────────────────────────
-- Storage buckets
--
--   exercise-media    → público (imagens/vídeos/GIFs da biblioteca de exercícios)
--   progress-photos   → privado (fotos de progresso: apenas o próprio cliente e staff)
--   chat-attachments  → privado (anexos de mensagens)
-- ─────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public)
values
  ('exercise-media', 'exercise-media', true),
  ('progress-photos', 'progress-photos', false),
  ('chat-attachments', 'chat-attachments', false)
on conflict (id) do nothing;

-- exercise-media: leitura pública, escrita apenas para admin/coach
create policy "exercise_media_public_read" on storage.objects
for select using (bucket_id = 'exercise-media');

create policy "exercise_media_staff_write" on storage.objects
for insert with check (bucket_id = 'exercise-media' and is_staff ());

create policy "exercise_media_staff_update" on storage.objects
for update using (bucket_id = 'exercise-media' and is_staff ());

create policy "exercise_media_staff_delete" on storage.objects
for delete using (bucket_id = 'exercise-media' and is_staff ());

-- progress-photos: caminho esperado "{client_id}/{filename}" — o próprio
-- cliente e o coach responsável podem ler/escrever; ninguém mais.
create policy "progress_photos_owner_read" on storage.objects
for select using (
  bucket_id = 'progress-photos'
  and (
    (storage.foldername (name)) [1] = auth.uid ()::text
    or manages_client (((storage.foldername (name)) [1])::uuid)
  )
);

create policy "progress_photos_owner_write" on storage.objects
for insert with check (
  bucket_id = 'progress-photos'
  and (storage.foldername (name)) [1] = auth.uid ()::text
);

create policy "progress_photos_owner_delete" on storage.objects
for delete using (
  bucket_id = 'progress-photos'
  and (
    (storage.foldername (name)) [1] = auth.uid ()::text
    or manages_client (((storage.foldername (name)) [1])::uuid)
  )
);

-- chat-attachments: apenas participantes da conversa (caminho "{conversation_id}/{filename}")
create policy "chat_attachments_participant_read" on storage.objects
for select using (
  bucket_id = 'chat-attachments'
  and exists (
    select 1 from conversations c
    where c.id = ((storage.foldername (name)) [1])::uuid
      and (c.client_id = auth.uid () or manages_client (c.client_id))
  )
);

create policy "chat_attachments_participant_write" on storage.objects
for insert with check (
  bucket_id = 'chat-attachments'
  and exists (
    select 1 from conversations c
    where c.id = ((storage.foldername (name)) [1])::uuid
      and (c.client_id = auth.uid () or manages_client (c.client_id))
  )
);
