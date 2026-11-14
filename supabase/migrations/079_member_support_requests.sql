-- Members can follow their own help requests. Staff notes stay on the desk.

alter table public.tickets
  add column if not exists created_by uuid references public.app_users (id) on delete set null;

create index if not exists tickets_created_by_idx on public.tickets (created_by, created_at desc);

update public.tickets t
set created_by = u.id
from public.app_users u
where t.created_by is null
  and t.email is not null
  and lower(t.email::text) = lower(u.email::text);

drop policy if exists tickets_own_select on public.tickets;
create policy tickets_own_select on public.tickets
  for select using (created_by = auth.uid());
