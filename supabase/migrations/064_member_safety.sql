-- Member safety: private blocks and staff-reviewed reports.
create table if not exists public.member_blocks (
  blocker_profile_id uuid not null references public.profiles(id) on delete cascade,
  blocked_profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_profile_id, blocked_profile_id),
  constraint member_blocks_not_self check (blocker_profile_id <> blocked_profile_id)
);

create index if not exists member_blocks_blocked_idx on public.member_blocks (blocked_profile_id);

create table if not exists public.safety_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_profile_id uuid not null references public.profiles(id) on delete cascade,
  reported_profile_id uuid not null references public.profiles(id) on delete cascade,
  category text not null check (category in ('fake_profile', 'harassment', 'money_request', 'inappropriate_content', 'marital_status', 'other')),
  details text check (details is null or char_length(details) between 1 and 2000),
  status text not null default 'new' check (status in ('new', 'in_review', 'resolved', 'dismissed')),
  staff_note text check (staff_note is null or char_length(staff_note) between 1 and 2000),
  reviewed_by uuid references public.app_users(id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  constraint safety_reports_not_self check (reporter_profile_id <> reported_profile_id)
);

create index if not exists safety_reports_status_idx on public.safety_reports (status, created_at desc);
create unique index if not exists safety_reports_open_pair_idx
  on public.safety_reports (reporter_profile_id, reported_profile_id, category)
  where status in ('new', 'in_review');

alter table public.member_blocks enable row level security;
alter table public.safety_reports enable row level security;

drop policy if exists member_blocks_owner on public.member_blocks;
create policy member_blocks_owner on public.member_blocks
  for all using (public.owns_profile(blocker_profile_id))
  with check (public.owns_profile(blocker_profile_id));

drop policy if exists safety_reports_member_insert on public.safety_reports;
create policy safety_reports_member_insert on public.safety_reports
  for insert with check (public.owns_profile(reporter_profile_id));

drop policy if exists safety_reports_member_select on public.safety_reports;
create policy safety_reports_member_select on public.safety_reports
  for select using (public.owns_profile(reporter_profile_id));

drop policy if exists safety_reports_staff on public.safety_reports;
create policy safety_reports_staff on public.safety_reports
  for all using (public.is_staff())
  with check (public.is_staff());

grant select, insert, delete on public.member_blocks to authenticated;
grant select, insert on public.safety_reports to authenticated;
