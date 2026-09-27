-- Gharane / surname on the personal sheet.
-- Run after 053.

begin;

alter table public.profiles add column if not exists surname text;

grant select, insert, update on public.profiles to authenticated;

commit;
