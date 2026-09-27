-- Drop the fake "Other" state (it listed countries as cities).
-- Run after 001–017.

begin;

delete from public.lookup_cities
where state_id in (select id from public.lookup_states where name = 'Other');

delete from public.lookup_states where name = 'Other';

commit;
