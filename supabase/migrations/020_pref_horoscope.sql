-- Whether a horoscopic / kundali match is preferred.
-- Run after 001–019.

begin;

alter table public.profiles add column if not exists pref_horoscope text;

grant select, insert, update on public.profiles to authenticated;

commit;
