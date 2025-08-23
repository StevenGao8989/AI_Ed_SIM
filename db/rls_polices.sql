-- =====================================
-- 启用 RLS（Row Level Security）
-- =====================================
alter table tenants enable row level security;
alter table profiles enable row level security;
alter table plans enable row level security;
alter table subscriptions enable row level security;
alter table dsl_records enable row level security;
alter table explanations enable row level security;
alter table credits_log enable row level security;
alter table usage_log enable row level security;

-- =====================================
-- tenants (租户表)
-- =====================================
drop policy if exists "Users can view their tenant" on tenants;

create policy "Users can view their tenant"
  on tenants
  for select
  using (
    id = (select tenant_id from profiles where id = auth.uid())
  );

-- =====================================
-- profiles (用户扩展表)
-- =====================================
drop policy if exists "Users can view their own profile" on profiles;
drop policy if exists "Users can update their own profile" on profiles;

create policy "Users can view their own profile"
  on profiles
  for select
  using (id = auth.uid());

create policy "Users can update their own profile"
  on profiles
  for update
  using (id = auth.uid());

-- =====================================
-- plans (套餐表)
-- 所有人可读，只有 service_role 或 admin 可修改
-- =====================================
drop policy if exists "Anyone can view plans" on plans;
drop policy if exists "Admins can manage plans" on plans;

create policy "Anyone can view plans"
  on plans
  for select
  using (true);

create policy "Admins can manage plans"
  on plans
  for all
  using (
    exists (
      select 1 from profiles
      where profiles.id = auth.uid()
      and profiles.role = 'admin'
    )
  );

-- =====================================
-- subscriptions (订阅表)
-- =====================================
drop policy if exists "Users can view their subscriptions" on subscriptions;

create policy "Users can view their subscriptions"
  on subscriptions
  for select
  using (user_id = auth.uid());

-- =====================================
-- dsl_records (DSL 存储表)
-- =====================================
drop policy if exists "Users can view their own or tenant DSL" on dsl_records;
drop policy if exists "Users can insert their own DSL" on dsl_records;

create policy "Users can view their own or tenant DSL"
  on dsl_records
  for select
  using (
    user_id = auth.uid()
    or tenant_id = (select tenant_id from profiles where id = auth.uid())
  );

create policy "Users can insert their own DSL"
  on dsl_records
  for insert
  with check (user_id = auth.uid());

-- =====================================
-- explanations (解释表)
-- =====================================
drop policy if exists "Users can view their own or tenant explanations" on explanations;

create policy "Users can view their own or tenant explanations"
  on explanations
  for select
  using (
    dsl_id in (
      select id from dsl_records
      where user_id = auth.uid()
      or tenant_id = (select tenant_id from profiles where id = auth.uid())
    )
  );

-- =====================================
-- credits_log (积分日志表)
-- =====================================
drop policy if exists "Users can view their own credits log" on credits_log;
drop policy if exists "Users can insert their own credits log" on credits_log;

create policy "Users can view their own credits log"
  on credits_log
  for select
  using (user_id = auth.uid());

create policy "Users can insert their own credits log"
  on credits_log
  for insert
  with check (user_id = auth.uid());

-- =====================================
-- usage_log (使用日志表)
-- =====================================
drop policy if exists "Users can view their own usage log" on usage_log;
drop policy if exists "Users can insert their own usage log" on usage_log;

create policy "Users can view their own usage log"
  on usage_log
  for select
  using (user_id = auth.uid());

create policy "Users can insert their own usage log"
  on usage_log
  for insert
  with check (user_id = auth.uid());
