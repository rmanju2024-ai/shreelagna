-- High-value indexes for the actual member, chat, alert and media queries.
-- Partial/composite indexes are intentionally used instead of indexing every column.

create index if not exists interests_to_status_time_idx
  on public.interests (to_profile_id, status, created_at desc);

create index if not exists interests_from_status_time_idx
  on public.interests (from_profile_id, status, created_at desc);

create index if not exists threads_profile_a_time_idx
  on public.threads (profile_a, created_at desc);

create index if not exists threads_profile_b_time_idx
  on public.threads (profile_b, created_at desc);

create index if not exists notices_unread_user_kind_time_idx
  on public.notices (user_id, kind, created_at desc)
  where read_at is null;

create index if not exists profile_views_viewer_time_idx
  on public.profile_views (viewer_profile_id, viewed_at desc);

create index if not exists contact_views_pair_time_idx
  on public.contact_views (viewer_profile_id, viewed_profile_id, created_at desc);

-- Contact details remain revealed after the first successful reveal. Keep one
-- row per pair so a double-click cannot consume quota twice.
delete from public.contact_views newer
using public.contact_views older
where newer.viewer_profile_id = older.viewer_profile_id
  and newer.viewed_profile_id = older.viewed_profile_id
  and (newer.created_at, newer.id) > (older.created_at, older.id);

create unique index if not exists contact_views_one_reveal_per_pair_uidx
  on public.contact_views (viewer_profile_id, viewed_profile_id);

create index if not exists media_approved_profile_kind_primary_idx
  on public.media (profile_id, kind, is_primary desc, created_at)
  where status = 'approved'::public.media_status;

-- Supports bounded newest-first chat reads while retaining the existing index.
create index if not exists messages_thread_time_desc_idx
  on public.messages (thread_id, created_at desc);

analyze public.interests;
analyze public.threads;
analyze public.notices;
analyze public.profile_views;
analyze public.contact_views;
analyze public.media;
analyze public.messages;
