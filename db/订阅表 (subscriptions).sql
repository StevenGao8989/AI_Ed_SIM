-- =====================================
-- 4. 订阅表 (subscriptions)
-- =====================================
create table if not exists subscriptions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    plan_id uuid references plans(id),
    credits int not null,
    status text check (status in ('active','expired','canceled')) default 'active',
    started_at timestamp with time zone default now(),
    expires_at timestamp with time zone not null,
    created_at timestamp with time zone default now()
);