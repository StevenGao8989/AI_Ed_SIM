-- =====================================
-- 7. 积分消耗日志表 (credits_log)
-- =====================================
create table if not exists credits_log (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    subscription_id uuid references subscriptions(id) on delete set null,
    action text not null,   -- parse, simulate, render, explain
    cost int not null default 1,
    created_at timestamp with time zone default now()
);