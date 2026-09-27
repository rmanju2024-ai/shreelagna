alter table public.profiles drop constraint if exists profiles_pref_notes_len;
alter table public.profiles
  add constraint profiles_pref_notes_len check (pref_notes is null or char_length(pref_notes) <= 8000);
