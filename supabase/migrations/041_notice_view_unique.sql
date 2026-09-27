-- One "viewed your profile" alert per viewer. Keep the latest row.

delete from public.notices a
using public.notices b
where a.kind = 'profile_view'
  and b.kind = 'profile_view'
  and a.user_id = b.user_id
  and a.match_profile_id is not null
  and a.match_profile_id = b.match_profile_id
  and a.created_at < b.created_at;

delete from public.notices a
using public.notices b
where a.kind = 'profile_view'
  and b.kind = 'profile_view'
  and a.user_id = b.user_id
  and a.match_profile_id is not null
  and a.match_profile_id = b.match_profile_id
  and a.id < b.id
  and a.created_at = b.created_at;

create unique index if not exists notices_profile_view_uidx
  on public.notices (user_id, match_profile_id)
  where kind = 'profile_view' and match_profile_id is not null;
