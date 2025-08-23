-- =====================================
-- 数据库触发器
-- =====================================

-- =====================================
-- 1. 自动创建用户 profile 的触发器
-- =====================================
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, username, email, tenant_id, role)
  values (
    new.id,
    coalesce(
      new.raw_user_meta_data->>'username', 
      new.raw_user_meta_data->>'full_name',
      'user_' || substr(new.id::text, 1, 8)
    ),
    new.email,
    null,  -- 默认没有租户
    'student'  -- 默认角色
  );
  return new;
end;
$$ language plpgsql security definer;

-- 创建触发器
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- =====================================
-- 2. 自动创建用户订阅的触发器
-- =====================================
create or replace function public.handle_new_subscription()
returns trigger as $$
begin
  insert into public.subscriptions (user_id, plan_id, credits, expires_at)
  select 
    new.id, 
    p.id, 
    p.credits, 
    now() + interval '1 day' * p.duration_days
  from public.plans p
  where p.name = 'free';
  return new;
end;
$$ language plpgsql security definer;

-- 创建触发器
drop trigger if exists on_profile_created on public.profiles;
create trigger on_profile_created
  after insert on public.profiles
  for each row execute procedure public.handle_new_subscription();
