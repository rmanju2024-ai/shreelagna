-- Optional decline reason, and no reverse send while a note is still open.

alter table public.interests
  add column if not exists decline_reason text;

create or replace function public.block_open_interest_pair()
returns trigger
language plpgsql
as $$
begin
  if exists (
    select 1
    from public.interests i
    where i.id is distinct from new.id
      and i.status in ('pending', 'accepted')
      and (
        (i.from_profile_id = new.from_profile_id and i.to_profile_id = new.to_profile_id)
        or (i.from_profile_id = new.to_profile_id and i.to_profile_id = new.from_profile_id)
      )
  ) then
    raise exception 'An interest is already open between these profiles';
  end if;
  return new;
end;
$$;

drop trigger if exists block_open_interest_pair on public.interests;
create trigger block_open_interest_pair
before insert on public.interests
for each row execute function public.block_open_interest_pair();
