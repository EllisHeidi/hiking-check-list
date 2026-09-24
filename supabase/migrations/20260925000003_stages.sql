-- Stages: group each hiker's kill list into Start → Build → Advanced →
-- High Mountain → Extreme. The stage lives on the list entry (personal);
-- mountains.starter_stage is the default used for the starter list.

alter table public.user_mountains
  add column if not exists stage text
  check (stage in ('start', 'build', 'advanced', 'high', 'extreme'));

alter table public.mountains
  add column if not exists starter_stage text
  check (starter_stage in ('start', 'build', 'advanced', 'high', 'extreme'));

-- API users can't change starter-list columns (now including starter_stage).
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
    new.starter_stage := null;
  else
    new.created_by := old.created_by;
    new.is_starter := old.is_starter;
    new.is_final_goal := old.is_final_goal;
    new.sort_order := old.sort_order;
    new.starter_stage := old.starter_stage;
    new.slug := old.slug;
  end if;
  return new;
end;
$$;

-- New accounts get the starter list with its stages.
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
  insert into public.user_mountains (user_id, mountain_id, sort_order, is_final_goal, stage)
  select p_user, m.id, m.sort_order, m.is_final_goal, m.starter_stage
  from public.mountains m
  where m.is_starter
  on conflict (user_id, mountain_id) do nothing;
end;
$$;

revoke execute on function public.seed_starter_list(uuid) from public, anon, authenticated;
revoke execute on function public.guard_mountain_columns() from public, anon, authenticated;

-- ---------------------------------------------------------------------------
-- The suggested progression: order, stage and objective-card descriptions for
-- the seeded catalogue rows, then stages for existing lists. Wrapped in a
-- function so the seed can run it too on fresh installs (where this migration
-- runs before the mountains exist). Idempotent.
-- ---------------------------------------------------------------------------
create or replace function public.apply_starter_progression()
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
begin
update public.mountains m
set sort_order = v.sort_order,
    starter_stage = v.stage,
    description = v.description
