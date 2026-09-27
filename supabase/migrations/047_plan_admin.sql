-- Admin may add and rewrite the plan catalog later without touching SQL.

drop policy if exists member_plans_write on public.member_plans;
create policy member_plans_write on public.member_plans
  for all using (public.is_admin())
  with check (public.is_admin());
