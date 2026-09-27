-- One row per member per IST calendar day they were on the site.

create table if not exists public.presence_days (
  user_id uuid not null references public.app_users (id) on delete cascade,
  day date not null,
  primary key (user_id, day)
);

create index if not exists presence_days_day_idx on public.presence_days (day desc);

alter table public.presence_days enable row level security;

drop policy if exists presence_days_self on public.presence_days;
create policy presence_days_self on public.presence_days
  for insert with check (user_id = auth.uid());

drop policy if exists presence_days_read on public.presence_days;
create policy presence_days_read on public.presence_days
  for select using (user_id = auth.uid() or public.is_staff());

grant select, insert on public.presence_days to authenticated;
