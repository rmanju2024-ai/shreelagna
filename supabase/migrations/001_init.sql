-- Shree Lagna Matrimony — schema, indexes, RLS
-- Apply in Supabase SQL editor. Do not use the laptop Postgres of other apps.

begin;

create extension if not exists "pgcrypto";
create extension if not exists "citext";
create extension if not exists "pg_trgm";

do $$ begin
  create type public.profile_type as enum ('vadhu', 'vara');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.creator_relationship as enum (
    'self', 'parent', 'sibling', 'relative', 'friend', 'colleague', 'staff'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.profile_status as enum (
    'draft', 'pending_review', 'active', 'on_hold', 'married', 'hidden', 'banned'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.media_kind as enum ('photo', 'video', 'audio', 'horoscope');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.media_status as enum ('pending', 'approved', 'rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.app_role as enum ('member', 'service', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.ticket_status as enum ('new', 'in_progress', 'done');
exception when duplicate_object then null; end $$;

create table if not exists public.religions (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order int not null default 0
);

create table if not exists public.communities (
  id uuid primary key default gen_random_uuid(),
  religion_id uuid not null references public.religions (id) on delete restrict,
  native_state text,
  slug text not null,
  name text not null,
  unique (religion_id, slug)
);

create index if not exists communities_religion_idx on public.communities (religion_id);
create index if not exists communities_state_idx on public.communities (native_state);
create index if not exists communities_name_trgm on public.communities using gin (name gin_trgm_ops);

create table if not exists public.sub_castes (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities (id) on delete cascade,
  slug text not null,
  name text not null,
  unique (community_id, slug)
);

create index if not exists sub_castes_community_idx on public.sub_castes (community_id);

create table if not exists public.app_users (
  id uuid primary key references auth.users (id) on delete cascade,
  email citext not null unique,
  email_otp_verified_at timestamptz,
  display_name text,
  role public.app_role not null default 'member',
  active_profile_id uuid,
  welcome_started_at timestamptz not null default now(),
  welcome_days int not null default 14,
  notify_interest_email boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_login_at timestamptz,
  last_login_ip inet
);

create index if not exists app_users_role_idx on public.app_users (role);

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  created_by uuid not null references public.app_users (id) on delete restrict,
  creator_relationship public.creator_relationship not null,
  profile_type public.profile_type not null,
  status public.profile_status not null default 'draft',
  is_complete boolean not null default false,
  subject_full_name text not null,
  date_of_birth date not null,
  mother_tongue text,
  height_cm smallint,
  marital_status text,
  physical_status text,
  diet text,
  smoke_drink text,
  native_state text,
  native_district text,
  current_city text,
  citizenship text,
  willing_to_relocate boolean,
  qualification text,
  occupation text,
  employed_in text,
  income_band text,
  religion_id uuid references public.religions (id),
  community_id uuid references public.communities (id),
  prefer_not_community boolean not null default false,
  sub_caste_id uuid references public.sub_castes (id),
  gotra text,
  kuladevata text,
  family_type text,
  about text,
  rashi text,
  nakshatra text,
  manglik text,
  subject_mobile text,
  phone_otp_verified_at timestamptz,
  pref_age_min smallint,
  pref_age_max smallint,
  pref_community_mode text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint profiles_age_adult check (date_of_birth <= (current_date - interval '21 years')),
  constraint profiles_name_len check (char_length(subject_full_name) between 2 and 120),
  constraint profiles_about_len check (about is null or char_length(about) <= 600),
  constraint profiles_height_ok check (height_cm is null or height_cm between 120 and 220)
);

create unique index if not exists profiles_verified_mobile_uidx
  on public.profiles (subject_mobile)
  where phone_otp_verified_at is not null and subject_mobile is not null;

create index if not exists profiles_type_status_idx
  on public.profiles (profile_type, status)
  where status = 'active';

create index if not exists profiles_browse_idx
  on public.profiles (profile_type, status, native_state, community_id, date_of_birth);

create index if not exists profiles_created_by_idx on public.profiles (created_by);
create index if not exists profiles_complete_idx on public.profiles (is_complete) where is_complete = true;
create index if not exists profiles_city_trgm on public.profiles using gin (current_city gin_trgm_ops);
create index if not exists profiles_name_trgm on public.profiles using gin (subject_full_name gin_trgm_ops);
create index if not exists profiles_updated_idx on public.profiles (updated_at desc);

alter table public.app_users drop constraint if exists app_users_active_profile_fk;
alter table public.app_users
  add constraint app_users_active_profile_fk
  foreign key (active_profile_id) references public.profiles (id) on delete set null;

create or replace function public.enforce_profile_cap()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*) from public.profiles p
    where p.created_by = new.created_by
      and (tg_op = 'INSERT' or p.id <> new.id)
  ) >= 1 then
    raise exception 'One profile per account';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_cap on public.profiles;
