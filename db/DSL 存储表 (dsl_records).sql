-- =====================================
-- 5. DSL 存储表 (dsl_records)
-- =====================================
create table if not exists dsl_records (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    tenant_id uuid references tenants(id) on delete cascade,
    dsl_json jsonb not null,              -- 存放 DSL 数据
    schema_version text default 'v1',     -- DSL 版本
    created_at timestamp with time zone default now()
);