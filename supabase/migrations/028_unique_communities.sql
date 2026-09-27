-- Collapse duplicate community rows (same religion + same caste name).
begin;

with ranked as (
  select
    id,
    first_value(id) over (
      partition by religion_id, lower(regexp_replace(trim(name), '\s+', ' ', 'g'))
      order by length(name) desc, id
    ) as keep_id
  from public.communities
),
moved as (
  update public.profiles p
  set community_id = r.keep_id
  from ranked r
  where p.community_id = r.id
    and r.id <> r.keep_id
  returning p.id
)
delete from public.communities c
using ranked r
where c.id = r.id
  and r.id <> r.keep_id;

with aliases(old_name, new_name) as (
  values
    ('Iyengar', 'Brahmin - Iyengar'),
    ('Iyer', 'Brahmin - Iyer'),
    ('Smartha Brahmin', 'Brahmin - Smartha'),
    ('Namboothiri', 'Brahmin - Namboodiri'),
    ('Bunt', 'Bunt / Shetty'),
    ('Other Hindu', 'Other')
)
update public.profiles p
set community_id = keep.id
from public.communities old
join public.religions r on r.id = old.religion_id
join aliases a on lower(old.name) = lower(a.old_name)
join public.communities keep
  on keep.religion_id = old.religion_id
 and lower(keep.name) = lower(a.new_name)
where p.community_id = old.id
  and old.id <> keep.id;

with aliases(old_name, new_name) as (
  values
    ('Iyengar', 'Brahmin - Iyengar'),
    ('Iyer', 'Brahmin - Iyer'),
    ('Smartha Brahmin', 'Brahmin - Smartha'),
    ('Namboothiri', 'Brahmin - Namboodiri'),
    ('Bunt', 'Bunt / Shetty'),
    ('Other Hindu', 'Other')
)
delete from public.communities old
using public.religions r, aliases a, public.communities keep
where old.religion_id = r.id
  and lower(old.name) = lower(a.old_name)
  and keep.religion_id = old.religion_id
  and lower(keep.name) = lower(a.new_name)
  and old.id <> keep.id
  and not exists (select 1 from public.profiles p where p.community_id = old.id);

commit;
