-- =====================================
-- 2. 用户扩展表 (profiles)
-- =====================================
create table if not exists profiles (
    id uuid primary key references auth.users(id) on delete cascade,
    username text unique not null,  -- 用户名，唯一
    email text not null,            -- 邮箱地址
    tenant_id uuid references tenants(id) on delete set null,
    role text check (role in ('student','teacher','admin')) default 'student',
    created_at timestamp with time zone default now()
);

-- 创建用户名唯一索引
create unique index if not exists profiles_username_idx on profiles(username);
