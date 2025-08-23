-- =====================================
-- 3. 套餐表 (plans)
-- =====================================
create table if not exists plans (
    id uuid primary key default gen_random_uuid(),
    name text unique not null,   -- free, pro, enterprise
    price numeric not null default 0,
    credits int not null default 100,
    duration_days int not null default 30, -- 套餐有效期（天）
    created_at timestamp with time zone default now()
);

-- 预设套餐
insert into plans (name, price, credits, duration_days)
values
('free', 0, 100, 30),
('pro', 20, 1000, 30),
('enterprise', 100, 10000, 365)
on conflict (name) do nothing;