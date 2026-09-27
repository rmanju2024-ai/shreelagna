-- Welcome gift is two months from joining (app_users.welcome_*).
-- Paid plans are requested by the member and confirmed on the desk.

alter table public.app_users
  alter column welcome_days set default 61;

update public.app_users
  set welcome_days = 61
  where welcome_days is null or welcome_days = 14;

create table if not exists public.member_plans (
  code text primary key,
  name text not null,
  tagline text not null,
  months int not null,
  price_inr int not null default 0,
  featured boolean not null default false,
  for_sale boolean not null default true,
  sort_order int not null default 0,
  perks text[] not null default '{}'
);

insert into public.member_plans (code, name, tagline, months, price_inr, featured, for_sale, sort_order, perks)
values
  (
    'silver',
    'Silver',
    'Three months of match access after the welcome gift.',
    3,
    1499,
    false,
    true,
    1,
    array['Send interest', 'Chat after accept', 'Browse families']
  ),
  (
    'gold',
    'Gold',
    'The usual house plan — six months, one payment.',
    6,
    2499,
    true,
    true,
    2,
    array['Send interest', 'Chat after accept', 'Browse families', 'Best value for most families']
  ),
  (
    'platinum',
    'Platinum',
    'A full year if the search may take longer.',
    12,
    3999,
    false,
    true,
    3,
    array['Send interest', 'Chat after accept', 'Browse families', 'Longest cover']
  )
on conflict (code) do nothing;

create table if not exists public.memberships (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  plan_code text not null references public.member_plans (code),
  source text not null check (source in ('request', 'grant')),
  status text not null check (status in ('pending', 'active', 'cancelled')),
  starts_at timestamptz,
  ends_at timestamptz,
  note text,
  created_at timestamptz not null default now(),
  activated_at timestamptz,
  activated_by uuid references public.app_users (id)
);

create index if not exists memberships_user_idx on public.memberships (user_id, status);
create index if not exists memberships_pending_idx on public.memberships (status, created_at desc)
  where status = 'pending';
create unique index if not exists memberships_one_pending
  on public.memberships (user_id)
  where status = 'pending';

alter table public.memberships enable row level security;
alter table public.member_plans enable row level security;

drop policy if exists member_plans_read on public.member_plans;
create policy member_plans_read on public.member_plans
  for select using (true);

drop policy if exists memberships_select on public.memberships;
create policy memberships_select on public.memberships
  for select using (user_id = auth.uid() or public.is_staff());

drop policy if exists memberships_insert_own on public.memberships;
create policy memberships_insert_own on public.memberships
  for insert with check (
    user_id = auth.uid()
    and source = 'request'
    and status = 'pending'
  );

drop policy if exists memberships_update_own_pending on public.memberships;
create policy memberships_update_own_pending on public.memberships
  for update using (user_id = auth.uid() and status = 'pending')
  with check (user_id = auth.uid() and status = 'pending' and source = 'request');

drop policy if exists memberships_staff on public.memberships;
create policy memberships_staff on public.memberships
  for all using (public.is_staff())
  with check (public.is_staff());
