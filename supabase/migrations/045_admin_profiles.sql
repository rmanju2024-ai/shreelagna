-- Admin profiles stay private from members and service staff.

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_users u
    where u.id = auth.uid() and u.role = 'admin'
  );
$$;

create or replace function public.profile_owner_is_admin(p uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles pr
    join public.app_users u on u.id = pr.created_by
    where pr.id = p and u.role = 'admin'
  );
$$;

create or replace function public.can_view_profile(p uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.owns_profile(p)
    or (
      public.profile_owner_is_admin(p)
      and public.is_admin()
    )
    or (
      not public.profile_owner_is_admin(p)
      and (
        public.is_staff()
        or exists (
          select 1
          from public.profiles target
          where target.id = p
            and target.status = 'active'
            and public.current_profile_type() is not null
            and target.profile_type <> public.current_profile_type()
        )
      )
    );
$$;

drop policy if exists profiles_update on public.profiles;
create policy profiles_update on public.profiles
  for update using (
    created_by = auth.uid()
    or public.is_admin()
    or (public.is_staff() and not public.profile_owner_is_admin(id))
  );
