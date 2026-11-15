-- Alerts, chats, and interests belong to one bride or groom on a multi-profile login.

begin;

alter table public.notices
  add column if not exists for_profile_id uuid references public.profiles (id) on delete cascade;

create index if not exists notices_for_profile_idx
  on public.notices (user_id, for_profile_id, created_at desc);

drop index if exists public.notices_profile_view_uidx;
create unique index if not exists notices_profile_view_uidx
  on public.notices (user_id, for_profile_id, match_profile_id)
  where kind = 'profile_view' and match_profile_id is not null and for_profile_id is not null;

drop index if exists public.notices_shortlist_uidx;
create unique index if not exists notices_shortlist_uidx
  on public.notices (user_id, for_profile_id, match_profile_id)
  where kind = 'shortlist' and match_profile_id is not null and for_profile_id is not null;

drop index if exists public.notices_match_uidx;
create unique index if not exists notices_match_uidx
  on public.notices (user_id, for_profile_id, match_profile_id)
  where kind = 'match' and match_profile_id is not null and for_profile_id is not null;

commit;
