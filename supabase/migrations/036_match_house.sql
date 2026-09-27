-- Interest status, photo/last-seen privacy, profile views, in-app match notices, chat insert.

alter table public.interests
  add column if not exists status text not null default 'pending';

alter table public.interests
  add column if not exists responded_at timestamptz;

alter table public.interests drop constraint if exists interests_status_chk;
alter table public.interests
  add constraint interests_status_chk
  check (status in ('pending', 'accepted', 'declined', 'expired'));

alter table public.profiles
  add column if not exists hide_last_seen boolean not null default false;

alter table public.profiles
  add column if not exists hide_photo_until_accept boolean not null default true;

alter table public.app_users
  add column if not exists notify_match_email boolean not null default true;

create table if not exists public.profile_views (
  id uuid primary key default gen_random_uuid(),
  viewer_profile_id uuid not null references public.profiles (id) on delete cascade,
  viewed_profile_id uuid not null references public.profiles (id) on delete cascade,
  viewed_at timestamptz not null default now(),
  unique (viewer_profile_id, viewed_profile_id),
  constraint profile_views_not_self check (viewer_profile_id <> viewed_profile_id)
);

create index if not exists profile_views_viewed_idx
  on public.profile_views (viewed_profile_id, viewed_at desc);

create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  kind text not null,
  title text not null,
  body text not null,
  href text,
  match_profile_id uuid references public.profiles (id) on delete cascade,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists notices_user_idx
  on public.notices (user_id, created_at desc);

create unique index if not exists notices_match_uidx
  on public.notices (user_id, match_profile_id)
  where kind = 'match' and match_profile_id is not null;

alter table public.profile_views enable row level security;
alter table public.notices enable row level security;

create or replace function public.interest_accepted(a uuid, b uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.interests i
    where i.status = 'accepted'
      and (
        (i.from_profile_id = a and i.to_profile_id = b)
        or (i.from_profile_id = b and i.to_profile_id = a)
      )
  );
$$;

drop policy if exists interests_update on public.interests;
create policy interests_update on public.interests
  for update using (
    public.owns_profile(to_profile_id)
    or public.owns_profile(from_profile_id)
    or public.is_staff()
  );

drop policy if exists threads_insert on public.threads;
create policy threads_insert on public.threads
  for insert with check (
    profile_a < profile_b
    and (public.owns_profile(profile_a) or public.owns_profile(profile_b) or public.is_staff())
    and public.interest_accepted(profile_a, profile_b)
  );

drop policy if exists profile_views_select on public.profile_views;
create policy profile_views_select on public.profile_views
  for select using (
    public.owns_profile(viewer_profile_id)
    or public.owns_profile(viewed_profile_id)
    or public.is_staff()
  );

drop policy if exists profile_views_insert on public.profile_views;
create policy profile_views_insert on public.profile_views
  for insert with check (
    public.owns_profile(viewer_profile_id)
    and public.can_view_profile(viewed_profile_id)
  );

drop policy if exists profile_views_update on public.profile_views;
create policy profile_views_update on public.profile_views
  for update using (public.owns_profile(viewer_profile_id));

drop policy if exists notices_self on public.notices;
create policy notices_self on public.notices
  for all using (user_id = auth.uid() or public.is_staff())
  with check (user_id = auth.uid() or public.is_staff());

create or replace function public.expire_stale_interests()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  update public.interests
  set status = 'expired', responded_at = coalesce(responded_at, now())
  where status = 'pending'
    and created_at < now() - interval '50 days';
  get diagnostics n = row_count;
  return n;
end;
$$;
