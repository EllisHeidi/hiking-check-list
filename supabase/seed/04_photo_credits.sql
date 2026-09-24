-- Photo credits for the seeded mountain photos (licence attribution).
update public.mountains m
set image_credit = v.credit, image_credit_url = v.page
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
where m.slug = v.slug and m.image_url = v.url;
