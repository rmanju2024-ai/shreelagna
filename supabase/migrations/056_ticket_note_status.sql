-- Snapshot of ticket status at the time a staff note is written.

alter table public.ticket_notes
  add column if not exists ticket_status text;
