-- WhatsApp OTP challenges + opt-in. No SMS.

create table if not exists public.whatsapp_otps (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.app_users(id) on delete cascade,
  profile_id uuid references public.profiles(id) on delete cascade,
  mobile text not null,
  code_hash text not null,
  purpose text not null default 'verify_mobile',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create index if not exists whatsapp_otps_user_created_idx
  on public.whatsapp_otps (user_id, created_at desc);

alter table public.whatsapp_otps enable row level security;

alter table public.app_users
  add column if not exists notify_whatsapp boolean not null default true;
