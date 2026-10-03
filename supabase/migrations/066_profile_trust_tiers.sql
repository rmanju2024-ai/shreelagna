-- Truthful trust labels. A tier may only describe a completed check.
alter table public.profiles
  add column if not exists trust_tier text not null default 'submitted',
  add column if not exists trust_review_note text;

alter table public.profiles drop constraint if exists profiles_trust_tier_check;
alter table public.profiles
  add constraint profiles_trust_tier_check
  check (trust_tier in ('submitted', 'mobile_confirmed', 'details_reviewed', 'identity_checked'));

alter table public.profiles drop constraint if exists profiles_trust_review_note_len;
alter table public.profiles
  add constraint profiles_trust_review_note_len
  check (trust_review_note is null or char_length(trust_review_note) between 1 and 500);

create index if not exists profiles_trust_tier_idx on public.profiles (trust_tier, updated_at desc);
