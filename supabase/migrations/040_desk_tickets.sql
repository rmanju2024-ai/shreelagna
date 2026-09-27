-- Staff can move contact tickets through New → In progress → Done.

drop policy if exists tickets_staff_update on public.tickets;
create policy tickets_staff_update on public.tickets
  for update using (public.is_staff())
  with check (public.is_staff());
