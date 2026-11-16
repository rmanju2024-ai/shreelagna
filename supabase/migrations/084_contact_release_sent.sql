-- Three contact-release choices: after send, after accept, or never.
alter table public.profiles drop constraint if exists profiles_contact_release_mode_check;

alter table public.profiles
  alter column contact_release_mode set default 'sent_interest';

update public.profiles
set contact_release_mode = 'sent_interest'
where contact_release_mode is null or contact_release_mode = 'accepted_interest';

alter table public.profiles
  add constraint profiles_contact_release_mode_check
  check (contact_release_mode in ('sent_interest', 'accepted_interest', 'never'));
