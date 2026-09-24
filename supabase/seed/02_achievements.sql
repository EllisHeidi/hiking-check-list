-- Achievement definitions. Awarded automatically by public.sync_user_achievements()
-- after every hike insert/update/delete. `icon` is a Lucide icon name.

insert into public.achievements
  (sort_order, slug, name, description, icon, requirement_type, requirement_value)
values
  (1,  'first-summit',   'First Summit',    'Complete your first mountain.',              'mountain',      'mountains_completed', 1),
  (2,  '10-km',          '10 KM',           'Complete a 10 km hike.',                     'footprints',    'single_hike_km',      10),
  (3,  'long-day',       'Long Day',        'Complete a hike over 20 km.',                'sunrise',       'single_hike_km',      20),
  (4,  '50-km',          '50 KM',           'Reach 50 km total hiking distance.',         'route',         'total_distance_km',   50),
  (5,  '100-km',         '100 KM',          'Reach 100 km total hiking distance.',        'route',         'total_distance_km',   100),
  (6,  '500-km',         '500 KM',          'Reach 500 km total hiking distance.',        'route',         'total_distance_km',   500),
  (7,  '1000-km',        '1,000 KM',        'Reach 1,000 km total hiking distance.',      'route',         'total_distance_km',   1000),
  (8,  '1k-vertical',    '1K Vertical',     'Reach 1,000 m cumulative elevation.',        'trending-up',   'total_elevation_m',   1000),
  (9,  '5k-vertical',    '5K Vertical',     'Reach 5,000 m cumulative elevation.',        'trending-up',   'total_elevation_m',   5000),
  (10, '10k-vertical',   '10K Vertical',    'Reach 10,000 m cumulative elevation.',       'trending-up',   'total_elevation_m',   10000),
  (11, 'higher',         'Higher',          'Complete a mountain above 1,500 m.',         'arrow-up',      'summit_elevation_m',  1500),
  (12, '2k-club',        '2K Club',         'Complete a mountain above 2,000 m.',         'mountain-snow', 'summit_elevation_m',  2000),
  (13, 'western-cape',   'Western Cape',    'Complete 10 mountains.',                     'map',           'mountains_completed', 10),
  (14, 'final-objective','Final Objective', 'Complete Kilimanjaro.',                      'flag',          'final_goal',          1)
on conflict (slug) do nothing;
