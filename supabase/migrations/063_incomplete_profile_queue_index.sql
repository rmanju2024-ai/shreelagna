-- Keeps the staff follow-up queue quick as draft profiles grow.
create index if not exists profiles_incomplete_draft_queue_idx
  on public.profiles (created_at desc)
  where status = 'draft' and is_complete = false;