create trigger profiles_cap
  before insert or update of created_by on public.profiles
  for each row execute function public.enforce_profile_cap();

create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_touch on public.profiles;
create trigger profiles_touch
  before update on public.profiles
  for each row execute function public.touch_updated_at();

create table if not exists public.media (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles (id) on delete cascade,
  kind public.media_kind not null,
  status public.media_status not null default 'pending',
  storage_path text not null,
  is_primary boolean not null default false,
  duration_seconds numeric(6, 1),
  byte_size int,
  created_at timestamptz not null default now(),
  constraint media_duration_ok check (
    duration_seconds is null or duration_seconds <= 180
  )
);

create index if not exists media_profile_kind_idx on public.media (profile_id, kind);
create unique index if not exists media_one_video
  on public.media (profile_id) where kind = 'video';
create unique index if not exists media_one_audio
  on public.media (profile_id) where kind = 'audio';

create or replace function public.enforce_photo_cap()
returns trigger
language plpgsql
as $$
declare n int;
begin
  if new.kind = 'photo' then
    select count(*) into n from public.media
    where profile_id = new.profile_id and kind = 'photo'
      and (tg_op = 'INSERT' or id <> new.id);
    if n >= 3 then
      raise exception 'Maximum of 3 photos per profile';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists media_photo_cap on public.media;
create trigger media_photo_cap
  before insert or update of kind, profile_id on public.media
  for each row execute function public.enforce_photo_cap();

create or replace function public.recompute_profile_complete(p_id uuid)
returns void
language plpgsql
as $$
declare
  r public.profiles%rowtype;
  photo_ok boolean;
  email_ok boolean;
  sms_required boolean;
  phone_ok boolean;
begin
  select * into r from public.profiles where id = p_id;
  if not found then return; end if;

  select exists (
    select 1 from public.media m
    where m.profile_id = p_id and m.kind = 'photo' and m.status = 'approved'
  ) into photo_ok;

  select (u.email_otp_verified_at is not null)
    into email_ok
  from public.app_users u where u.id = r.created_by;

  sms_required := coalesce(current_setting('app.sms_otp_required', true), 'true') = 'true';
  phone_ok := (r.subject_mobile is not null and length(r.subject_mobile) >= 10)
    and (not sms_required or r.phone_otp_verified_at is not null);

  update public.profiles
  set is_complete =
    photo_ok
    and coalesce(email_ok, false)
    and phone_ok
    and r.subject_full_name is not null
    and r.date_of_birth is not null
    and r.current_city is not null
    and r.height_cm is not null
    and r.marital_status is not null
    and r.qualification is not null
    and r.occupation is not null
    and r.about is not null
    and char_length(coalesce(r.about, '')) >= 80
    and (r.community_id is not null or r.prefer_not_community)
  where id = p_id;
end;
$$;

create table if not exists public.credit_ledger (
  id bigint generated always as identity primary key,
  user_id uuid not null references public.app_users (id) on delete cascade,
  delta int not null,
  reason text not null,
  razorpay_payment_id text,
  created_at timestamptz not null default now()
);

create index if not exists credit_ledger_user_idx
  on public.credit_ledger (user_id, created_at desc);

create unique index if not exists credit_ledger_razorpay_uidx
  on public.credit_ledger (razorpay_payment_id)
  where razorpay_payment_id is not null;

