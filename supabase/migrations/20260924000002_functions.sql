-- Mountain Kill List — functions and triggers
-- Everything that writes on a user's behalf (profiles, activity, achievements)
-- happens here, server-side, so clients never need write access to those tables.

-- ---------------------------------------------------------------------------
-- updated_at
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger user_hikes_set_updated_at
  before update on public.user_hikes
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Profile creation on signup. Username comes from signup metadata and is
-- normalised + de-duplicated here so signup can never fail on a clash.
-- ---------------------------------------------------------------------------
-- Give a hiker the starter kill list (the seeded progression), once — only if
-- their list is empty, so it never re-adds mountains they removed.
create or replace function public.seed_starter_list(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if exists (select 1 from public.user_mountains where user_id = p_user) then
    return;
  end if;
  insert into public.user_mountains (user_id, mountain_id, sort_order, is_final_goal)
  select p_user, m.id, m.sort_order, m.is_final_goal
  from public.mountains m
  where m.is_starter
  on conflict (user_id, mountain_id) do nothing;
end;
$$;

create or replace function public.create_profile_for(p_id uuid, p_email text, p_meta jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text;
  candidate text;
  n integer := 0;
begin
  if exists (select 1 from public.profiles where id = p_id) then
    return;
  end if;

  base := lower(coalesce(
    nullif(p_meta ->> 'username', ''),
    split_part(p_email, '@', 1),
    'hiker'
  ));
  base := regexp_replace(base, '[^a-z0-9_]', '', 'g');
  if char_length(base) < 3 then
    base := base || 'hiker';
  end if;
  base := left(base, 20);
  candidate := base;

  while exists (select 1 from public.profiles where username = candidate) loop
    n := n + 1;
    candidate := base || n::text;
  end loop;

  insert into public.profiles (id, username, display_name)
  values (
    p_id,
    candidate,
    left(nullif(trim(p_meta ->> 'display_name'), ''), 60)
  )
  on conflict (id) do nothing;

  perform public.seed_starter_list(p_id);
end;
$$;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform public.create_profile_for(new.id, new.email, coalesce(new.raw_user_meta_data, '{}'::jsonb));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Self-heal: create the caller's profile if it's missing (e.g. the account was
-- created before this migration ran). Only ever acts on auth.uid().
create or replace function public.ensure_profile()
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return;
  end if;
  perform public.create_profile_for(u.id, u.email, coalesce(u.raw_user_meta_data, '{}'::jsonb))
  from auth.users u
  where u.id = auth.uid();
end;
$$;

-- Backfill profiles for accounts that signed up before this migration.
select public.create_profile_for(u.id, u.email, coalesce(u.raw_user_meta_data, '{}'::jsonb))
from auth.users u
where not exists (select 1 from public.profiles p where p.id = u.id);

-- ---------------------------------------------------------------------------
-- Visibility helper used by RLS: you can see yourself, and anyone public.
-- SECURITY DEFINER so it can read profiles without recursing into RLS.
-- ---------------------------------------------------------------------------
create or replace function public.can_view_user(target uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select coalesce(target = auth.uid(), false)
      or exists (select 1 from public.profiles p where p.id = target and p.is_public);
$$;

-- ---------------------------------------------------------------------------
-- Achievements: recompute what a user has earned from their hikes.
-- Awards newly met achievements (with an activity row) and revokes ones that
-- are no longer met (e.g. after deleting a mis-logged hike).
-- ---------------------------------------------------------------------------
create or replace function public.sync_user_achievements(p_user uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_mountains integer;
  v_total_km numeric;
  v_total_gain bigint;
  v_longest numeric;
  v_highest integer;
  v_final boolean;
  v_met uuid[];
begin
  if not exists (select 1 from public.profiles where id = p_user) then
    return;
  end if;

  select
    count(distinct h.mountain_id) filter (where h.completed),
    coalesce(sum(h.distance_km), 0),
    coalesce(sum(h.elevation_gain_m), 0),
    coalesce(max(h.distance_km), 0),
    coalesce(max(m.elevation) filter (where h.completed), 0),
    coalesce(bool_or(h.completed and um.is_final_goal), false)
  into v_mountains, v_total_km, v_total_gain, v_longest, v_highest, v_final
  from public.user_hikes h
  join public.mountains m on m.id = h.mountain_id
  -- The final objective is personal: whatever this hiker marked on their list.
  left join public.user_mountains um on um.user_id = h.user_id and um.mountain_id = h.mountain_id
  where h.user_id = p_user;

  select coalesce(array_agg(a.id), '{}')
  into v_met
  from public.achievements a
  where case a.requirement_type
    when 'mountains_completed' then v_mountains >= a.requirement_value
    when 'single_hike_km'      then v_longest >= a.requirement_value
    when 'total_distance_km'   then v_total_km >= a.requirement_value
    when 'total_elevation_m'   then v_total_gain >= a.requirement_value
    when 'summit_elevation_m'  then v_highest >= a.requirement_value
    when 'final_goal'          then v_final
    else false
  end;

  with inserted as (
    insert into public.user_achievements (user_id, achievement_id)
    select p_user, id from unnest(v_met) as id
    on conflict (user_id, achievement_id) do nothing
    returning achievement_id
  )
  insert into public.activity (user_id, achievement_id, activity_type)
  select p_user, achievement_id, 'achievement_earned' from inserted;

  delete from public.activity
  where user_id = p_user
    and activity_type = 'achievement_earned'
    and not (achievement_id = any (v_met));

  delete from public.user_achievements
  where user_id = p_user
    and not (achievement_id = any (v_met));
end;
$$;

-- ---------------------------------------------------------------------------
-- After any hike change: write activity + re-check achievements.
-- ---------------------------------------------------------------------------
create or replace function public.handle_user_hike_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_first boolean;
begin
  if tg_op in ('INSERT', 'UPDATE')
     and new.completed
     and (tg_op = 'INSERT' or not old.completed)
     and not exists (
       select 1 from public.activity
       where hike_id = new.id and activity_type in ('hike_completed', 'mountain_conquered')
     )
  then
    select not exists (
      select 1 from public.user_hikes
      where user_id = new.user_id
        and mountain_id = new.mountain_id
        and completed
        and id <> new.id
    ) into v_first;

    insert into public.activity (user_id, hike_id, activity_type)
    values (
      new.user_id,
      new.id,
      case when v_first then 'mountain_conquered' else 'hike_completed' end
    );
  end if;

  perform public.sync_user_achievements(
    case when tg_op = 'DELETE' then old.user_id else new.user_id end
  );
  return null;
end;
$$;

create trigger user_hikes_after_change
  after insert or update or delete on public.user_hikes
  for each row execute function public.handle_user_hike_change();

-- Changing your final objective can earn/revoke the Final Objective achievement.
create or replace function public.handle_user_mountain_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    if old.is_final_goal then
      perform public.sync_user_achievements(old.user_id);
    end if;
  elsif tg_op = 'INSERT' then
    if new.is_final_goal then
      perform public.sync_user_achievements(new.user_id);
    end if;
  elsif new.is_final_goal is distinct from old.is_final_goal then
    perform public.sync_user_achievements(new.user_id);
  end if;
  return null;
end;
$$;

create trigger user_mountains_after_change
  after insert or update or delete on public.user_mountains
  for each row execute function public.handle_user_mountain_change();

-- ---------------------------------------------------------------------------
-- Catalogue helpers
-- ---------------------------------------------------------------------------

-- API users can't touch the starter-list columns or ownership. Requests with a
-- JWT (auth.uid() set) get these forced; the dashboard / migrations (no JWT)
-- can still curate the starter list.
create or replace function public.guard_mountain_columns()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if auth.uid() is null then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.created_by := auth.uid();
    new.is_starter := false;
    new.is_final_goal := false;
    new.sort_order := 0;
  else
    new.created_by := old.created_by;
    new.is_starter := old.is_starter;
    new.is_final_goal := old.is_final_goal;
    new.sort_order := old.sort_order;
    new.slug := old.slug;
  end if;
  return new;
end;
$$;

create trigger mountains_guard_columns
  before insert or update on public.mountains
  for each row execute function public.guard_mountain_columns();

-- True when anyone other than the caller has this mountain on their list or has
-- logged a hike on it. Used to stop creators deleting mountains others rely on.
-- SECURITY DEFINER so private users' rows are counted too.
create or replace function public.mountain_in_use_by_others(p_mountain uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.user_mountains
    where mountain_id = p_mountain and user_id is distinct from auth.uid()
  ) or exists (
    select 1 from public.user_hikes
    where mountain_id = p_mountain and user_id is distinct from auth.uid()
  );
$$;

-- Set a mountain's cover photo. Allowed for the mountain's creator, or for
-- anyone when the mountain has no cover yet. The URL must point at the caller's
-- own folder in the public mountain-images bucket.
create or replace function public.set_mountain_image(p_mountain uuid, p_url text)
returns boolean
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := auth.uid();
begin
  if v_uid is null then
    return false;
  end if;
  if p_url !~ ('/storage/v1/object/public/mountain-images/' || v_uid::text || '/[A-Za-z0-9._-]+$') then
    return false;
  end if;
  update public.mountains
  set image_url = p_url
  where id = p_mountain
    and (created_by = v_uid or image_url is null or image_url = '');
  return found;
end;
$$;

-- ---------------------------------------------------------------------------
-- RPCs exposed to the app
-- ---------------------------------------------------------------------------

-- Is a username free? Used by the registration form (callable while signed out).
create or replace function public.username_available(p_username text)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select p_username ~ '^[a-z0-9_]{3,24}$'
     and not exists (select 1 from public.profiles where username = p_username);
$$;

-- Limited profile card. Works for private profiles too, but only exposes the
-- fields a private profile still shows (name, avatar, follow counts).
create or replace function public.get_profile_card(p_username text)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  is_public boolean,
  follower_count bigint,
  following_count bigint
)
language sql
stable
security definer
set search_path = ''
as $$
  select
    p.id,
    p.username,
    p.display_name,
    p.avatar_url,
    p.is_public,
    (select count(*) from public.follows f where f.following_id = p.id),
    (select count(*) from public.follows f where f.follower_id = p.id)
  from public.profiles p
  where p.username = lower(p_username);
$$;

-- Username / name search for signed-in users. Returns limited fields only.
create or replace function public.search_profiles(p_query text)
returns table (
  id uuid,
  username text,
  display_name text,
  avatar_url text,
  is_public boolean
)
language sql
stable
security definer
set search_path = ''
as $$
  select p.id, p.username, p.display_name, p.avatar_url, p.is_public
  from public.profiles p
  where auth.uid() is not null
    and char_length(trim(p_query)) >= 2
    and (
      p.username like lower(replace(replace(trim(p_query), '%', ''), '_', '\_')) || '%'
      or p.display_name ilike '%' || replace(replace(trim(p_query), '%', ''), '_', '\_') || '%'
    )
  order by p.username
  limit 20;
$$;

-- Internal functions must not be callable through the API.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.create_profile_for(uuid, text, jsonb) from public, anon, authenticated;
revoke execute on function public.seed_starter_list(uuid) from public, anon, authenticated;
revoke execute on function public.guard_mountain_columns() from public, anon, authenticated;
revoke execute on function public.handle_user_mountain_change() from public, anon, authenticated;
revoke execute on function public.set_mountain_image(uuid, text) from public, anon;
grant execute on function public.set_mountain_image(uuid, text) to authenticated;
grant execute on function public.mountain_in_use_by_others(uuid) to authenticated;
revoke execute on function public.mountain_in_use_by_others(uuid) from public, anon;
revoke execute on function public.ensure_profile() from public, anon;
grant execute on function public.ensure_profile() to authenticated;
revoke execute on function public.handle_user_hike_change() from public, anon, authenticated;
revoke execute on function public.sync_user_achievements(uuid) from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

grant execute on function public.can_view_user(uuid) to anon, authenticated;
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.get_profile_card(text) to anon, authenticated;
grant execute on function public.search_profiles(text) to authenticated;
revoke execute on function public.search_profiles(text) from public, anon;
