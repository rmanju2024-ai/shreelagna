create table if not exists public.profile_shortlists (
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  shortlisted_profile_id uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (owner_profile_id, shortlisted_profile_id),
  constraint profile_shortlists_not_self check (owner_profile_id <> shortlisted_profile_id)
);

create table if not exists public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 48),
  filters jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.profile_shortlists enable row level security;
alter table public.saved_searches enable row level security;
create policy profile_shortlists_owner on public.profile_shortlists for all using (public.owns_profile(owner_profile_id)) with check (public.owns_profile(owner_profile_id));
create policy saved_searches_owner on public.saved_searches for all using (public.owns_profile(owner_profile_id)) with check (public.owns_profile(owner_profile_id));
grant select, insert, delete on public.profile_shortlists, public.saved_searches to authenticated;
