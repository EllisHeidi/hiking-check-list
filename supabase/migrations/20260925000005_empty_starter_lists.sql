-- New accounts start with an EMPTY kill list. Every catalogue mountain
-- (including the seeded progression) stays available to add from
-- Mountains → Add mountains. Existing lists are not touched.

create or replace function public.create_profile_for(p_id uuid, p_email text, p_meta jsonb)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  base text;
  candidate text;
  n integer := 0;
begin
  if exists (select 1 from public.profiles where id = p_id) then
    return;
  end if;

  base := lower(coalesce(
    nullif(p_meta ->> 'username', ''),
    split_part(p_email, '@', 1),
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
    p_id,
    candidate,
    left(nullif(trim(p_meta ->> 'display_name'), ''), 60)
  )
  on conflict (id) do nothing;
  -- No starter list: hikers build their own from the catalogue.
end;
$$;

revoke execute on function public.create_profile_for(uuid, text, jsonb) from public, anon, authenticated;
