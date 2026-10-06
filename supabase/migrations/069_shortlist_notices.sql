-- One "shortlisted your profile" alert per viewer.
delete from public.notices a
using public.notices b
where a.kind = 'shortlist'
  and b.kind = 'shortlist'
  and a.user_id = b.user_id
  and a.match_profile_id is not null
  and a.match_profile_id = b.match_profile_id
  and a.created_at < b.created_at;

delete from public.notices a
using public.notices b
where a.kind = 'shortlist'
  and b.kind = 'shortlist'
  and a.user_id = b.user_id
  and a.match_profile_id is not null
  and a.match_profile_id = b.match_profile_id
  and a.id < b.id
  and a.created_at = b.created_at;

create unique index if not exists notices_shortlist_uidx
  on public.notices (user_id, match_profile_id)
  where kind = 'shortlist' and match_profile_id is not null;
