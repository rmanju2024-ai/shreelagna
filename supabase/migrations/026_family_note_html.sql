alter table public.profiles drop constraint if exists profiles_siblings_note_len;
alter table public.profiles
  add constraint profiles_siblings_note_len check (siblings_note is null or char_length(siblings_note) <= 8000);
