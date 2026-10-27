-- Education and work document checks are retired. Identity remains.
-- Close any still-open education/employment cases; keep historical rows.

update public.profile_verification_cases
set
  status = 'expired',
  updated_at = now(),
  review_note = coalesce(nullif(trim(review_note), ''), 'Education and work document checks are no longer offered.')
where document_type in ('education', 'employment')
  and status in ('requested', 'in_review', 'appealed');
