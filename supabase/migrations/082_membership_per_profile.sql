-- Each bride or groom holds their own plan and usage. The login is only the wallet.

begin;

alter table public.memberships
  add column if not exists profile_id uuid references public.profiles (id) on delete cascade;

update public.memberships m
set profile_id = p.id
from (
  select distinct on (created_by) id, created_by
  from public.profiles
  order by created_by, created_at asc
) p
where m.profile_id is null
  and m.user_id = p.created_by;

create index if not exists memberships_profile_idx
  on public.memberships (profile_id, status);

drop index if exists public.memberships_one_pending;
create unique index if not exists memberships_one_pending
  on public.memberships (profile_id)
  where status = 'pending' and profile_id is not null;

drop index if exists public.memberships_one_active;
create unique index if not exists memberships_one_active
  on public.memberships (profile_id)
  where status = 'active' and profile_id is not null;

commit;
