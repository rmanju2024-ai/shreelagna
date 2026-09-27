-- One profile per signed-in email, and a unique house member number (SL######).
-- Run after 001–004 in the Supabase SQL editor.

begin;

create sequence if not exists public.profile_member_seq as bigint start with 10001 increment by 1;

alter table public.profiles
  add column if not exists member_code text;

with ranked as (
  select
    id,
    row_number() over (
      partition by created_by
      order by is_complete desc, updated_at desc, created_at desc
    ) as rn
  from public.profiles
)
delete from public.profiles p
using ranked r
where p.id = r.id
  and r.rn > 1;

update public.profiles
set member_code = 'SL' || lpad(nextval('public.profile_member_seq')::text, 6, '0')
where member_code is null or btrim(member_code) = '';

alter table public.profiles
  alter column member_code set not null;

create unique index if not exists profiles_member_code_uidx
  on public.profiles (member_code);

create unique index if not exists profiles_one_per_account_uidx
  on public.profiles (created_by);

create or replace function public.assign_member_code()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if tg_op = 'UPDATE' then
    new.member_code := old.member_code;
    return new;
  end if;
  if new.member_code is null or btrim(new.member_code) = '' then
    new.member_code := 'SL' || lpad(nextval('public.profile_member_seq')::text, 6, '0');
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_assign_member_code on public.profiles;
create trigger profiles_assign_member_code
  before insert or update on public.profiles
  for each row execute function public.assign_member_code();

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

commit;
