-- Extra unique-family slots from the Five more add-on. Does not replace the live plan.

alter table public.app_users
  add column if not exists interest_bonus int not null default 0;

insert into public.member_plans (code, name, tagline, months, price_inr, featured, for_sale, sort_order, perks, interest_limit)
values (
  'plus5',
  'Five more',
  'Add five extra unique families to the cover you already have.',
  1,
  499,
  false,
  true,
  4,
  array['5 extra unique families', 'Adds on to your current cover', 'Does not replace your plan'],
  5
)
on conflict (code) do update
set
  name = excluded.name,
  tagline = excluded.tagline,
  price_inr = excluded.price_inr,
  for_sale = true,
  sort_order = 4,
  perks = excluded.perks,
  interest_limit = 5;
