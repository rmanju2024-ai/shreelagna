-- Closed verification files are deleted as soon as review is complete.
alter table if exists public.profile_verification_cases
  alter column evidence_delete_after set default now();
