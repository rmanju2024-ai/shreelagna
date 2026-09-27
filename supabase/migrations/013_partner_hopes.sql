-- Partner expectations: height, diet, income, workplace, who posts, gothra.
-- No time of birth. Run after 001–012.

begin;

alter table public.profiles add column if not exists pref_height_min smallint;
alter table public.profiles add column if not exists pref_height_max smallint;
alter table public.profiles add column if not exists pref_diets text[];
alter table public.profiles add column if not exists pref_incomes text[];
alter table public.profiles add column if not exists pref_employed text[];
alter table public.profiles add column if not exists pref_managed text[];
alter table public.profiles add column if not exists pref_gothra text;

grant select, insert, update on public.profiles to authenticated;

commit;
