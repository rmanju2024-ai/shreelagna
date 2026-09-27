-- Optional living arrangement on the personal sheet.
-- Run after 054.

begin;

alter table public.profiles add column if not exists living_arrangement text;

grant select, insert, update on public.profiles to authenticated;

commit;
