-- A new profile is saved step by step. Date of birth is collected on Faith, not Basics.
alter table public.profiles alter column date_of_birth drop not null;

alter table public.profiles drop constraint if exists profiles_age_adult;
alter table public.profiles
  add constraint profiles_age_adult
  check (date_of_birth is null or date_of_birth <= (current_date - interval '21 years'));
