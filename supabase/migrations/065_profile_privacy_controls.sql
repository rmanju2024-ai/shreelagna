alter table public.profiles
  add column if not exists hide_details_until_accept boolean not null default false,
  add column if not exists contact_release_mode text not null default 'accepted_interest';

alter table public.profiles drop constraint if exists profiles_contact_release_mode_check;
alter table public.profiles
  add constraint profiles_contact_release_mode_check
  check (contact_release_mode in ('accepted_interest', 'never'));
