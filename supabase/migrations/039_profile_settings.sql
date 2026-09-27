-- Premium profile settings: incognito, alert prefs, pause stays on profiles.status.

alter table public.profiles
  add column if not exists incognito_browse boolean not null default false;

alter table public.profiles
  add column if not exists notify_profile_views boolean not null default true;

alter table public.profiles
  add column if not exists notify_interest boolean not null default true;

alter table public.app_users
  add column if not exists notify_match_email boolean not null default true;