create table if not exists public.unlocks (
  id uuid primary key default gen_random_uuid(),
  from_profile_id uuid not null references public.profiles (id) on delete cascade,
  to_profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (from_profile_id, to_profile_id)
);

create index if not exists unlocks_to_idx on public.unlocks (to_profile_id);

create table if not exists public.interests (
  id uuid primary key default gen_random_uuid(),
  from_profile_id uuid not null references public.profiles (id) on delete cascade,
  to_profile_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (from_profile_id, to_profile_id),
  constraint interests_not_self check (from_profile_id <> to_profile_id)
);

create index if not exists interests_to_idx on public.interests (to_profile_id, created_at desc);
create index if not exists interests_from_idx on public.interests (from_profile_id);

create table if not exists public.threads (
  id uuid primary key default gen_random_uuid(),
  profile_a uuid not null references public.profiles (id) on delete cascade,
  profile_b uuid not null references public.profiles (id) on delete cascade,
  frozen boolean not null default false,
  created_at timestamptz not null default now(),
  unique (profile_a, profile_b),
  constraint threads_order check (profile_a < profile_b)
);

create table if not exists public.messages (
  id bigint generated always as identity primary key,
  thread_id uuid not null references public.threads (id) on delete cascade,
  sender_profile_id uuid not null references public.profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now(),
  constraint messages_body_len check (char_length(body) between 1 and 4000)
);

create index if not exists messages_thread_time_idx
  on public.messages (thread_id, created_at);

create table if not exists public.tickets (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  email citext,
  mobile text,
  city text,
  enquiry_type text,
  message text not null,
  status public.ticket_status not null default 'new',
  honeypot text,
  created_at timestamptz not null default now(),
  constraint tickets_msg_len check (char_length(message) between 10 and 2000)
);

create index if not exists tickets_status_idx on public.tickets (status, created_at desc);

create table if not exists public.audit_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  actor_user_id uuid references public.app_users (id),
  actor_role public.app_role,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  ip inet,
  user_agent text
);

create index if not exists audit_at_idx on public.audit_events (at desc);
create index if not exists audit_actor_idx on public.audit_events (actor_user_id, at desc);
create index if not exists audit_entity_idx on public.audit_events (entity_type, entity_id);

revoke update, delete on public.audit_events from anon, authenticated;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_users u
    where u.id = auth.uid() and u.role in ('service', 'admin')
  );
$$;

create or replace function public.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select active_profile_id from public.app_users where id = auth.uid();
$$;

create or replace function public.current_profile_type()
returns public.profile_type
language sql
stable
security definer
set search_path = public
as $$
  select p.profile_type
  from public.app_users u
  join public.profiles p on p.id = u.active_profile_id
  where u.id = auth.uid();
$$;

create or replace function public.owns_profile(p uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles pr
    where pr.id = p and pr.created_by = auth.uid()
  );
$$;

