-- Settle abroad and a one-line future ambition.
-- Run in the Supabase SQL editor after 033.

begin;

alter table public.profiles add column if not exists settle_abroad text;
alter table public.profiles add column if not exists future_ambition text;

grant select, insert, update on public.profiles to authenticated;

commit;
