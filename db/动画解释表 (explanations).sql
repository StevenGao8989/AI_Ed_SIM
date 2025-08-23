-- =====================================
-- 6. 动画解释表 (explanations)
-- =====================================
create table if not exists explanations (
    id uuid primary key default gen_random_uuid(),
    dsl_id uuid references dsl_records(id) on delete cascade,
    content text not null,   -- AI 生成的解释（文字/公式）
    lang text default 'zh',  -- 支持多语言
    created_at timestamp with time zone default now()
);