-- Close authorization gaps found in the full-project audit.

-- Only the recipient (or staff) may accept/decline an interest.
drop policy if exists interests_update on public.interests;
create policy interests_update on public.interests
  for update
  using (public.owns_profile(to_profile_id) or public.is_staff())
  with check (public.owns_profile(to_profile_id) or public.is_staff());

-- This global maintenance function must never be callable by site visitors.
revoke all on function public.expire_stale_interests() from public, anon, authenticated;

-- Harden the Search bundle. The requested type is derived from the owned
-- profile, admin-owned profiles are excluded, and only approved photos leave
-- the function. p_want remains only for backward-compatible callers.
create or replace function public.browse_bundle(p_mine uuid, p_want text default null, p_limit int default 60)
returns jsonb
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  keys text[] := array[
    'id','created_by','profile_type','status','subject_full_name','hide_last_seen','last_seen_at',
    'date_of_birth','height_cm','marital_status','diet','mother_tongue','qualification','occupation',
    'employed_in','income_band','current_country','current_state','current_city','native_state',
    'rashi','nakshatra','gana','yoni_animal','yoni','manglik','pref_age_min','pref_age_max',
    'pref_height_min','pref_height_max','pref_maritals','pref_marital','pref_diets','pref_horoscope',
    'pref_tongues','pref_religions','pref_communities','pref_countries','pref_country','pref_states',
    'pref_state','pref_cities','pref_educations','pref_education','pref_occupations','pref_occupation',
    'pref_employed','pref_incomes','pref_community_mode'
  ];
  mine_type public.profile_type;
  result jsonb;
begin
  select profile_type into mine_type
  from public.profiles
  where id = p_mine and created_by = auth.uid() and status::text = 'active';
  if mine_type is null then return null; end if;

  with listed as (
    select p.* from public.profiles p
    join public.app_users owner on owner.id = p.created_by
    where p.status::text = 'active'
      and p.id <> p_mine
      and p.profile_type <> mine_type
      and owner.role::text <> 'admin'
      and public.can_view_profile(p.id)
    order by p.updated_at desc
    limit greatest(1, least(coalesce(p_limit, 60), 100))
  ),
  vy as (
    select viewer_profile_id, viewed_profile_id, viewed_at from public.profile_views
    where viewed_profile_id = p_mine order by viewed_at desc limit 40
  ),
  yv as (
    select viewer_profile_id, viewed_profile_id, viewed_at from public.profile_views
    where viewer_profile_id = p_mine order by viewed_at desc limit 40
  ),
  extra_ids as (
    select distinct case when v.viewer_profile_id = p_mine then v.viewed_profile_id else v.viewer_profile_id end as id
    from (select * from vy union all select * from yv) v
  ),
  extra as (
    select p.* from public.profiles p
    join public.app_users owner on owner.id = p.created_by
    where p.status::text = 'active'
      and p.id <> p_mine
      and p.profile_type <> mine_type
      and owner.role::text <> 'admin'
      and public.can_view_profile(p.id)
      and p.id in (select id from extra_ids)
      and p.id not in (select id from listed)
  ),
  allp as (
    select l.*, false as is_extra from listed l
    union all
    select e.*, true as is_extra from extra e
  )
  select jsonb_build_object(
    'rows', coalesce((
      select jsonb_agg(
        (select jsonb_object_agg(k, v) from jsonb_each(to_jsonb(a)) as t(k, v) where k = any(keys))
        || jsonb_build_object(
          'religions', jsonb_build_object('name', r.name),
          'communities', jsonb_build_object('name', c.name),
          'photo_path', (
            select m.storage_path from public.media m
            where m.profile_id = a.id
              and m.kind::text = 'photo'
              and m.status::text = 'approved'
            order by m.is_primary desc, m.created_at limit 1
          ),
          'by_admin', false,
          'is_extra', a.is_extra
        )
      )
      from allp a
      left join public.religions r on r.id = a.religion_id
      left join public.communities c on c.id = a.community_id
    ), '[]'::jsonb),
    'viewed_you', coalesce((select jsonb_agg(to_jsonb(vy)) from vy), '[]'::jsonb),
    'you_viewed', coalesce((select jsonb_agg(to_jsonb(yv)) from yv), '[]'::jsonb)
  ) into result;

  return result;
end;
$$;

revoke all on function public.browse_bundle(uuid, text, int) from public, anon;
grant execute on function public.browse_bundle(uuid, text, int) to authenticated;
