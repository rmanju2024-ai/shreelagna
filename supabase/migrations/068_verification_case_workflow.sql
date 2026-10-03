-- Evidence is never public profile data. Files must only be accepted after
-- private storage RLS and automated deletion are enabled.
create table if not exists public.profile_verification_cases (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  requested_by uuid not null references public.app_users(id) on delete cascade,
  document_type text not null check (document_type in ('identity', 'education', 'employment')),
  status text not null default 'requested' check (status in ('requested', 'in_review', 'approved', 'rejected', 'appealed', 'expired')),
  reviewer_user_id uuid references public.app_users(id) on delete set null,
  review_note text,
  rejection_reason text,
  appeal_note text,
  reviewed_at timestamptz,
  recheck_due_at timestamptz,
  evidence_delete_after timestamptz not null default (now() + interval '90 days'),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profile_verification_cases_profile_idx
  on public.profile_verification_cases(profile_id, created_at desc);
create index if not exists profile_verification_cases_queue_idx
  on public.profile_verification_cases(status, created_at asc);

alter table public.profile_verification_cases enable row level security;

create policy "members see own verification cases"
  on public.profile_verification_cases for select
  using (requested_by = auth.uid());

create policy "members request own verification cases"
  on public.profile_verification_cases for insert
  with check (requested_by = auth.uid());
