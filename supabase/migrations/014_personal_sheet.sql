-- Own profile: blood group, grew up in, pin, country, hobbies list.
-- Gothra and citizenship already exist. No time of birth.
-- Run after 001–013.

begin;

alter table public.profiles add column if not exists blood_group text;
alter table public.profiles add column if not exists grew_up_in text;
alter table public.profiles add column if not exists pin_code text;
alter table public.profiles add column if not exists current_country text;
alter table public.profiles add column if not exists hobby_list text[];

grant select, insert, update on public.profiles to authenticated;

commit;
