-- Initial mountain progression.
-- NOTE: This is starter data, not an authoritative source. Elevations marked
-- NULL are unknown, and coordinates are approximate. Correct anything directly
-- in the mountains table (Supabase Table Editor) — the UI reads it all from here.
-- `on conflict do nothing` means re-running the seed never overwrites corrections.

insert into public.mountains
  (sort_order, slug, name, elevation, region, country, difficulty, description,
   route_name, route_description, distance_km, elevation_gain_m,
   latitude, longitude, google_maps_url, image_url, is_final_goal)
values
  (1, 'table-mountain', 'Table Mountain', 1085, 'Cape Town', 'South Africa', 'Moderate',
   'The flat-topped icon above Cape Town and the first line in the logbook. Maclear''s Beacon marks the true high point on the plateau.',
   'Skeleton Gorge', 'From Kirstenbosch up Skeleton Gorge (ladders and wet rock), across the plateau to Maclear''s Beacon, down via Nursery Ravine.',
   11.0, 800, -33.962800, 18.409800,
   'https://www.google.com/maps/search/?api=1&query=Maclear%27s+Beacon+Table+Mountain',
   'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1600&q=80', false),

  (2, 'leeukop', 'Leeukop', null, 'Western Cape', 'South Africa', 'Moderate',
   'Starter peak on the road to Kilimanjaro. Update this description with route details.',
   null, null, null, null, null, null,
   'https://www.google.com/maps/search/?api=1&query=Leeukop+Western+Cape',
   'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1600&q=80', false),

  (3, 'sterrekykerskop', 'Sterrekykerskop', 1200, 'Western Cape', 'South Africa', 'Hard',
   'A long day with big views. Elevation is approximate — verify and update.',
   null, null, 12.0, null, null, null,
   'https://www.google.com/maps/search/?api=1&query=Sterrekykerskop',
   'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?auto=format&fit=crop&w=1600&q=80', false),

  (4, 'saaltjie', 'Saaltjie', null, 'Western Cape', 'South Africa', 'Moderate',
   'Starter peak on the road to Kilimanjaro. Update this description with route details.',
   null, null, null, null, null, null,
   'https://www.google.com/maps/search/?api=1&query=Saaltjie+Western+Cape',
   'https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=1600&q=80', false),

  (5, 'paarlberg', 'Paarlberg', 729, 'Paarl', 'South Africa', 'Easy',
   'Granite domes above the Paarl winelands. Short, steep scrambles to the top of Paarl Rock.',
   'Paarl Rock', 'From the Paarl Mountain Nature Reserve parking, up the chain-assisted granite slab to the summit.',
   5.0, 250, -33.743000, 18.938000,
   'https://www.google.com/maps/search/?api=1&query=Paarl+Rock',
   'https://images.unsplash.com/photo-1501785888041-af3ef285b470?auto=format&fit=crop&w=1600&q=80', false),

  (6, 'guardian-peak', 'Guardian Peak', 1227, 'Helderberg / Jonkershoek', 'South Africa', 'Hard',
   'A steep climb with views across False Bay and the Stellenbosch valleys.',
   null, null, null, null, -34.020000, 18.950000,
   'https://www.google.com/maps/search/?api=1&query=Guardian+Peak+Stellenbosch',
   'https://images.unsplash.com/photo-1469474968028-56623f02e42e?auto=format&fit=crop&w=1600&q=80', false),

  (7, 'spitskop', 'Spitskop', 1287, 'Western Cape', 'South Africa', 'Hard',
   'A pointed summit on the progression. Elevation is approximate — verify and update.',
   null, null, null, null, null, null,
   'https://www.google.com/maps/search/?api=1&query=Spitskop+Western+Cape',
   'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?auto=format&fit=crop&w=1600&q=80', false),

  (8, 'haelkop', 'Haelkop', 1400, 'Hottentots Holland', 'South Africa', 'Hard',
   'Rugged Hottentots Holland terrain. Elevation is approximate — verify and update.',
   null, null, null, null, -34.080000, 18.980000,
   'https://www.google.com/maps/search/?api=1&query=Haelkop+Hottentots+Holland',
   'https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1600&q=80', false),

  (9, 'virgin-peak', 'Virgin Peak', 1460, 'Jonkershoek', 'South Africa', 'Hard',
   'One of the Jonkershoek skyline peaks above Stellenbosch.',
   null, null, null, null, -33.990000, 18.990000,
   'https://www.google.com/maps/search/?api=1&query=Virgin+Peak+Jonkershoek',
   'https://images.unsplash.com/photo-1483728642387-6c3bdd6c93e5?auto=format&fit=crop&w=1600&q=80', false),

  (10, 'the-twins', 'The Twins', 1500, 'Jonkershoek', 'South Africa', 'Strenuous',
   'The twin summits that define the Jonkershoek skyline. Elevation is approximate.',
   null, null, null, null, -33.985000, 19.010000,
   'https://www.google.com/maps/search/?api=1&query=The+Twins+Jonkershoek',
   'https://images.unsplash.com/photo-1458668383970-8ddd3927deed?auto=format&fit=crop&w=1600&q=80', false),

  (11, 'first-ridge-peak', 'First Ridge Peak', null, 'Jonkershoek', 'South Africa', 'Hard',
   'Jonkershoek ridge objective. Update elevation and route details.',
   null, null, null, null, null, null,
   'https://www.google.com/maps/search/?api=1&query=First+Ridge+Peak+Jonkershoek',
   'https://images.unsplash.com/photo-1434394354979-a235cd36269d?auto=format&fit=crop&w=1600&q=80', false),

  (12, 'banghoek-peak', 'Banghoek Peak', null, 'Jonkershoek', 'South Africa', 'Hard',
   'Above the Banhoek valley. Update elevation and route details.',
   null, null, null, null, null, null,
   'https://www.google.com/maps/search/?api=1&query=Banghoek+Peak',
   'https://images.unsplash.com/photo-1491555103944-7c647fd857e6?auto=format&fit=crop&w=1600&q=80', false),

  (13, 'dwarsberg', 'Dwarsberg', 1523, 'Jonkershoek', 'South Africa', 'Strenuous',
   'A high point at the head of the Jonkershoek valley.',
   null, null, null, null, -33.980000, 19.040000,
   'https://www.google.com/maps/search/?api=1&query=Dwarsberg+Jonkershoek',
   'https://images.unsplash.com/photo-1455156218388-5e61b526818b?auto=format&fit=crop&w=1600&q=80', false),

  (14, 'sneeukop', 'Sneeukop', 1930, 'Cederberg', 'South Africa', 'Strenuous',
   'Big Cederberg country — sandstone, rooibos and long approaches. Elevation is approximate.',
   null, null, null, null, -32.360000, 19.140000,
   'https://www.google.com/maps/search/?api=1&query=Sneeukop+Cederberg',
   'https://images.unsplash.com/photo-1439853949127-fa647821eba0?auto=format&fit=crop&w=1600&q=80', false),

  (15, 'sneeuberg', 'Sneeuberg', 2027, 'Cederberg', 'South Africa', 'Strenuous',
   'The highest peak in the Cederberg and the first 2,000 m summit on the list.',
   null, null, null, null, -32.500000, 19.160000,
   'https://www.google.com/maps/search/?api=1&query=Sneeuberg+Cederberg',
   'https://images.unsplash.com/photo-1519681393784-d120267933ba?auto=format&fit=crop&w=1600&q=80', false),

  (16, 'towerkop', 'Towerkop', 2189, 'Klein Swartberg', 'South Africa', 'Extreme',
   'The split summit above Ladismith. The final section is a technical rock climb — go with a rope and someone who knows it.',
   null, null, null, null, -33.440000, 21.200000,
   'https://www.google.com/maps/search/?api=1&query=Towerkop+Ladismith',
   'https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1600&q=80', false),

  (17, 'matroosberg', 'Matroosberg', 2249, 'Hex River Mountains', 'South Africa', 'Hard',
   'Winter snow and wide views over the Hex River Valley.',
   null, null, null, null, -33.380000, 19.660000,
   'https://www.google.com/maps/search/?api=1&query=Matroosberg',
   'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?auto=format&fit=crop&w=1600&q=80', false),

  (18, 'seweweekspoort-peak', 'Seweweekspoort Peak', 2325, 'Klein Swartberg', 'South Africa', 'Strenuous',
   'The highest summit in the Western Cape — the top of the local ladder.',
   null, null, null, null, -33.400000, 21.370000,
   'https://www.google.com/maps/search/?api=1&query=Seweweekspoort+Peak',
   'https://images.unsplash.com/photo-1519904981063-b0cf448d479e?auto=format&fit=crop&w=1600&q=80', false),

  (19, 'groot-winterhoek', 'Groot Winterhoek', 2078, 'Tulbagh / Porterville', 'South Africa', 'Strenuous',
   'Placeholder for the additional Western Cape objective — swap in the peak you choose.',
   null, null, null, null, -33.130000, 19.050000,
   'https://www.google.com/maps/search/?api=1&query=Groot+Winterhoek+Peak',
   'https://images.unsplash.com/photo-1465056836041-7f43ac27dcb5?auto=format&fit=crop&w=1600&q=80', false),

  (20, 'kilimanjaro', 'Mount Kilimanjaro', 5895, 'Kilimanjaro Region', 'Tanzania', 'Extreme',
   'Uhuru Peak on Kibo, the roof of Africa. The final objective: everything before it is training.',
   'Uhuru Peak', 'Multi-day ascent (commonly Machame or Lemosho) with acclimatisation days, a midnight summit push from high camp and sunrise on the crater rim.',
   null, null, -3.067400, 37.355600,
   'https://www.google.com/maps/search/?api=1&query=Uhuru+Peak+Kilimanjaro',
   'https://images.unsplash.com/photo-1609198092458-38a293c7ac4b?auto=format&fit=crop&w=1600&q=80', true)
on conflict (slug) do nothing;
