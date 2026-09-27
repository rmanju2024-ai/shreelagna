-- Last time the member was on the site, shown on portraits.

alter table public.app_users
  add column if not exists last_seen_at timestamptz;

alter table public.profiles
  add column if not exists last_seen_at timestamptz;

update public.app_users
set last_seen_at = coalesce(last_login_at, created_at)
where last_seen_at is null;

update public.profiles p
set last_seen_at = u.last_seen_at
from public.app_users u
where p.created_by = u.id
  and p.last_seen_at is null;
