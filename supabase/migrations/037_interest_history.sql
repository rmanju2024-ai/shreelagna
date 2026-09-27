-- Keep History when the other profile is removed.

alter table public.interests drop constraint if exists interests_status_chk;
alter table public.interests
  add constraint interests_status_chk
  check (status in ('pending', 'accepted', 'declined', 'expired', 'deleted'));

create table if not exists public.interest_archive (
  id uuid primary key default gen_random_uuid(),
  interest_id uuid,
  from_profile_id uuid,
  to_profile_id uuid,
  from_user_id uuid,
  to_user_id uuid,
  from_name text,
  to_name text,
  status text not null default 'deleted',
  created_at timestamptz,
  closed_at timestamptz not null default now()
);

create index if not exists interest_archive_from_user_idx
  on public.interest_archive (from_user_id, closed_at desc);
create index if not exists interest_archive_to_user_idx
  on public.interest_archive (to_user_id, closed_at desc);

alter table public.interest_archive enable row level security;

drop policy if exists interest_archive_self on public.interest_archive;
create policy interest_archive_self on public.interest_archive
  for select using (
    from_user_id = auth.uid() or to_user_id = auth.uid() or public.is_staff()
  );

create or replace function public.archive_interests_for_profile()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.interest_archive (
    interest_id, from_profile_id, to_profile_id,
    from_user_id, to_user_id, from_name, to_name,
    status, created_at, closed_at
  )
  select
    i.id,
    i.from_profile_id,
    i.to_profile_id,
    coalesce(f.created_by, case when old.id = i.from_profile_id then old.created_by end),
    coalesce(t.created_by, case when old.id = i.to_profile_id then old.created_by end),
    coalesce(f.subject_full_name, case when old.id = i.from_profile_id then old.subject_full_name end),
    coalesce(t.subject_full_name, case when old.id = i.to_profile_id then old.subject_full_name end),
    'deleted',
    i.created_at,
    now()
  from public.interests i
  left join public.profiles f on f.id = i.from_profile_id
  left join public.profiles t on t.id = i.to_profile_id
  where i.from_profile_id = old.id or i.to_profile_id = old.id;
  return old;
end;
$$;

drop trigger if exists archive_interests_before_profile_delete on public.profiles;
create trigger archive_interests_before_profile_delete
before delete on public.profiles
for each row execute function public.archive_interests_for_profile();
