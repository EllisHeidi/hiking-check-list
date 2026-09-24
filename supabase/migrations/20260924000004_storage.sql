-- Mountain Kill List — Storage buckets and policies
-- hike-photos: PRIVATE. Path {user_id}/{hike_id}/{file}. Served via signed URLs.
-- avatars:     PUBLIC.  Path {user_id}/{file}.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('hike-photos', 'hike-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp']),
  ('avatars', 'avatars', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- hike-photos ---------------------------------------------------------------------
create policy "Hike photos are readable by their owner or when the owner is public"
  on storage.objects for select
  to anon, authenticated
  using (
    bucket_id = 'hike-photos'
    and (
      (storage.foldername(name))[1] = (select auth.uid())::text
      or exists (
        select 1 from public.profiles p
        where p.id::text = (storage.foldername(name))[1] and p.is_public
      )
    )
  );

create policy "Users upload hike photos into their own hikes"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'hike-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
    and exists (
      select 1 from public.user_hikes h
      where h.id::text = (storage.foldername(name))[2]
        and h.user_id = (select auth.uid())
    )
  );

create policy "Users delete their own hike photos"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'hike-photos'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

-- avatars -------------------------------------------------------------------------
create policy "Avatars are publicly readable"
  on storage.objects for select
  to anon, authenticated
  using (bucket_id = 'avatars');

create policy "Users upload their own avatar"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users replace their own avatar"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );

create policy "Users delete their own avatar"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid())::text
  );
