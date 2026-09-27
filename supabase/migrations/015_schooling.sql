-- Schooling labels: up to 10th / 12th, no formal schooling (not “illiterate”).
-- Run after 001–014.

begin;

update public.lookup_educations set name = 'Up to 10th' where name in ('10th', '10th pass', 'SSLC');
update public.lookup_educations set name = 'Up to 12th' where name in ('12th', '12th pass', 'PUC', 'HSC');

insert into public.lookup_educations (name, sort_order) values
  ('No formal schooling', 0),
  ('Up to 10th', 1),
  ('Up to 12th', 2)
on conflict (name) do nothing;

commit;
