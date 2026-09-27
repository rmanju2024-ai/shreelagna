-- Fast desk review queue as the profile table grows.

create index if not exists profiles_review_queue_idx
  on public.profiles (created_at desc)
  where status = 'pending_review' or (status = 'draft' and is_complete);
