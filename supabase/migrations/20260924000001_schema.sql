-- Mountain Kill List — core schema
-- Tables, constraints and indexes. RLS lives in ..._rls.sql, storage in ..._storage.sql.

-- ---------------------------------------------------------------------------
-- profiles: one row per auth user, created by trigger on signup
-- ---------------------------------------------------------------------------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text unique not null
    check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text check (char_length(display_name) <= 60),
  avatar_url text,
  bio text check (char_length(bio) <= 280),
  is_public boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- mountains: shared, editable mountain database (the UI never hardcodes this)
-- ---------------------------------------------------------------------------
create table public.mountains (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null check (slug ~ '^[a-z0-9-]+$'),
  elevation integer check (elevation > 0),
  region text,
  country text,
  difficulty text,
  description text,
  route_name text,
  route_description text,
  image_url text,
  latitude numeric(9, 6) check (latitude between -90 and 90),
  longitude numeric(9, 6) check (longitude between -180 and 180),
  google_maps_url text,
  distance_km numeric(6, 2) check (distance_km > 0),
  elevation_gain_m integer check (elevation_gain_m >= 0),
  sort_order integer not null default 0,
  is_final_goal boolean not null default false,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- user_hikes: one row per hike. Many hikes per mountain are allowed.
-- ---------------------------------------------------------------------------
create table public.user_hikes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  mountain_id uuid not null references public.mountains (id) on delete restrict,
  completed boolean not null default false,
  completion_date date check (completion_date >= date '1900-01-01'),
  distance_km numeric(6, 2) check (distance_km > 0 and distance_km < 1000),
  elevation_gain_m integer check (elevation_gain_m >= 0 and elevation_gain_m < 20000),
  moving_time_minutes integer check (moving_time_minutes > 0 and moving_time_minutes < 20160),
  notes text check (char_length(notes) <= 4000),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- hike_photos: metadata only — the image lives in Storage (bucket hike-photos)
-- storage_path format: {user_id}/{hike_id}/{file}
-- ---------------------------------------------------------------------------
create table public.hike_photos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  hike_id uuid not null references public.user_hikes (id) on delete cascade,
  storage_path text not null unique,
  caption text check (char_length(caption) <= 280),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- follows
-- ---------------------------------------------------------------------------
create table public.follows (
  id uuid primary key default gen_random_uuid(),
  follower_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  following_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (follower_id, following_id),
  check (follower_id <> following_id)
);

-- ---------------------------------------------------------------------------
-- achievements (global definitions) + user_achievements (earned)
-- requirement_type is one of:
--   mountains_completed | single_hike_km | total_distance_km |
--   total_elevation_m | summit_elevation_m | final_goal
-- ---------------------------------------------------------------------------
create table public.achievements (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text unique not null,
  description text,
  icon text,
  requirement_type text not null check (requirement_type in (
    'mountains_completed', 'single_hike_km', 'total_distance_km',
    'total_elevation_m', 'summit_elevation_m', 'final_goal'
  )),
  requirement_value integer not null default 0,
  sort_order integer not null default 0
);

create table public.user_achievements (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  achievement_id uuid not null references public.achievements (id) on delete cascade,
  earned_at timestamptz not null default now(),
  unique (user_id, achievement_id)
);

-- ---------------------------------------------------------------------------
-- activity: written only by database triggers, never by clients
-- ---------------------------------------------------------------------------
create table public.activity (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  hike_id uuid references public.user_hikes (id) on delete cascade,
  achievement_id uuid references public.achievements (id) on delete cascade,
  activity_type text not null check (activity_type in (
    'hike_completed', 'mountain_conquered', 'achievement_earned'
  )),
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
-- profiles.username already has a unique index; this one serves prefix search.
create index profiles_username_pattern_idx on public.profiles (username text_pattern_ops);
create index mountains_sort_order_idx on public.mountains (sort_order);
create index user_hikes_user_id_idx on public.user_hikes (user_id);
create index user_hikes_mountain_id_idx on public.user_hikes (mountain_id);
create index user_hikes_completion_date_idx on public.user_hikes (completion_date desc);
create index hike_photos_hike_id_idx on public.hike_photos (hike_id);
create index follows_follower_id_idx on public.follows (follower_id);
create index follows_following_id_idx on public.follows (following_id);
create index user_achievements_user_id_idx on public.user_achievements (user_id);
create index activity_user_id_idx on public.activity (user_id);
create index activity_created_at_idx on public.activity (created_at desc);
create index activity_hike_id_idx on public.activity (hike_id);
