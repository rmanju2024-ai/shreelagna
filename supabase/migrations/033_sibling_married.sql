-- How many brothers and sisters are married.
-- Run in the Supabase SQL editor after 032.

begin;

alter table public.profiles add column if not exists brothers_married_count smallint;
alter table public.profiles add column if not exists sisters_married_count smallint;

alter table public.profiles drop constraint if exists profiles_brothers_married_count_ok;
alter table public.profiles add constraint profiles_brothers_married_count_ok
  check (brothers_married_count is null or brothers_married_count between 0 and 15);

alter table public.profiles drop constraint if exists profiles_sisters_married_count_ok;
alter table public.profiles add constraint profiles_sisters_married_count_ok
  check (sisters_married_count is null or sisters_married_count between 0 and 15);

alter table public.profiles drop constraint if exists profiles_brothers_married_lte_total;
alter table public.profiles add constraint profiles_brothers_married_lte_total
  check (
    brothers_married_count is null
    or brothers_count is null
    or brothers_married_count <= brothers_count
  );

alter table public.profiles drop constraint if exists profiles_sisters_married_lte_total;
alter table public.profiles add constraint profiles_sisters_married_lte_total
  check (
    sisters_married_count is null
    or sisters_count is null
    or sisters_married_count <= sisters_count
  );

grant select, insert, update on public.profiles to authenticated;

commit;
