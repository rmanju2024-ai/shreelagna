-- Replace income bands with one category every ₹5 lakh.

begin;

delete from public.lookup_incomes;

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
  ('Above ₹1 crore', 21);

commit;
