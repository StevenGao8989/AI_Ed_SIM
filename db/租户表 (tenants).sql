-- =====================================
-- 1. 租户表 (tenants)
-- =====================================
create table if not exists tenants (
    id uuid primary key default gen_random_uuid(),
    name text not null,  -- 租户名称（学校、公司、个人）
    type text check (type in ('personal','school','enterprise')) default 'personal',
    created_at timestamp with time zone default now()
);