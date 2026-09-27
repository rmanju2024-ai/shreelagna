-- Staff can put a ticket on hold and write what was done.

alter type public.ticket_status add value if not exists 'on_hold';

alter table public.tickets
  add column if not exists resolution text,
  add column if not exists resolved_at timestamptz;

alter table public.tickets drop constraint if exists tickets_resolution_len;
alter table public.tickets
  add constraint tickets_resolution_len check (resolution is null or char_length(resolution) between 1 and 2000);
