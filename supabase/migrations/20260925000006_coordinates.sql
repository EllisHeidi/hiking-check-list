-- Checked coordinates for the seeded mountains, with an accuracy flag so the UI
-- never presents an approximate location as an exact summit, plus a note for
-- records that need manual verification (e.g. conflicting names).

alter table public.mountains
  add column if not exists coordinate_accuracy text
    check (coordinate_accuracy in ('verified', 'approximate')),
  add column if not exists verification_note text
    check (char_length(verification_note) <= 500);

-- Wrapped in a function so the seed can run it too on fresh installs (where
-- this migration runs before the mountains exist). Idempotent.
create or replace function public.apply_mountain_coordinates()
returns void
language plpgsql
security definer
set search_path = ''
as $fn$
begin
update public.mountains m
set latitude = v.lat,
    longitude = v.lng,
    coordinate_accuracy = v.accuracy,
    -- Keep the stored link in sync; the app also builds it from lat/lng.
    google_maps_url = 'https://www.google.com/maps/search/?api=1&query=' || v.lat::text || ',' || v.lng::text
from (values
  ('leeukop',             -33.935040, 18.389140, 'verified'),
  ('paarlberg',           -33.762130, 18.935680, 'verified'),
  ('table-mountain',      -33.962000, 18.410000, 'verified'),
  ('banghoek-peak',       -33.985500, 19.003500, 'verified'),
  ('sneeukop',            -32.354460, 19.160730, 'verified'),
  ('sneeuberg',           -32.507510, 19.153210, 'verified'),
  ('matroosberg',         -33.381850, 19.668680, 'verified'),
  ('towerkop',            -33.421311, 21.206530, 'verified'),
  ('seweweekspoort-peak', -33.398230, 21.367730, 'verified'),
  ('kilimanjaro',          -3.076410, 37.354000, 'verified'),
  ('spitskop',            -33.950460, 18.990140, 'approximate'),
  ('haelkop',             -34.027000, 18.988000, 'approximate'),
  ('virgin-peak',         -33.990000, 19.000000, 'approximate'),
  ('the-twins',           -33.986670, 19.000830, 'approximate'),
  ('first-ridge-peak',    -34.000000, 19.010000, 'approximate'),
  ('saaltjie',            -33.990000, 18.960000, 'approximate'),
  ('groot-winterhoek',    -33.070000, 19.140000, 'approximate'),
  ('dwarsberg',           -34.019500, 19.023300, 'approximate'),
  ('guardian-peak',       -34.017800, 18.995600, 'approximate'),
  ('sterrekykerskop',     -34.012100, 18.996100, 'approximate')
) as v(slug, lat, lng, accuracy)
where m.slug = v.slug and m.created_by is null;

-- Guardian Peak vs Sterrekykerskop: sources disagree on whether these are the
-- same summit. Keep both, editable, and flag them so nobody logs one summit twice.
update public.mountains
set verification_note = 'Needs checking: some maps treat Guardian Peak and Sterrekykerskop as the same summit, while the CapeNature map labels them separately. Confirm before logging both.'
where slug in ('guardian-peak', 'sterrekykerskop') and created_by is null;

-- Elevations from the official Jonkershoek map, only where ours were blank.
update public.mountains set elevation = 1517 where slug = 'first-ridge-peak' and created_by is null and elevation is null;
update public.mountains set elevation = 1516 where slug = 'banghoek-peak' and created_by is null and elevation is null;
end;
$fn$;

revoke execute on function public.apply_mountain_coordinates() from public, anon, authenticated;

select public.apply_mountain_coordinates();
