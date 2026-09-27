-- Each contact reveal counts, including the same profile again.

create table if not exists public.contact_views (
  id uuid primary key default gen_random_uuid(),
  viewer_profile_id uuid not null references public.profiles (id) on delete cascade,
  viewed_profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  constraint contact_views_not_self check (viewer_profile_id <> viewed_profile_id)
);

create index if not exists contact_views_viewer_idx
  on public.contact_views (viewer_profile_id, created_at desc);

alter table public.contact_views enable row level security;

drop policy if exists contact_views_select on public.contact_views;
create policy contact_views_select on public.contact_views
  for select using (
    public.owns_profile(viewer_profile_id)
    or public.is_staff()
  );

drop policy if exists contact_views_insert on public.contact_views;
create policy contact_views_insert on public.contact_views
  for insert with check (public.owns_profile(viewer_profile_id));
