-- ================================
-- ChatTutor 数据库主执行文件
-- 文件：00_main.sql
-- 功能：按顺序执行所有数据库模块
-- ================================

-- 注意：请按顺序执行以下文件，或直接执行此主文件

-- ================================
-- 执行顺序说明
-- ================================
-- 1. 租户表 (tenants).sql      - 创建租户表
-- 2. 用户扩展表 (profiles).sql - 创建用户扩展表
-- 3. 套餐表 (plans).sql        - 创建套餐表并插入默认数据
-- 4. 订阅表 (subscriptions).sql - 创建订阅表
-- 5. DSL 存储表 (dsl_records).sql - 创建 DSL 存储表
-- 6. 动画解释表 (explanations).sql - 创建动画解释表
-- 7. 积分消耗日志表 (credits_log).sql - 创建积分消耗日志表
-- 8. 使用日志表 (usage_log).sql - 创建使用日志表
-- 9. rls_polices.sql           - 设置行级安全策略
-- 10. triggers.sql              - 创建触发器

-- ================================
-- 重要提醒
-- ================================
-- 由于 Supabase SQL Editor 不支持 \i 命令，请手动复制粘贴以下文件内容：
-- 
-- 1. 先复制 "租户表 (tenants).sql" 的内容并执行
-- 2. 再复制 "用户扩展表 (profiles).sql" 的内容并执行
-- 3. 继续按顺序执行其他文件...
-- 4. 最后执行 rls_polices.sql 和 triggers.sql
-- 
-- 或者直接执行下面的快速修复 SQL

-- ================================
-- 快速修复 SQL（推荐）
-- ================================

-- 1. 创建租户表
CREATE TABLE IF NOT EXISTS tenants (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text NOT NULL,
    type text CHECK (type IN ('personal','school','enterprise')) DEFAULT 'personal',
    created_at timestamp with time zone DEFAULT now()
);

-- 2. 为 profiles 表添加缺失字段
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS username text,
ADD COLUMN IF NOT EXISTS email text;

-- 3. 创建用户名唯一索引
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_idx ON profiles(username);

-- 4. 创建套餐表
CREATE TABLE IF NOT EXISTS plans (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    name text UNIQUE NOT NULL,
    price numeric NOT NULL DEFAULT 0,
    credits int NOT NULL DEFAULT 100,
    duration_days int NOT NULL DEFAULT 30,
    created_at timestamp with time zone DEFAULT now()
);

-- 5. 插入默认套餐
INSERT INTO plans (name, price, credits, duration_days)
VALUES
('free', 0, 100, 30),
('pro', 20, 1000, 30),
('enterprise', 100, 10000, 365)
ON CONFLICT (name) DO NOTHING;

-- 6. 更新触发器函数
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, username, email, tenant_id, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    new.email,
    null,
    'student'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 7. 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ================================
-- 完成提示
-- ================================
SELECT 'ChatTutor 数据库快速修复完成！' as message;
SELECT '请检查以下内容：' as checklist;
SELECT '1. profiles 表已添加 username 和 email 字段' as item;
SELECT '2. 默认套餐已插入' as item;
SELECT '3. 触发器已设置（自动创建 profile）' as item;
