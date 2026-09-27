begin;

create table if not exists public.lookup_astronomy (
  id uuid primary key default gen_random_uuid(),
  kind text not null,
  name text not null,
  sort_order int not null default 0,
  unique (kind, name),
  constraint lookup_astronomy_kind_ok check (
    kind in ('rashi', 'nakshatra', 'nakshatra_pada', 'gana', 'yoni_animal', 'manglik')
  )
);

insert into public.lookup_astronomy (kind, name, sort_order) values
  ('rashi', 'Mesha (Aries)', 0),
  ('rashi', 'Vrishabha (Taurus)', 1),
  ('rashi', 'Mithuna (Gemini)', 2),
  ('rashi', 'Karka (Cancer)', 3),
  ('rashi', 'Simha (Leo)', 4),
  ('rashi', 'Kanya (Virgo)', 5),
  ('rashi', 'Tula (Libra)', 6),
  ('rashi', 'Vrischika (Scorpio)', 7),
  ('rashi', 'Dhanu (Sagittarius)', 8),
  ('rashi', 'Makara (Capricorn)', 9),
  ('rashi', 'Kumbha (Aquarius)', 10),
  ('rashi', 'Meena (Pisces)', 11),
  ('nakshatra', 'Ashwini', 0),
  ('nakshatra', 'Bharani', 1),
  ('nakshatra', 'Krittika', 2),
  ('nakshatra', 'Rohini', 3),
  ('nakshatra', 'Mrigashira', 4),
  ('nakshatra', 'Ardra', 5),
  ('nakshatra', 'Punarvasu', 6),
  ('nakshatra', 'Pushya', 7),
  ('nakshatra', 'Ashlesha', 8),
  ('nakshatra', 'Magha', 9),
  ('nakshatra', 'Purva Phalguni', 10),
  ('nakshatra', 'Uttara Phalguni', 11),
  ('nakshatra', 'Hasta', 12),
  ('nakshatra', 'Chitra', 13),
  ('nakshatra', 'Swati', 14),
  ('nakshatra', 'Vishakha', 15),
  ('nakshatra', 'Anuradha', 16),
  ('nakshatra', 'Jyeshtha', 17),
  ('nakshatra', 'Mula', 18),
  ('nakshatra', 'Purva Ashadha', 19),
  ('nakshatra', 'Uttara Ashadha', 20),
  ('nakshatra', 'Shravana', 21),
  ('nakshatra', 'Dhanishta', 22),
  ('nakshatra', 'Shatabhisha', 23),
  ('nakshatra', 'Purva Bhadrapada', 24),
  ('nakshatra', 'Uttara Bhadrapada', 25),
  ('nakshatra', 'Revati', 26),
  ('nakshatra_pada', '1', 0),
  ('nakshatra_pada', '2', 1),
  ('nakshatra_pada', '3', 2),
  ('nakshatra_pada', '4', 3),
  ('gana', 'Dev', 0),
  ('gana', 'Manushya', 1),
  ('gana', 'Rakshas', 2),
  ('yoni_animal', 'Horse (Ashwa)', 0),
  ('yoni_animal', 'Elephant (Gaja)', 1),
  ('yoni_animal', 'Sheep (Mesha)', 2),
  ('yoni_animal', 'Serpent (Sarpa)', 3),
  ('yoni_animal', 'Dog (Shwan)', 4),
  ('yoni_animal', 'Cat (Marjara)', 5),
  ('yoni_animal', 'Rat (Mushaka)', 6),
  ('yoni_animal', 'Cow (Go)', 7),
  ('yoni_animal', 'Buffalo (Mahisha)', 8),
  ('yoni_animal', 'Tiger (Vyaghra)', 9),
  ('yoni_animal', 'Deer (Mriga)', 10),
  ('yoni_animal', 'Monkey (Vanara)', 11),
  ('yoni_animal', 'Mongoose (Nakula)', 12),
  ('yoni_animal', 'Lion (Simha)', 13),
  ('manglik', 'Yes', 0),
  ('manglik', 'No', 1),
  ('manglik', 'Partial (Anshik)', 2),
  ('manglik', 'Don''t know', 3)
on conflict (kind, name) do nothing;

alter table public.lookup_astronomy enable row level security;
drop policy if exists lookup_astronomy_read on public.lookup_astronomy;
create policy lookup_astronomy_read on public.lookup_astronomy for select using (true);
grant select on public.lookup_astronomy to anon, authenticated;

commit;
