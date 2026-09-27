-- Form lookup lists. Run after 001–003 in the Supabase SQL editor.

begin;

create table if not exists public.lookup_states (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table if not exists public.lookup_cities (
  id uuid primary key default gen_random_uuid(),
  state_id uuid not null references public.lookup_states (id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  unique (state_id, name)
);

create table if not exists public.lookup_educations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table if not exists public.lookup_occupations (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table if not exists public.lookup_tongues (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table if not exists public.lookup_diets (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  sort_order int not null default 0
);

create table if not exists public.lookup_heights (
  cm int primary key check (cm between 120 and 220)
);

create table if not exists public.lookup_marital (
  value text primary key,
  label text not null,
  sort_order int not null default 0
);

insert into public.lookup_states (name, sort_order) values
  ('Andhra Pradesh', 0),
  ('Arunachal Pradesh', 1),
  ('Assam', 2),
  ('Bihar', 3),
  ('Chhattisgarh', 4),
  ('Goa', 5),
  ('Gujarat', 6),
  ('Haryana', 7),
  ('Himachal Pradesh', 8),
  ('Jharkhand', 9),
  ('Karnataka', 10),
  ('Kerala', 11),
  ('Madhya Pradesh', 12),
  ('Maharashtra', 13),
  ('Manipur', 14),
  ('Meghalaya', 15),
  ('Mizoram', 16),
  ('Nagaland', 17),
  ('Odisha', 18),
  ('Punjab', 19),
  ('Rajasthan', 20),
  ('Sikkim', 21),
  ('Tamil Nadu', 22),
  ('Telangana', 23),
  ('Tripura', 24),
  ('Uttar Pradesh', 25),
  ('Uttarakhand', 26),
  ('West Bengal', 27),
  ('Andaman and Nicobar Islands', 28),
  ('Chandigarh', 29),
  ('Dadra and Nagar Haveli and Daman and Diu', 30),
  ('Delhi', 31),
  ('Jammu and Kashmir', 32),
  ('Ladakh', 33),
  ('Lakshadweep', 34),
  ('Puducherry', 35),
  ('Other', 36)
on conflict (name) do nothing;

insert into public.lookup_tongues (name, sort_order) values
  ('English', 0),
  ('Assamese', 1),
  ('Bengali', 2),
  ('Bodo', 3),
  ('Dogri', 4),
  ('Gujarati', 5),
  ('Hindi', 6),
  ('Kannada', 7),
  ('Kashmiri', 8),
  ('Konkani', 9),
  ('Maithili', 10),
  ('Malayalam', 11),
  ('Manipuri', 12),
  ('Marathi', 13),
  ('Nepali', 14),
  ('Odia', 15),
  ('Punjabi', 16),
  ('Sanskrit', 17),
  ('Santali', 18),
  ('Sindhi', 19),
  ('Tamil', 20),
  ('Telugu', 21),
  ('Tulu', 22),
  ('Urdu', 23),
  ('Other', 24)
on conflict (name) do nothing;

insert into public.lookup_diets (name, sort_order) values
  ('Vegetarian', 0),
  ('Eggetarian', 1),
  ('Non-vegetarian', 2),
  ('Vegan', 3)
on conflict (name) do nothing;

insert into public.lookup_educations (name, sort_order) values
  ('10th', 0),
  ('12th', 1),
  ('Diploma', 2),
  ('ITI', 3),
  ('Graduate', 4),
  ('B.A.', 5),
  ('B.Com', 6),
  ('B.Sc', 7),
  ('B.E. / B.Tech', 8),
  ('BCA', 9),
  ('BBA', 10),
  ('B.Pharm', 11),
  ('B.Arch', 12),
  ('LL.B.', 13),
  ('MBBS', 14),
  ('BDS', 15),
  ('B.Ed', 16),
  ('Postgraduate', 17),
  ('M.A.', 18),
  ('M.Com', 19),
  ('M.Sc', 20),
  ('M.E. / M.Tech', 21),
  ('MBA', 22),
  ('MCA', 23),
  ('M.Pharm', 24),
  ('LL.M.', 25),
  ('MD / MS', 26),
  ('M.Phil', 27),
  ('Ph.D.', 28),
  ('CA', 29),
  ('CS', 30),
  ('CMA', 31)
on conflict (name) do nothing;

insert into public.lookup_occupations (name, sort_order) values
  ('Student', 0),
  ('Software professional', 1),
  ('Engineer', 2),
  ('Doctor', 3),
  ('Dentist', 4),
  ('Nurse', 5),
  ('Pharmacist', 6),
  ('Teacher', 7),
  ('Professor', 8),
  ('Government employee', 9),
  ('Bank employee', 10),
  ('Defence', 11),
  ('Police', 12),
  ('Lawyer', 13),
  ('Chartered accountant', 14),
  ('Company secretary', 15),
  ('Architect', 16),
  ('Designer', 17),
  ('Journalist', 18),
  ('Consultant', 19),
  ('Manager', 20),
  ('Business', 21),
  ('Self-employed', 22),
  ('Sales', 23),
  ('Marketing', 24),
  ('Agriculture', 25),
  ('Homemaker', 26),
  ('Looking for work', 27),
  ('Not working', 28)
on conflict (name) do nothing;

insert into public.lookup_marital (value, label, sort_order) values
  ('never_married', 'Never married', 0),
  ('divorced', 'Divorced', 1),
  ('widowed', 'Widowed', 2),
  ('awaiting_divorce', 'Awaiting divorce', 3)
on conflict (value) do nothing;

insert into public.lookup_heights (cm)
select gs from generate_series(140, 220) gs
on conflict do nothing;

insert into public.lookup_cities (state_id, name, sort_order)
select s.id, v.name, v.sort_order
from public.lookup_states s
join (values
  ('Andhra Pradesh', 'Visakhapatnam', 0),
  ('Andhra Pradesh', 'Vijayawada', 1),
  ('Andhra Pradesh', 'Guntur', 2),
  ('Andhra Pradesh', 'Nellore', 3),
  ('Andhra Pradesh', 'Kurnool', 4),
  ('Andhra Pradesh', 'Tirupati', 5),
  ('Andhra Pradesh', 'Rajahmundry', 6),
  ('Andhra Pradesh', 'Kakinada', 7),
  ('Andhra Pradesh', 'Anantapur', 8),
  ('Andhra Pradesh', 'Kadapa', 9),
  ('Arunachal Pradesh', 'Itanagar', 0),
  ('Arunachal Pradesh', 'Naharlagun', 1),
  ('Arunachal Pradesh', 'Tawang', 2),
  ('Arunachal Pradesh', 'Pasighat', 3),
  ('Arunachal Pradesh', 'Ziro', 4),
  ('Assam', 'Guwahati', 0),
  ('Assam', 'Dibrugarh', 1),
  ('Assam', 'Silchar', 2),
  ('Assam', 'Jorhat', 3),
  ('Assam', 'Tezpur', 4),
  ('Assam', 'Nagaon', 5),
  ('Assam', 'Tinsukia', 6),
  ('Bihar', 'Patna', 0),
  ('Bihar', 'Gaya', 1),
  ('Bihar', 'Bhagalpur', 2),
  ('Bihar', 'Muzaffarpur', 3),
  ('Bihar', 'Purnia', 4),
  ('Bihar', 'Darbhanga', 5),
  ('Bihar', 'Begusarai', 6),
  ('Bihar', 'Ara', 7),
  ('Chhattisgarh', 'Raipur', 0),
  ('Chhattisgarh', 'Bhilai', 1),
  ('Chhattisgarh', 'Bilaspur', 2),
  ('Chhattisgarh', 'Durg', 3),
  ('Chhattisgarh', 'Korba', 4),
  ('Chhattisgarh', 'Raigarh', 5),
  ('Chhattisgarh', 'Jagdalpur', 6),
  ('Goa', 'Panaji', 0),
  ('Goa', 'Margao', 1),
  ('Goa', 'Vasco da Gama', 2),
  ('Goa', 'Mapusa', 3),
  ('Goa', 'Ponda', 4),
  ('Gujarat', 'Ahmedabad', 0),
  ('Gujarat', 'Surat', 1),
  ('Gujarat', 'Vadodara', 2),
  ('Gujarat', 'Rajkot', 3),
  ('Gujarat', 'Bhavnagar', 4),
  ('Gujarat', 'Jamnagar', 5),
  ('Gujarat', 'Gandhinagar', 6),
  ('Gujarat', 'Anand', 7),
  ('Gujarat', 'Junagadh', 8),
  ('Haryana', 'Gurugram', 0),
  ('Haryana', 'Faridabad', 1),
  ('Haryana', 'Panipat', 2),
  ('Haryana', 'Ambala', 3),
  ('Haryana', 'Hisar', 4),
  ('Haryana', 'Karnal', 5),
  ('Haryana', 'Rohtak', 6),
  ('Haryana', 'Sonipat', 7),
  ('Haryana', 'Panchkula', 8),
  ('Himachal Pradesh', 'Shimla', 0),
  ('Himachal Pradesh', 'Dharamshala', 1),
  ('Himachal Pradesh', 'Mandi', 2),
  ('Himachal Pradesh', 'Solan', 3),
  ('Himachal Pradesh', 'Kullu', 4),
  ('Himachal Pradesh', 'Manali', 5),
  ('Himachal Pradesh', 'Hamirpur', 6),
  ('Jharkhand', 'Ranchi', 0),
  ('Jharkhand', 'Jamshedpur', 1),
  ('Jharkhand', 'Dhanbad', 2),
  ('Jharkhand', 'Bokaro', 3),
  ('Jharkhand', 'Hazaribagh', 4),
  ('Jharkhand', 'Deoghar', 5),
  ('Karnataka', 'Bengaluru', 0),
  ('Karnataka', 'Mysuru', 1),
  ('Karnataka', 'Mangaluru', 2),
  ('Karnataka', 'Hubballi', 3),
  ('Karnataka', 'Belagavi', 4),
  ('Karnataka', 'Kalaburagi', 5),
  ('Karnataka', 'Ballari', 6),
  ('Karnataka', 'Davangere', 7),
  ('Karnataka', 'Shivamogga', 8),
  ('Karnataka', 'Udupi', 9),
  ('Kerala', 'Thiruvananthapuram', 0),
  ('Kerala', 'Kochi', 1),
  ('Kerala', 'Kozhikode', 2),
  ('Kerala', 'Thrissur', 3),
  ('Kerala', 'Kollam', 4),
  ('Kerala', 'Kannur', 5),
  ('Kerala', 'Alappuzha', 6),
  ('Kerala', 'Kottayam', 7),
  ('Kerala', 'Palakkad', 8),
  ('Madhya Pradesh', 'Bhopal', 0),
  ('Madhya Pradesh', 'Indore', 1),
  ('Madhya Pradesh', 'Jabalpur', 2),
  ('Madhya Pradesh', 'Gwalior', 3),
  ('Madhya Pradesh', 'Ujjain', 4),
  ('Madhya Pradesh', 'Sagar', 5),
  ('Madhya Pradesh', 'Ratlam', 6),
  ('Madhya Pradesh', 'Satna', 7),
  ('Maharashtra', 'Mumbai', 0),
  ('Maharashtra', 'Pune', 1),
  ('Maharashtra', 'Nagpur', 2),
  ('Maharashtra', 'Nashik', 3),
  ('Maharashtra', 'Thane', 4),
  ('Maharashtra', 'Aurangabad', 5),
  ('Maharashtra', 'Solapur', 6),
  ('Maharashtra', 'Kolhapur', 7),
  ('Maharashtra', 'Navi Mumbai', 8),
  ('Maharashtra', 'Amravati', 9),
  ('Manipur', 'Imphal', 0),
  ('Manipur', 'Thoubal', 1),
  ('Manipur', 'Churachandpur', 2),
  ('Manipur', 'Bishnupur', 3),
  ('Meghalaya', 'Shillong', 0),
  ('Meghalaya', 'Tura', 1),
  ('Meghalaya', 'Jowai', 2),
  ('Meghalaya', 'Nongpoh', 3),
  ('Mizoram', 'Aizawl', 0),
  ('Mizoram', 'Lunglei', 1),
  ('Mizoram', 'Champhai', 2),
  ('Mizoram', 'Serchhip', 3),
  ('Nagaland', 'Kohima', 0),
  ('Nagaland', 'Dimapur', 1),
  ('Nagaland', 'Mokokchung', 2),
  ('Nagaland', 'Tuensang', 3),
  ('Odisha', 'Bhubaneswar', 0),
  ('Odisha', 'Cuttack', 1),
  ('Odisha', 'Rourkela', 2),
  ('Odisha', 'Puri', 3),
  ('Odisha', 'Sambalpur', 4),
  ('Odisha', 'Berhampur', 5),
  ('Odisha', 'Balasore', 6),
  ('Punjab', 'Ludhiana', 0),
  ('Punjab', 'Amritsar', 1),
  ('Punjab', 'Jalandhar', 2),
  ('Punjab', 'Patiala', 3),
  ('Punjab', 'Bathinda', 4),
  ('Punjab', 'Mohali', 5),
  ('Punjab', 'Pathankot', 6),
  ('Punjab', 'Hoshiarpur', 7),
  ('Rajasthan', 'Jaipur', 0),
  ('Rajasthan', 'Jodhpur', 1),
  ('Rajasthan', 'Udaipur', 2),
  ('Rajasthan', 'Kota', 3),
  ('Rajasthan', 'Ajmer', 4),
  ('Rajasthan', 'Bikaner', 5),
  ('Rajasthan', 'Alwar', 6),
  ('Rajasthan', 'Bhilwara', 7),
  ('Sikkim', 'Gangtok', 0),
  ('Sikkim', 'Namchi', 1),
  ('Sikkim', 'Gyalshing', 2),
  ('Sikkim', 'Mangan', 3),
  ('Tamil Nadu', 'Chennai', 0),
  ('Tamil Nadu', 'Coimbatore', 1),
  ('Tamil Nadu', 'Madurai', 2),
  ('Tamil Nadu', 'Tiruchirappalli', 3),
  ('Tamil Nadu', 'Salem', 4),
  ('Tamil Nadu', 'Tirunelveli', 5),
  ('Tamil Nadu', 'Erode', 6),
  ('Tamil Nadu', 'Vellore', 7),
  ('Tamil Nadu', 'Thoothukudi', 8),
  ('Tamil Nadu', 'Kanchipuram', 9),
  ('Telangana', 'Hyderabad', 0),
  ('Telangana', 'Warangal', 1),
  ('Telangana', 'Nizamabad', 2),
  ('Telangana', 'Karimnagar', 3),
  ('Telangana', 'Khammam', 4),
  ('Telangana', 'Ramagundam', 5),
  ('Tripura', 'Agartala', 0),
  ('Tripura', 'Udaipur', 1),
  ('Tripura', 'Dharmanagar', 2),
  ('Tripura', 'Kailashahar', 3),
  ('Uttar Pradesh', 'Lucknow', 0),
  ('Uttar Pradesh', 'Kanpur', 1),
  ('Uttar Pradesh', 'Varanasi', 2),
  ('Uttar Pradesh', 'Agra', 3),
  ('Uttar Pradesh', 'Prayagraj', 4),
  ('Uttar Pradesh', 'Noida', 5),
  ('Uttar Pradesh', 'Ghaziabad', 6),
  ('Uttar Pradesh', 'Meerut', 7),
  ('Uttar Pradesh', 'Bareilly', 8),
  ('Uttar Pradesh', 'Aligarh', 9),
  ('Uttar Pradesh', 'Gorakhpur', 10),
  ('Uttar Pradesh', 'Jhansi', 11),
  ('Uttarakhand', 'Dehradun', 0),
  ('Uttarakhand', 'Haridwar', 1),
  ('Uttarakhand', 'Nainital', 2),
  ('Uttarakhand', 'Haldwani', 3),
  ('Uttarakhand', 'Rishikesh', 4),
  ('Uttarakhand', 'Roorkee', 5),
  ('West Bengal', 'Kolkata', 0),
  ('West Bengal', 'Howrah', 1),
  ('West Bengal', 'Durgapur', 2),
  ('West Bengal', 'Asansol', 3),
  ('West Bengal', 'Siliguri', 4),
  ('West Bengal', 'Kharagpur', 5),
  ('West Bengal', 'Darjeeling', 6),
  ('Andaman and Nicobar Islands', 'Port Blair', 0),
  ('Andaman and Nicobar Islands', 'Diglipur', 1),
  ('Andaman and Nicobar Islands', 'Mayabunder', 2),
  ('Chandigarh', 'Chandigarh', 0),
  ('Dadra and Nagar Haveli and Daman and Diu', 'Daman', 0),
  ('Dadra and Nagar Haveli and Daman and Diu', 'Diu', 1),
  ('Dadra and Nagar Haveli and Daman and Diu', 'Silvassa', 2),
  ('Delhi', 'New Delhi', 0),
  ('Delhi', 'Delhi', 1),
  ('Delhi', 'Dwarka', 2),
  ('Delhi', 'Rohini', 3),
  ('Delhi', 'Saket', 4),
  ('Delhi', 'Karol Bagh', 5),
  ('Jammu and Kashmir', 'Srinagar', 0),
  ('Jammu and Kashmir', 'Jammu', 1),
  ('Jammu and Kashmir', 'Anantnag', 2),
  ('Jammu and Kashmir', 'Baramulla', 3),
  ('Jammu and Kashmir', 'Udhampur', 4),
  ('Ladakh', 'Leh', 0),
  ('Ladakh', 'Kargil', 1),
  ('Lakshadweep', 'Kavaratti', 0),
  ('Lakshadweep', 'Agatti', 1),
  ('Lakshadweep', 'Minicoy', 2),
  ('Puducherry', 'Puducherry', 0),
  ('Puducherry', 'Karaikal', 1),
  ('Puducherry', 'Mahe', 2),
  ('Puducherry', 'Yanam', 3),
  ('Other', 'Abroad', 0),
  ('Other', 'Gulf', 1),
  ('Other', 'Singapore', 2),
  ('Other', 'USA', 3),
  ('Other', 'UK', 4),
  ('Other', 'Canada', 5),
  ('Other', 'Australia', 6)
) as v(state_name, name, sort_order) on s.name = v.state_name
on conflict (state_id, name) do nothing;

alter table public.lookup_states enable row level security;
alter table public.lookup_cities enable row level security;
alter table public.lookup_educations enable row level security;
alter table public.lookup_occupations enable row level security;
alter table public.lookup_tongues enable row level security;
alter table public.lookup_diets enable row level security;
alter table public.lookup_heights enable row level security;
alter table public.lookup_marital enable row level security;

drop policy if exists lookup_states_read on public.lookup_states;
create policy lookup_states_read on public.lookup_states for select using (true);
drop policy if exists lookup_cities_read on public.lookup_cities;
create policy lookup_cities_read on public.lookup_cities for select using (true);
drop policy if exists lookup_educations_read on public.lookup_educations;
create policy lookup_educations_read on public.lookup_educations for select using (true);
drop policy if exists lookup_occupations_read on public.lookup_occupations;
create policy lookup_occupations_read on public.lookup_occupations for select using (true);
drop policy if exists lookup_tongues_read on public.lookup_tongues;
create policy lookup_tongues_read on public.lookup_tongues for select using (true);
drop policy if exists lookup_diets_read on public.lookup_diets;
create policy lookup_diets_read on public.lookup_diets for select using (true);
drop policy if exists lookup_heights_read on public.lookup_heights;
create policy lookup_heights_read on public.lookup_heights for select using (true);
drop policy if exists lookup_marital_read on public.lookup_marital;
create policy lookup_marital_read on public.lookup_marital for select using (true);

grant select on
  public.lookup_states,
  public.lookup_cities,
  public.lookup_educations,
  public.lookup_occupations,
  public.lookup_tongues,
  public.lookup_diets,
  public.lookup_heights,
  public.lookup_marital
to anon, authenticated;

commit;
