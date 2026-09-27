-- House details: specific education, extra cities, work, income, partner hope.
-- Run in the Supabase SQL editor after 001–006.

begin;

alter table public.profiles add column if not exists employer_name text;
alter table public.profiles add column if not exists pref_education text;
alter table public.profiles add column if not exists pref_occupation text;
alter table public.profiles add column if not exists pref_marital text;
alter table public.profiles add column if not exists pref_state text;
alter table public.profiles add column if not exists pref_notes text;

delete from public.lookup_educations where name in ('Graduate', 'Postgraduate');
insert into public.lookup_educations (name, sort_order) values
  ('BAMS', 16),
  ('BHMS', 16)
on conflict (name) do nothing;

create table if not exists public.lookup_incomes (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);
create table if not exists public.lookup_employed (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);
create table if not exists public.lookup_families (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

insert into public.lookup_incomes (name, sort_order) values
  ('Prefer not to say', 0),
  ('Up to ₹5 lakh', 1),
  ('₹5–10 lakh', 2),
  ('₹10–15 lakh', 3),
  ('₹15–20 lakh', 4),
  ('₹20–25 lakh', 5),
  ('₹25–30 lakh', 6),
  ('₹30–35 lakh', 7),
  ('₹35–40 lakh', 8),
  ('₹40–45 lakh', 9),
  ('₹45–50 lakh', 10),
  ('₹50–55 lakh', 11),
  ('₹55–60 lakh', 12),
  ('₹60–65 lakh', 13),
  ('₹65–70 lakh', 14),
  ('₹70–75 lakh', 15),
  ('₹75–80 lakh', 16),
  ('₹80–85 lakh', 17),
  ('₹85–90 lakh', 18),
  ('₹90–95 lakh', 19),
  ('₹95 lakh–₹1 crore', 20),
  ('Above ₹1 crore', 21)
on conflict (name) do nothing;

insert into public.lookup_employed (name, sort_order) values
  ('Private company', 0),
  ('Government', 1),
  ('Defence', 2),
  ('Public sector', 3),
  ('Business / self-employed', 4),
  ('Not working', 5)
on conflict (name) do nothing;

insert into public.lookup_families (name, sort_order) values
  ('Nuclear', 0),
  ('Joint', 1),
  ('Other', 2)
on conflict (name) do nothing;

insert into public.lookup_cities (state_id, name, sort_order)
select s.id, v.name, v.sort_order
from public.lookup_states s
join (values
  ('Tamil Nadu', 'Tiruppur', 10),
  ('Tamil Nadu', 'Hosur', 11),
  ('Tamil Nadu', 'Nagercoil', 12),
  ('Tamil Nadu', 'Thanjavur', 13),
  ('Tamil Nadu', 'Dindigul', 14),
  ('Tamil Nadu', 'Karur', 15),
  ('Tamil Nadu', 'Namakkal', 16),
  ('Tamil Nadu', 'Cuddalore', 17),
  ('Tamil Nadu', 'Kumbakonam', 18),
  ('Tamil Nadu', 'Pollachi', 19),
  ('Tamil Nadu', 'Rajapalayam', 20),
  ('Tamil Nadu', 'Sivakasi', 21),
  ('Tamil Nadu', 'Theni', 22),
  ('Tamil Nadu', 'Villupuram', 23),
  ('Tamil Nadu', 'Tiruvannamalai', 24),
  ('Tamil Nadu', 'Avadi', 25),
  ('Tamil Nadu', 'Tambaram', 26),
  ('Tamil Nadu', 'Chengalpattu', 27),
  ('Tamil Nadu', 'Pudukkottai', 28),
  ('Tamil Nadu', 'Nagapattinam', 29),
  ('Karnataka', 'Tumakuru', 10),
  ('Karnataka', 'Hassan', 11),
  ('Karnataka', 'Mandya', 12),
  ('Karnataka', 'Raichur', 13),
  ('Karnataka', 'Bidar', 14),
  ('Karnataka', 'Vijayapura', 15),
  ('Karnataka', 'Chitradurga', 16),
  ('Karnataka', 'Kolar', 17),
  ('Karnataka', 'Dharwad', 18),
  ('Maharashtra', 'Kalyan', 10),
  ('Maharashtra', 'Vasai', 11),
  ('Maharashtra', 'Virar', 12),
  ('Maharashtra', 'Pimpri-Chinchwad', 13),
  ('Maharashtra', 'Nanded', 14),
  ('Maharashtra', 'Sangli', 15),
  ('Maharashtra', 'Jalgaon', 16),
  ('Maharashtra', 'Akola', 17),
  ('Maharashtra', 'Latur', 18),
  ('Maharashtra', 'Ahmednagar', 19),
  ('Telangana', 'Secunderabad', 6),
  ('Telangana', 'Nalgonda', 7),
  ('Telangana', 'Mahbubnagar', 8),
  ('Telangana', 'Adilabad', 9),
  ('Andhra Pradesh', 'Ongole', 10),
  ('Andhra Pradesh', 'Eluru', 11),
  ('Andhra Pradesh', 'Vizianagaram', 12),
  ('Andhra Pradesh', 'Srikakulam', 13),
  ('Andhra Pradesh', 'Chittoor', 14),
  ('Kerala', 'Malappuram', 9),
  ('Kerala', 'Kasaragod', 10),
  ('Kerala', 'Pathanamthitta', 11),
  ('Delhi', 'Janakpuri', 6),
  ('Delhi', 'Lajpat Nagar', 7),
  ('Delhi', 'Mayur Vihar', 8),
  ('Delhi', 'Pitampura', 9),
  ('Delhi', 'Vasant Kunj', 10),
  ('Uttar Pradesh', 'Moradabad', 12),
  ('Uttar Pradesh', 'Saharanpur', 13),
  ('Uttar Pradesh', 'Mathura', 14),
  ('Uttar Pradesh', 'Ayodhya', 15),
  ('Uttar Pradesh', 'Greater Noida', 16),
  ('Gujarat', 'Bharuch', 9),
  ('Gujarat', 'Navsari', 10),
  ('Gujarat', 'Vapi', 11),
  ('West Bengal', 'Bardhaman', 7),
  ('West Bengal', 'Malda', 8),
  ('West Bengal', 'Haldia', 9),
  ('Rajasthan', 'Bharatpur', 8),
  ('Rajasthan', 'Sikar', 9),
  ('Punjab', 'Moga', 8),
  ('Punjab', 'Phagwara', 9),
  ('Haryana', 'Yamunanagar', 9),
  ('Haryana', 'Rewari', 10)
) as v(state, name, sort_order) on s.name = v.state
on conflict (state_id, name) do nothing;

alter table public.lookup_incomes enable row level security;
alter table public.lookup_employed enable row level security;
alter table public.lookup_families enable row level security;
drop policy if exists lookup_incomes_read on public.lookup_incomes;
create policy lookup_incomes_read on public.lookup_incomes for select using (true);
drop policy if exists lookup_employed_read on public.lookup_employed;
create policy lookup_employed_read on public.lookup_employed for select using (true);
drop policy if exists lookup_families_read on public.lookup_families;
create policy lookup_families_read on public.lookup_families for select using (true);

grant select on public.lookup_incomes, public.lookup_employed, public.lookup_families to anon, authenticated;
grant select, insert, update on public.profiles to authenticated;

commit;
