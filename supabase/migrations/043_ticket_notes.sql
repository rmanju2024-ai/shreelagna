-- Follow-up comments on contact tickets, separate from status.

create table if not exists public.ticket_notes (
  id uuid primary key default gen_random_uuid(),
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  body text not null,
  created_by uuid references public.app_users (id) on delete set null,
  created_at timestamptz not null default now(),
  constraint ticket_notes_body_len check (char_length(body) between 1 and 2000)
);

create index if not exists ticket_notes_ticket_idx on public.ticket_notes (ticket_id, created_at);

alter table public.ticket_notes enable row level security;

drop policy if exists ticket_notes_staff on public.ticket_notes;
create policy ticket_notes_staff on public.ticket_notes
  for all using (public.is_staff())
  with check (public.is_staff());

grant select, insert on public.ticket_notes to authenticated;
