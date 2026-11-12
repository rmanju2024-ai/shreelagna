-- Desk P0/P1: assignment + SLA, media review notes, staff freeze on threads.

alter table public.tickets
  add column if not exists assigned_to uuid references public.app_users (id) on delete set null,
  add column if not exists due_at timestamptz;

alter table public.safety_reports
  add column if not exists assigned_to uuid references public.app_users (id) on delete set null,
  add column if not exists due_at timestamptz;

alter table public.profile_verification_cases
  add column if not exists assigned_to uuid references public.app_users (id) on delete set null,
  add column if not exists due_at timestamptz;

alter table public.media
  add column if not exists review_reason text;

create index if not exists tickets_assigned_idx on public.tickets (assigned_to, status, created_at desc);
create index if not exists safety_assigned_idx on public.safety_reports (assigned_to, status, created_at desc);
create index if not exists verification_assigned_idx on public.profile_verification_cases (assigned_to, status, created_at desc);
create index if not exists media_pending_idx on public.media (status, created_at) where status = 'pending';

drop policy if exists threads_staff_update on public.threads;
create policy threads_staff_update on public.threads
  for update using (public.is_staff())
  with check (public.is_staff());

grant select, update on public.threads to authenticated;
