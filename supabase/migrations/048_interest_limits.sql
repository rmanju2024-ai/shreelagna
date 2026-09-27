-- Interest caps live on each sale plan. Welcome gift is 20 in app code.

alter table public.member_plans
  add column if not exists interest_limit int not null default 80;

update public.member_plans set interest_limit = 40 where code = 'silver' and interest_limit = 80;
update public.member_plans set interest_limit = 80 where code = 'gold';
update public.member_plans set interest_limit = 150 where code = 'platinum' and interest_limit = 80;
