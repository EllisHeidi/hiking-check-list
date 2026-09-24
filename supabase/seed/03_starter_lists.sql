-- Apply the suggested order/stages/descriptions to the seeded mountains.
select public.apply_starter_progression();

-- Give every existing hiker the starter kill list if their list is empty
-- (covers accounts created before the mountains were seeded).
select public.seed_starter_list(p.id)
from public.profiles p
where not exists (select 1 from public.user_mountains um where um.user_id = p.id);
