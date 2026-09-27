-- Native city plus current state, so native place and residence can be stored separately.
-- Run after 001–018.

begin;

alter table public.profiles add column if not exists native_city text;
alter table public.profiles add column if not exists current_state text;

update public.profiles
set native_city = current_city
where native_city is null and current_city is not null;

update public.profiles
set current_state = native_state
where current_state is null
  and native_state is not null
  and (current_country is null or current_country = 'India');

grant select, insert, update on public.profiles to authenticated;

commit;
