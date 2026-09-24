-- Mountain Kill List — Row Level Security
-- Rule of thumb: identity always comes from auth.uid(), never from a client-sent id.
-- Visibility: you can always see yourself; others only if their profile is public.

alter table public.profiles enable row level security;
alter table public.mountains enable row level security;
alter table public.user_hikes enable row level security;
alter table public.hike_photos enable row level security;
alter table public.follows enable row level security;
alter table public.achievements enable row level security;
alter table public.user_achievements enable row level security;
alter table public.activity enable row level security;

-- profiles ------------------------------------------------------------------
-- Rows are created by the on_auth_user_created trigger, so there is no insert policy.
create policy "Profiles are visible to their owner or when public"
  on public.profiles for select
  to anon, authenticated
  using (public.can_view_user(id));

create policy "Users update their own profile"
  on public.profiles for update
  to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

-- mountains / achievements: global, read-only through the API ----------------
create policy "Mountains are readable by everyone"
  on public.mountains for select
  to anon, authenticated
  using (true);

create policy "Achievement definitions are readable by everyone"
  on public.achievements for select
  to anon, authenticated
  using (true);

-- user_hikes -------------------------------------------------------------------
create policy "Hikes are visible to their owner or when the owner is public"
  on public.user_hikes for select
  to anon, authenticated
  using (public.can_view_user(user_id));

create policy "Users log their own hikes"
  on public.user_hikes for insert
  to authenticated
  with check (user_id = (select auth.uid()));

create policy "Users edit their own hikes"
  on public.user_hikes for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "Users delete their own hikes"
  on public.user_hikes for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- hike_photos --------------------------------------------------------------------
create policy "Photos are visible to their owner or when the owner is public"
  on public.hike_photos for select
  to anon, authenticated
  using (public.can_view_user(user_id));

-- You can only attach a photo to your own hike, and only a file stored under
-- your own {user_id}/{hike_id}/ folder.
create policy "Users add photos to their own hikes"
  on public.hike_photos for insert
  to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.user_hikes h
      where h.id = hike_id and h.user_id = (select auth.uid())
    )
    and storage_path like (select auth.uid())::text || '/' || hike_id::text || '/%'
  );

create policy "Users edit their own photo captions"
  on public.hike_photos for update
  to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.user_hikes h
      where h.id = hike_id and h.user_id = (select auth.uid())
    )
    and storage_path like (select auth.uid())::text || '/' || hike_id::text || '/%'
  );

create policy "Users delete their own photos"
  on public.hike_photos for delete
  to authenticated
  using (user_id = (select auth.uid()));

-- follows ----------------------------------------------------------------------
-- Individual follow rows are visible to the two people involved. Public counts
-- come from get_profile_card().
create policy "Follows are visible to the people involved"
  on public.follows for select
  to authenticated
  using (follower_id = (select auth.uid()) or following_id = (select auth.uid()));

create policy "Users follow others as themselves"
  on public.follows for insert
  to authenticated
  with check (
    follower_id = (select auth.uid())
    and following_id <> (select auth.uid())
  );

create policy "Users unfollow as themselves"
  on public.follows for delete
  to authenticated
  using (follower_id = (select auth.uid()));

-- user_achievements / activity: written by triggers only ----------------------
create policy "Earned achievements follow profile visibility"
  on public.user_achievements for select
  to anon, authenticated
  using (public.can_view_user(user_id));

create policy "Activity follows profile visibility"
  on public.activity for select
  to anon, authenticated
  using (public.can_view_user(user_id));
