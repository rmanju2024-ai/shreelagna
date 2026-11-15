-- One Gmail login may hold up to three profiles (parent / twins). Discover still
-- runs as one bride or groom at a time via app_users.active_profile_id.

begin;

drop index if exists public.profiles_one_per_account_uidx;

create or replace function public.enforce_profile_cap()
returns trigger
language plpgsql
as $$
begin
  if (
    select count(*) from public.profiles p
    where p.created_by = new.created_by
      and (tg_op = 'INSERT' or p.id <> new.id)
  ) >= 3 then
    raise exception 'profile account cap';
  end if;
  return new;
end;
$$;

drop trigger if exists profiles_cap on public.profiles;
create trigger profiles_cap
  before insert or update of created_by on public.profiles
  for each row execute function public.enforce_profile_cap();

commit;
