-- Arrays for languages and hoped-for faith, caste, place. Students welcome.

begin;

alter table public.profiles add column if not exists known_languages text[] not null default '{}';
alter table public.profiles add column if not exists pref_tongues text[] not null default '{}';
alter table public.profiles add column if not exists pref_religions text[] not null default '{}';
alter table public.profiles add column if not exists pref_communities text[] not null default '{}';
alter table public.profiles add column if not exists pref_states text[] not null default '{}';
alter table public.profiles add column if not exists pref_cities text[] not null default '{}';

insert into public.lookup_employed (name, sort_order) values ('Student', -1)
on conflict (name) do nothing;

insert into public.lookup_incomes (name, sort_order) values ('Student / not earning', 0)
on conflict (name) do nothing;

insert into public.lookup_educations (name, sort_order) values
  ('Pursuing 12th', 1),
  ('Pursuing diploma', 2),
  ('Pursuing bachelor''s', 4),
  ('Pursuing master''s', 17)
on conflict (name) do nothing;

commit;
