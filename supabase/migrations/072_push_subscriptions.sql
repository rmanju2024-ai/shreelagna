-- Web Push subscriptions for in-app alerts (Android Chrome + iOS Safari PWA).

create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  endpoint text not null,
  p256dh text not null,
  auth text not null,
  user_agent text,
  created_at timestamptz not null default now(),
  unique (endpoint)
);

create index if not exists push_subscriptions_user_idx
  on public.push_subscriptions (user_id, created_at desc);

alter table public.push_subscriptions enable row level security;

drop policy if exists push_subscriptions_self on public.push_subscriptions;
create policy push_subscriptions_self on public.push_subscriptions
  for all
  using (user_id = auth.uid())
  with check (user_id = auth.uid());
