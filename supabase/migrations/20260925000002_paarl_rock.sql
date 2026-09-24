-- Paarlberg: the Paarl Rock – Bretagneklip hike in Paarl Mountain Nature Reserve.
-- ~650 m high point, ~266 m gain, ~5.1 km, 2–3 hours, Moderate.
update public.mountains
set elevation = 650,
    region = 'Paarl Mountain Nature Reserve',
    difficulty = 'Moderate',
    description = 'The granite domes above Paarl. Paarl Rock and Bretagneklip are huge rounded granite outcrops with wide views over Paarl and the Winelands — less technical than Lion''s Head, with no real scrambling.',
    route_name = 'Paarl Rock – Bretagneklip',
    route_description = 'A loop through Paarl Mountain Nature Reserve taking in Paarl Rock and Bretagneklip, past granite formations with views over Paarl and the Winelands. About 2–3 hours. (The full Paarlberg route is longer, around 11–12 km.)',
    distance_km = 5.1,
    elevation_gain_m = 266,
    google_maps_url = 'https://www.google.com/maps/search/?api=1&query=Paarl+Rock+Paarl+Mountain+Nature+Reserve'
where slug = 'paarlberg' and created_by is null;
