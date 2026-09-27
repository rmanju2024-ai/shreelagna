alter table public.profiles drop constraint if exists profiles_about_len;
alter table public.profiles
  add constraint profiles_about_len check (about is null or char_length(about) <= 8000);
