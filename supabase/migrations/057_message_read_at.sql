alter table public.messages add column if not exists read_at timestamptz;

create index if not exists messages_unread_idx
  on public.messages (thread_id, sender_profile_id)
  where read_at is null;
