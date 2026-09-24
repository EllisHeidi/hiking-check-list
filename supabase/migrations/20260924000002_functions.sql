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
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text;
  candidate text;
  n integer := 0;
begin
  base := lower(coalesce(
    nullif(new.raw_user_meta_data ->> 'username', ''),
    split_part(new.email, '@', 1),
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
    new.id,
    candidate,
    left(nullif(trim(new.raw_user_meta_data ->> 'display_name'), ''), 60)
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

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
    coalesce(bool_or(h.completed and m.is_final_goal), false)
  into v_mountains, v_total_km, v_total_gain, v_longest, v_highest, v_final
  from public.user_hikes h
  join public.mountains m on m.id = h.mountain_id
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
revoke execute on function public.handle_user_hike_change() from public, anon, authenticated;
revoke execute on function public.sync_user_achievements(uuid) from public, anon, authenticated;
revoke execute on function public.set_updated_at() from public, anon, authenticated;

grant execute on function public.can_view_user(uuid) to anon, authenticated;
grant execute on function public.username_available(text) to anon, authenticated;
grant execute on function public.get_profile_card(text) to anon, authenticated;
grant execute on function public.search_profiles(text) to authenticated;
revoke execute on function public.search_profiles(text) from public, anon;
