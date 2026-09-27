-- Allow a signed-in member to save their own portrait.
-- Run in the Supabase SQL editor after 001.

begin;

grant usage on schema public to anon, authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select on public.profiles to anon;

grant select, insert, update on public.app_users to authenticated;
grant select on public.religions, public.communities, public.sub_castes to anon, authenticated;
grant select, insert, update, delete on public.media to authenticated;
grant select, insert on public.interests to authenticated;
grant usage, select on all sequences in schema public to authenticated;

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert
  with check (created_by = auth.uid());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update
  using (created_by = auth.uid() or public.is_staff())
  with check (created_by = auth.uid() or public.is_staff());

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
  for select
  using (created_by = auth.uid());

commit;
