-- =============================================================================
-- VOVIAN · 1000 · Storage buckets & policies
--   media: public-read product + content imagery. Uploads restricted by
--          permission, MIME type and size; paths are namespaced by area.
-- =============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'media', 'media', true, 10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Public read
create policy media_public_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'media');

-- products/** → products.write ; content/** → content.write ; brand/** → settings.write
create policy media_staff_insert on storage.objects for insert to authenticated
  with check (
    bucket_id = 'media' and (
      ((storage.foldername(name))[1] = 'products' and public.has_permission('products.write')) or
      ((storage.foldername(name))[1] = 'content'  and public.has_permission('content.write')) or
      ((storage.foldername(name))[1] = 'brand'    and public.has_permission('settings.write'))
    )
  );

create policy media_staff_update on storage.objects for update to authenticated
  using (
    bucket_id = 'media' and (
      ((storage.foldername(name))[1] = 'products' and public.has_permission('products.write')) or
      ((storage.foldername(name))[1] = 'content'  and public.has_permission('content.write')) or
      ((storage.foldername(name))[1] = 'brand'    and public.has_permission('settings.write'))
    )
  );

create policy media_staff_delete on storage.objects for delete to authenticated
  using (
    bucket_id = 'media' and (
      ((storage.foldername(name))[1] = 'products' and public.has_permission('products.write')) or
      ((storage.foldername(name))[1] = 'content'  and public.has_permission('content.write')) or
      ((storage.foldername(name))[1] = 'brand'    and public.has_permission('settings.write'))
    )
  );

-- Realtime: staff dashboards subscribe to new orders and notifications.
alter publication supabase_realtime add table public.orders;
alter publication supabase_realtime add table public.notifications;
