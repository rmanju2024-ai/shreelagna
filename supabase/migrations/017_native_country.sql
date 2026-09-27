-- Native country of the family. Indian state and city are used only when this is India.
-- Run after 001–016.

begin;

alter table public.profiles add column if not exists native_country text;

update public.profiles
set native_country = 'India'
where native_country is null;

grant select, insert, update on public.profiles to authenticated;

commit;
