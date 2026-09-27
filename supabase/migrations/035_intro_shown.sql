-- Last introduction shown on the portrait (words, video, or voice).
-- Run in the Supabase SQL editor after 034.

begin;

alter table public.profiles add column if not exists intro_shown text;

alter table public.profiles drop constraint if exists profiles_intro_shown_check;
alter table public.profiles
  add constraint profiles_intro_shown_check
  check (intro_shown is null or intro_shown in ('about', 'video', 'audio'));

grant select, insert, update on public.profiles to authenticated;

commit;
