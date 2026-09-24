-- Real Western Cape photos (fynbos, sandstone, no snow) from Wikimedia Commons,
-- served from /public/mountains, plus photo credits as the licences require.
-- Only replaces the original seeded placeholder photos — never a cover a hiker added.

alter table public.mountains
  add column if not exists image_credit text,
  add column if not exists image_credit_url text;

update public.mountains m
set image_url = v.url, image_credit = v.credit, image_credit_url = v.page
from (values
  ('leeukop', '/mountains/leeukop.jpg', 'Dietmar Rabich · CC BY-SA 4.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Cape_Town_(ZA),_Table_Mountain,_Blick_auf_Lion%27s_Head_--_2024_--_2761.jpg'),
  ('sterrekykerskop', '/mountains/sterrekykerskop.jpg', 'Orrling · CC BY-SA 3.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Jonkershoek.jpg'),
  ('saaltjie', '/mountains/saaltjie.jpg', 'Glany Saldanha · CC BY 3.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Jonkershoek_Mountains_-_panoramio.jpg'),
  ('paarlberg', '/mountains/paarlberg.jpg', 'A3alb · CC BY-SA 3.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:The_mountain_commanage,_Paarlberg,_Paarl,_Western_Cape._Granite_Bosses._02.jpg'),
  ('guardian-peak', '/mountains/guardian-peak.jpg', 'JonRichfield · CC BY-SA 3.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Helderberg_mountain_seen_from_the_North-West_9669.jpg'),
  ('spitskop', '/mountains/spitskop.jpg', 'Abu Shawka · CC0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Hottentots_Holland_mountains_summit_-_SA_2.JPG'),
  ('haelkop', '/mountains/haelkop.jpg', 'Abu Shawka · CC0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Boegoekloof_-_Hottentots_Holland_Nature_Reserve_-_SA.JPG'),
  ('virgin-peak', '/mountains/virgin-peak.jpg', 'Glany Saldanha · CC BY 3.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Jonkershoek_Mountains_-_panoramio_(1).jpg'),
  ('the-twins', '/mountains/the-twins.jpg', 'KodachromeFan · CC BY-SA 3.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Jonkershoek_Valley_Twin_Peaks.jpg'),
  ('first-ridge-peak', '/mountains/first-ridge-peak.jpg', 'Julie Anne Workman · CC BY-SA 3.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Jonkershoek_landscape_2,_August_2011.jpg'),
  ('banghoek-peak', '/mountains/banghoek-peak.jpg', 'KodachromeFan · CC BY-SA 3.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Marais_Reserve,_Stellenbosch,_South_Africa.jpg'),
  ('dwarsberg', '/mountains/dwarsberg.jpg', 'BruceHarryAnderson · CC0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Jonkershoek_Mountain_Image_2026-08-20_at_13.13.39.jpg'),
  ('sneeukop', '/mountains/sneeukop.jpg', 'Meganbeckett27 · CC BY-SA 3.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Tafelberg_mountain,_Cederberg.JPG'),
  ('sneeuberg', '/mountains/sneeuberg.jpg', 'Zaian · Public domain · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:SneeubergAndMalteseCross.jpg'),
  ('towerkop', '/mountains/towerkop.jpg', 'LouisOelofse · CC BY 4.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Swartberg_pass.jpg'),
  ('matroosberg', '/mountains/matroosberg.jpg', 'Hmvh · CC BY-SA 4.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Hex1973.jpg'),
  ('seweweekspoort-peak', '/mountains/seweweekspoort-peak.jpg', 'Ulysse2031 · CC BY-SA 4.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:North_entrance_of_the_Seweweekspoort.jpg'),
  ('groot-winterhoek', '/mountains/groot-winterhoek.jpg', 'Servien · CC BY-SA 4.0 · Wikimedia Commons', 'https://commons.wikimedia.org/wiki/File:Sandrivier,_Groot_Winterhoek.jpg')
) as v(slug, url, credit, page)
where m.slug = v.slug
  and m.created_by is null
  and (m.image_url is null or m.image_url like 'https://images.unsplash.com/%');

-- Saaltjie (the Saddle) is in Jonkershoek: ~920 m high point, ~715 m gain on the full loop.
update public.mountains
set elevation = coalesce(elevation, 920),
    region = case when region is null or region = 'Western Cape' then 'Jonkershoek' else region end,
    elevation_gain_m = coalesce(elevation_gain_m, 715),
    route_name = coalesce(route_name, 'Saaltjie (Saddle) loop'),
    description = case
      when description like 'Starter peak on the road to Kilimanjaro%' or description is null
      then 'A classic Jonkershoek loop up to the saddle, with big views down the valley towards Stellenbosch and across to the Twins.'
      else description end,
    google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Saaltjie+Jonkershoek'
where slug = 'saaltjie' and created_by is null;

-- A new cover (uploaded or AI) replaces the old photo's credit.
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
  set image_url = p_url, image_credit = null, image_credit_url = null
  where id = p_mountain
    and (created_by = v_uid or image_url is null or image_url = '');
  return found;
end;
$$;

revoke execute on function public.set_mountain_image(uuid, text) from public, anon;
grant execute on function public.set_mountain_image(uuid, text) to authenticated;

-- Leeukop is Lion's Head, Cape Town: 669 m summit, ~350 m gain, ~5 km return.
update public.mountains
set elevation = 669,
    region = 'Cape Town',
    difficulty = 'Moderate',
    description = 'Lion''s Head — the sharp peak between Table Mountain and Signal Hill. A spiral path around the mountain with 360° views over the Atlantic Seaboard, and chains and ladders on the steep final section.',
    route_name = 'Lion''s Head summit path',
    route_description = 'From the Signal Hill Road parking, the path spirals clockwise around the peak. The last stretch is steeper, with chains and ladders (or the longer detour around them). About 2–3 hours return.',
    distance_km = 5,
    elevation_gain_m = 350,
    latitude = -33.935700,
    longitude = 18.389000,
    google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Lion%27s+Head+Cape+Town'
where slug = 'leeukop' and created_by is null;
