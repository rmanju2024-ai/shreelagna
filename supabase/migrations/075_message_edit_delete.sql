alter table public.messages add column if not exists edited_at timestamptz;
alter table public.messages add column if not exists deleted_at timestamptz;

drop policy if exists messages_update_own on public.messages;
create policy messages_update_own on public.messages
  for update using (public.owns_profile(sender_profile_id))
  with check (public.owns_profile(sender_profile_id));

drop policy if exists messages_delete_own on public.messages;
create policy messages_delete_own on public.messages
  for delete using (public.owns_profile(sender_profile_id));
