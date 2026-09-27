-- Father and mother names alongside profession.
-- Run in the Supabase SQL editor after 031.

begin;

alter table public.profiles add column if not exists father_name text;
alter table public.profiles add column if not exists mother_name text;

grant select, insert, update on public.profiles to authenticated;

commit;