from (values
  ('leeukop', 1, 'start',
   'Lion''s Head — a shorter Cape Town summit with a proper mountain feel. A good early objective for building confidence before bigger peaks, with rocky terrain, chains near the top and 360° views across the Atlantic Seaboard and the city.'),
  ('paarlberg', 2, 'start',
   'A great introduction to mountain hiking in the Paarl area. Granite formations, fynbos and views across Paarl and the surrounding Winelands make this a relatively accessible objective that still feels like a proper mountain day.'),
  ('table-mountain', 3, 'start',
   'The iconic Cape Town mountain. Multiple routes lead to the summit, from the steep Platteklip Gorge to longer routes through the mountain''s valleys and ravines. Expect dramatic cliffs, sweeping city views and a serious sense of achievement at the top.'),
  ('saaltjie', 4, 'build',
   'A beautiful Jonkershoek objective combining fynbos, mountain slopes and expansive Stellenbosch views. The elevation makes it a meaningful step up from shorter city hikes without reaching the difficulty of the bigger Jonkershoek peaks.'),
  ('sterrekykerskop', 5, 'build',
   'A high, rugged Western Cape objective that moves beyond the easier Cape Town peaks. Expect a more remote mountain environment, sustained climbing and exposed terrain — one for hikers ready to step up their experience.'),
  ('guardian-peak', 6, 'build',
   'A prominent peak overlooking the Stellenbosch and Jonkershoek landscape. The summit gives enormous views across the Cape Peninsula, False Bay and the surrounding ranges. CapeNature''s Panorama Circuit includes a detour to the 1,227 m summit.'),
  ('spitskop', 7, 'build',
   'A rugged mountain objective where the elevation starts becoming serious. Expect steeper terrain, exposed mountain slopes and a more demanding day than the introductory peaks.'),
  ('haelkop', 8, 'build',
   'A high Hottentots Holland objective surrounded by rugged mountain terrain. Haelkop is a step into proper wilderness-style hiking, with significant elevation and a more demanding ascent.'),
  ('virgin-peak', 9, 'advanced',
   'A substantial Jonkershoek summit surrounded by some of the Western Cape''s most dramatic mountain scenery. The combination of elevation, steep terrain and remote surroundings makes Virgin Peak a serious step up from Saaltjie.'),
  ('the-twins', 10, 'advanced',
   'Two prominent peaks rising above the Jonkershoek landscape. This is where the list moves firmly into strenuous mountain objectives, requiring stronger fitness, preparation and mountain experience.'),
  ('first-ridge-peak', 11, 'advanced',
   'A rugged Jonkershoek ridge objective following the high mountain terrain above the reserve. Expect steep climbing, exposed sections and big views across the surrounding valleys.'),
  ('banghoek-peak', 12, 'advanced',
   'A dramatic peak in the Banghoek mountain landscape. The route takes you deeper into the high Jonkershoek mountains, with steep terrain and a more remote wilderness feeling.'),
  ('dwarsberg', 13, 'advanced',
   'A serious Jonkershoek objective that pushes beyond the 1,500 m mark. Expect long climbs, rugged fynbos-covered slopes and spectacular views across the surrounding Cape Fold mountains.'),
  ('sneeukop', 14, 'high',
   'A high Cederberg summit approaching the 2,000 m mark. The landscape changes dramatically here, with rugged sandstone formations, open mountain terrain and a much more remote wilderness experience. CapeNature lists Sneeukop at about 1,931 m.'),
  ('sneeuberg', 15, 'high',
   'Your first 2,000 m+ objective on the list. Sneeuberg takes you into high Cederberg terrain where long climbs, exposed slopes and unpredictable mountain weather become much more important. CapeNature lists the summit at 2,027 m.'),
  ('groot-winterhoek', 16, 'high',
   'A remote high-mountain objective in the Groot Winterhoek wilderness. Expect rugged terrain, sandstone formations, deep valleys and a proper wilderness experience far removed from the easier Cape Town peaks.'),
  ('matroosberg', 17, 'high',
   'One of the highest mountains in the Western Cape and the highest point in the Hex River Mountains. The summit hike starts around 1,250 m and climbs to 2,249 m in a long, sustained ascent — the reserve estimates 8–10 hours.'),
  ('towerkop', 18, 'extreme',
   'One of the Western Cape''s legendary mountain objectives. Towerkop is an imposing rock formation in the Klein Swartberg, requiring serious mountain experience and, depending on the route, technical climbing skills. The MCSA describes the area as hard off-trail hiking, high traversing and rock climbing.'),
  ('seweweekspoort-peak', 19, 'extreme',
   'The highest peak in the Western Cape. A major mountain objective rather than a casual day hike, with long approaches, steep terrain and serious weather exposure. The northern approach can take roughly 6–10 hours depending on conditions and group fitness.'),
  ('kilimanjaro', 20, 'extreme',
   'The ultimate objective. Africa''s highest mountain and a completely different level of adventure, requiring a multi-day expedition, altitude preparation and careful acclimatisation. This isn''t simply a bigger hike — it''s a high-altitude mountain expedition.')
) as v(slug, sort_order, stage, description)
where m.slug = v.slug and m.created_by is null;

-- Corrected facts from the suggested list.
update public.mountains set elevation = 1468 where slug = 'virgin-peak' and created_by is null;
update public.mountains set difficulty = 'Hard' where slug = 'matroosberg' and created_by is null;

-- ---------------------------------------------------------------------------
-- Apply stages + suggested order to existing lists.
-- Starter mountains take the suggested order and stage; any mountains a hiker
-- added themselves keep their relative order, placed after the starter ones,
-- with a stage guessed from elevation.
-- ---------------------------------------------------------------------------
update public.user_mountains um
set stage = m.starter_stage,
    sort_order = m.sort_order
from public.mountains m
where m.id = um.mountain_id
  and m.is_starter
  and um.stage is null;

update public.user_mountains um
set stage = case
      when m.elevation is null or m.elevation < 1000 then 'start'
      when m.elevation < 1300 then 'build'
      when m.elevation < 1600 then 'advanced'
      when m.elevation < 2150 then 'high'
      else 'extreme'
    end,
    sort_order = 100 + um.sort_order
from public.mountains m
where m.id = um.mountain_id
  and um.stage is null;
end;
$fn$;

revoke execute on function public.apply_starter_progression() from public, anon, authenticated;

select public.apply_starter_progression();
