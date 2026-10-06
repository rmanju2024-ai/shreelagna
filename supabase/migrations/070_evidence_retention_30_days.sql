-- Closed verification files are deleted 30 days after review.
alter table public.profile_verification_cases
  alter column evidence_delete_after set default (now() + interval '30 days');
