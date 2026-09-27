-- Staff can clear a false contact-detail flag until About changes.

alter table public.profiles
  add column if not exists contact_flags_cleared_hash text;
