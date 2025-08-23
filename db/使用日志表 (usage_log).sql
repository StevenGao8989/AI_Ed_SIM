-- 8. 使用日志表 (usage_log)
-- =====================================
create table if not exists usage_log (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references auth.users(id) on delete cascade,
    endpoint text not null,   -- 调用的 API
    payload jsonb,            -- 输入参数
    result_status text,       -- success / fail
    created_at timestamp with time zone default now()
);