create or replace function public.can_view_profile(p uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_staff()
    or public.owns_profile(p)
    or exists (
      select 1
      from public.profiles target
      where target.id = p
        and target.status = 'active'
        and public.current_profile_type() is not null
        and target.profile_type <> public.current_profile_type()
    );
$$;

create or replace function public.profile_can_initiate(p uuid)
returns boolean
language sql
stable
as $$
  select exists (
    select 1 from public.profiles
    where id = p and is_complete = true and status = 'active'
  );
$$;

alter table public.app_users enable row level security;
alter table public.profiles enable row level security;
alter table public.media enable row level security;
alter table public.credit_ledger enable row level security;
alter table public.unlocks enable row level security;
alter table public.interests enable row level security;
alter table public.threads enable row level security;
alter table public.messages enable row level security;
alter table public.tickets enable row level security;
alter table public.audit_events enable row level security;
alter table public.religions enable row level security;
alter table public.communities enable row level security;
alter table public.sub_castes enable row level security;

drop policy if exists religions_read on public.religions;
create policy religions_read on public.religions for select using (true);

drop policy if exists communities_read on public.communities;
create policy communities_read on public.communities for select using (true);

drop policy if exists sub_castes_read on public.sub_castes;
create policy sub_castes_read on public.sub_castes for select using (true);

drop policy if exists app_users_self on public.app_users;
create policy app_users_self on public.app_users
  for all using (id = auth.uid() or public.is_staff())
  with check (id = auth.uid() or public.is_staff());

drop policy if exists profiles_select on public.profiles;
create policy profiles_select on public.profiles
  for select using (public.can_view_profile(id));

drop policy if exists profiles_insert on public.profiles;
create policy profiles_insert on public.profiles
  for insert with check (created_by = auth.uid() or public.is_staff());

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (created_by = auth.uid() or public.is_staff());

drop policy if exists media_select on public.media;
create policy media_select on public.media
  for select using (
    public.can_view_profile(profile_id)
    and (
      public.owns_profile(profile_id)
      or public.is_staff()
      or status = 'approved'
    )
  );

drop policy if exists media_write on public.media;
create policy media_write on public.media
  for all using (public.owns_profile(profile_id) or public.is_staff())
  with check (public.owns_profile(profile_id) or public.is_staff());

drop policy if exists interests_select on public.interests;
create policy interests_select on public.interests
  for select using (
    public.owns_profile(from_profile_id)
    or public.owns_profile(to_profile_id)
    or public.is_staff()
  );

drop policy if exists interests_insert on public.interests;
create policy interests_insert on public.interests
  for insert with check (
    public.owns_profile(from_profile_id)
    and public.profile_can_initiate(from_profile_id)
    and public.can_view_profile(to_profile_id)
  );

drop policy if exists unlocks_select on public.unlocks;
create policy unlocks_select on public.unlocks
  for select using (
    public.owns_profile(from_profile_id)
    or public.owns_profile(to_profile_id)
    or public.is_staff()
  );

drop policy if exists unlocks_insert on public.unlocks;
create policy unlocks_insert on public.unlocks
  for insert with check (
    public.owns_profile(from_profile_id)
    and public.profile_can_initiate(from_profile_id)
  );

drop policy if exists threads_select on public.threads;
create policy threads_select on public.threads
  for select using (
    public.owns_profile(profile_a) or public.owns_profile(profile_b) or public.is_staff()
  );

drop policy if exists messages_select on public.messages;
create policy messages_select on public.messages
  for select using (
    exists (
      select 1 from public.threads t
      where t.id = thread_id
        and (public.owns_profile(t.profile_a) or public.owns_profile(t.profile_b) or public.is_staff())
    )
  );

drop policy if exists messages_insert on public.messages;
create policy messages_insert on public.messages
  for insert with check (
    public.owns_profile(sender_profile_id)
    and exists (
      select 1 from public.threads t
      where t.id = thread_id
        and t.frozen = false
        and (t.profile_a = sender_profile_id or t.profile_b = sender_profile_id)
    )
  );

drop policy if exists tickets_insert on public.tickets;
create policy tickets_insert on public.tickets
  for insert with check (honeypot is null or honeypot = '');

drop policy if exists tickets_staff on public.tickets;
create policy tickets_staff on public.tickets
  for select using (public.is_staff());

drop policy if exists audit_staff on public.audit_events;
create policy audit_staff on public.audit_events
  for select using (
    exists (select 1 from public.app_users u where u.id = auth.uid() and u.role = 'admin')
  );

drop policy if exists audit_insert on public.audit_events;
create policy audit_insert on public.audit_events
  for insert with check (actor_user_id = auth.uid() or public.is_staff());

drop policy if exists credits_self on public.credit_ledger;
create policy credits_self on public.credit_ledger
  for select using (user_id = auth.uid() or public.is_staff());

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.app_users (id, email, display_name, last_login_at)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    now()
  )
  on conflict (id) do update set last_login_at = now();
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

insert into public.religions (slug, name, sort_order) values
  ('hindu', 'Hindu', 1),
  ('jain', 'Jain', 2),
  ('christian', 'Christian', 3),
  ('muslim', 'Muslim', 4),
  ('buddhist', 'Buddhist', 5),
  ('sikh', 'Sikh', 6),
  ('other', 'Other', 9)
on conflict (slug) do nothing;

commit;
