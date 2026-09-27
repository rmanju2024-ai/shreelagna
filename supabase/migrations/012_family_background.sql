-- Family, health, birth city, college, hobbies. No time of birth.
-- Run in the Supabase SQL editor after 001–011.

begin;

alter table public.profiles add column if not exists birth_city text;
alter table public.profiles add column if not exists college_name text;
alter table public.profiles add column if not exists hobbies text;
alter table public.profiles add column if not exists brothers_count smallint;
alter table public.profiles add column if not exists sisters_count smallint;
alter table public.profiles add column if not exists father_occupation text;
alter table public.profiles add column if not exists mother_occupation text;
alter table public.profiles add column if not exists siblings_note text;
alter table public.profiles add column if not exists family_status text;
alter table public.profiles add column if not exists family_location text;
alter table public.profiles add column if not exists health_notes text;
alter table public.profiles add column if not exists sub_community text;

alter table public.profiles drop constraint if exists profiles_brothers_count_ok;
alter table public.profiles add constraint profiles_brothers_count_ok
  check (brothers_count is null or brothers_count between 0 and 15);
alter table public.profiles drop constraint if exists profiles_sisters_count_ok;
alter table public.profiles add constraint profiles_sisters_count_ok
  check (sisters_count is null or sisters_count between 0 and 15);

grant select, insert, update on public.profiles to authenticated;

commit;
