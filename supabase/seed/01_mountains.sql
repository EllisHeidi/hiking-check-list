-- Initial mountain progression.
-- NOTE: This is starter data, not an authoritative source. Elevations marked
-- NULL are unknown, and coordinates are approximate. Correct anything directly
-- in the mountains table (Supabase Table Editor) — the UI reads it all from here.
-- `on conflict do nothing` means re-running the seed never overwrites corrections.

insert into public.mountains
  (sort_order, slug, name, elevation, region, country, difficulty, description,
   route_name, route_description, distance_km, elevation_gain_m,
   latitude, longitude, google_maps_url, image_url, is_final_goal, is_starter)
values
  (1, 'table-mountain', 'Table Mountain', 1085, 'Cape Town', 'South Africa', 'Moderate',
   'The flat-topped icon above Cape Town and the first line in the logbook. Maclear''s Beacon marks the true high point on the plateau.',
   'Skeleton Gorge', 'From Kirstenbosch up Skeleton Gorge (ladders and wet rock), across the plateau to Maclear''s Beacon, down via Nursery Ravine.',
   11.0, 800, -33.962800, 18.409800,
   'https://www.google.com/maps/search/?api=1&query=Maclear%27s+Beacon+Table+Mountain',
   'https://images.unsplash.com/photo-1580060839134-75a5edca2e99?auto=format&fit=crop&w=1600&q=80', false, true),

  (2, 'leeukop', 'Leeukop', 669, 'Cape Town', 'South Africa', 'Moderate',
   'Lion''s Head — the sharp peak between Table Mountain and Signal Hill. A spiral path around the mountain with 360° views over the Atlantic Seaboard, and chains and ladders on the steep final section.',
   'Lion''s Head summit path', 'From the Signal Hill Road parking, the path spirals clockwise around the peak. The last stretch is steeper, with chains and ladders (or the longer detour around them). About 2–3 hours return.',
   5.0, 350, -33.935700, 18.389000,
   'https://www.google.com/maps/search/?api=1&query=Lion%27s+Head+Cape+Town',
   '/mountains/leeukop.jpg', false, true),

  (3, 'sterrekykerskop', 'Sterrekykerskop', 1200, 'Western Cape', 'South Africa', 'Hard',
   'A long day with big views. Elevation is approximate — verify and update.',
   null, null, 12.0, null, null, null,
   'https://www.google.com/maps/search/?api=1&query=Sterrekykerskop',
   '/mountains/sterrekykerskop.jpg', false, true),

  (4, 'saaltjie', 'Saaltjie', 920, 'Jonkershoek', 'South Africa', 'Moderate',
   'A classic Jonkershoek loop up to the saddle, with big views down the valley towards Stellenbosch and across to the Twins.',
   'Saaltjie (Saddle) loop', null, null, 715, null, null,
   'https://www.google.com/maps/search/?api=1&query=Saaltjie+Jonkershoek',
   '/mountains/saaltjie.jpg', false, true),

  (5, 'paarlberg', 'Paarlberg', 650, 'Paarl Mountain Nature Reserve', 'South Africa', 'Moderate',
   'The granite domes above Paarl. Paarl Rock and Bretagneklip are huge rounded granite outcrops with wide views over Paarl and the Winelands — less technical than Lion''s Head, with no real scrambling.',
   'Paarl Rock – Bretagneklip', 'A loop through Paarl Mountain Nature Reserve taking in Paarl Rock and Bretagneklip, past granite formations with views over Paarl and the Winelands. About 2–3 hours. (The full Paarlberg route is longer, around 11–12 km.)',
   5.1, 266, -33.743000, 18.938000,
   'https://www.google.com/maps/search/?api=1&query=Paarl+Rock+Paarl+Mountain+Nature+Reserve',
   '/mountains/paarlberg.jpg', false, true),

  (6, 'guardian-peak', 'Guardian Peak', 1227, 'Helderberg / Jonkershoek', 'South Africa', 'Hard',
   'A steep climb with views across False Bay and the Stellenbosch valleys.',
   null, null, null, null, -34.020000, 18.950000,
   'https://www.google.com/maps/search/?api=1&query=Guardian+Peak+Stellenbosch',
   '/mountains/guardian-peak.jpg', false, true),

  (7, 'spitskop', 'Spitskop', 1287, 'Western Cape', 'South Africa', 'Hard',
   'A pointed summit on the progression. Elevation is approximate — verify and update.',
   null, null, null, null, null, null,
   'https://www.google.com/maps/search/?api=1&query=Spitskop+Western+Cape',
   '/mountains/spitskop.jpg', false, true),

  (8, 'haelkop', 'Haelkop', 1400, 'Hottentots Holland', 'South Africa', 'Hard',
   'Rugged Hottentots Holland terrain. Elevation is approximate — verify and update.',
   null, null, null, null, -34.080000, 18.980000,
   'https://www.google.com/maps/search/?api=1&query=Haelkop+Hottentots+Holland',
   '/mountains/haelkop.jpg', false, true),

  (9, 'virgin-peak', 'Virgin Peak', 1460, 'Jonkershoek', 'South Africa', 'Hard',
   'One of the Jonkershoek skyline peaks above Stellenbosch.',
   null, null, null, null, -33.990000, 18.990000,
   'https://www.google.com/maps/search/?api=1&query=Virgin+Peak+Jonkershoek',
   '/mountains/virgin-peak.jpg', false, true),

  (10, 'the-twins', 'The Twins', 1500, 'Jonkershoek', 'South Africa', 'Strenuous',
   'The twin summits that define the Jonkershoek skyline. Elevation is approximate.',
   null, null, null, null, -33.985000, 19.010000,
   'https://www.google.com/maps/search/?api=1&query=The+Twins+Jonkershoek',
   '/mountains/the-twins.jpg', false, true),

  (11, 'first-ridge-peak', 'First Ridge Peak', null, 'Jonkershoek', 'South Africa', 'Hard',
   'Jonkershoek ridge objective. Update elevation and route details.',
   null, null, null, null, null, null,
   'https://www.google.com/maps/search/?api=1&query=First+Ridge+Peak+Jonkershoek',
   '/mountains/first-ridge-peak.jpg', false, true),

  (12, 'banghoek-peak', 'Banghoek Peak', null, 'Jonkershoek', 'South Africa', 'Hard',
   'Above the Banhoek valley. Update elevation and route details.',
   null, null, null, null, null, null,
   'https://www.google.com/maps/search/?api=1&query=Banghoek+Peak',
   '/mountains/banghoek-peak.jpg', false, true),

  (13, 'dwarsberg', 'Dwarsberg', 1523, 'Jonkershoek', 'South Africa', 'Strenuous',
   'A high point at the head of the Jonkershoek valley.',
   null, null, null, null, -33.980000, 19.040000,
   'https://www.google.com/maps/search/?api=1&query=Dwarsberg+Jonkershoek',
   '/mountains/dwarsberg.jpg', false, true),

  (14, 'sneeukop', 'Sneeukop', 1930, 'Cederberg', 'South Africa', 'Strenuous',
   'Big Cederberg country — sandstone, rooibos and long approaches. Elevation is approximate.',
   null, null, null, null, -32.360000, 19.140000,
   'https://www.google.com/maps/search/?api=1&query=Sneeukop+Cederberg',
   '/mountains/sneeukop.jpg', false, true),

  (15, 'sneeuberg', 'Sneeuberg', 2027, 'Cederberg', 'South Africa', 'Strenuous',
   'The highest peak in the Cederberg and the first 2,000 m summit on the list.',
   null, null, null, null, -32.500000, 19.160000,
   'https://www.google.com/maps/search/?api=1&query=Sneeuberg+Cederberg',
   '/mountains/sneeuberg.jpg', false, true),

  (16, 'towerkop', 'Towerkop', 2189, 'Klein Swartberg', 'South Africa', 'Extreme',
   'The split summit above Ladismith. The final section is a technical rock climb — go with a rope and someone who knows it.',
   null, null, null, null, -33.440000, 21.200000,
   'https://www.google.com/maps/search/?api=1&query=Towerkop+Ladismith',
   '/mountains/towerkop.jpg', false, true),

  (17, 'matroosberg', 'Matroosberg', 2249, 'Hex River Mountains', 'South Africa', 'Hard',
   'Winter snow and wide views over the Hex River Valley.',
   null, null, null, null, -33.380000, 19.660000,
   'https://www.google.com/maps/search/?api=1&query=Matroosberg',
   '/mountains/matroosberg.jpg', false, true),

  (18, 'seweweekspoort-peak', 'Seweweekspoort Peak', 2325, 'Klein Swartberg', 'South Africa', 'Strenuous',
   'The highest summit in the Western Cape — the top of the local ladder.',
   null, null, null, null, -33.400000, 21.370000,
   'https://www.google.com/maps/search/?api=1&query=Seweweekspoort+Peak',
   '/mountains/seweweekspoort-peak.jpg', false, true),

  (19, 'groot-winterhoek', 'Groot Winterhoek', 2078, 'Tulbagh / Porterville', 'South Africa', 'Strenuous',
   'Placeholder for the additional Western Cape objective — swap in the peak you choose.',
   null, null, null, null, -33.130000, 19.050000,
   'https://www.google.com/maps/search/?api=1&query=Groot+Winterhoek+Peak',
   '/mountains/groot-winterhoek.jpg', false, true),

  (20, 'kilimanjaro', 'Mount Kilimanjaro', 5895, 'Kilimanjaro Region', 'Tanzania', 'Extreme',
   'Uhuru Peak on Kibo, the roof of Africa. The final objective: everything before it is training.',
   'Uhuru Peak', 'Multi-day ascent (commonly Machame or Lemosho) with acclimatisation days, a midnight summit push from high camp and sunrise on the crater rim.',
   null, null, -3.067400, 37.355600,
   'https://www.google.com/maps/search/?api=1&query=Uhuru+Peak+Kilimanjaro',
   'https://images.unsplash.com/photo-1609198092458-38a293c7ac4b?auto=format&fit=crop&w=1600&q=80', true, true)
on conflict (slug) do nothing;
