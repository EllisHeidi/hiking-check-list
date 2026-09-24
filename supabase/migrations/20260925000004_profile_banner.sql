-- Custom profile banner photo. Stored in the public avatars bucket under the
-- hiker's own folder ({user_id}/banner-….jpg); existing storage policies
-- already restrict uploads to your own folder, and the profiles update policy
-- restricts edits to your own row.
alter table public.profiles
  add column if not exists banner_url text;
