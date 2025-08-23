# ChatTutor 数据库结构说明

## 📁 文件结构

本目录包含 ChatTutor 平台的所有数据库相关文件，按功能模块化组织：

### 🗄️ 表结构文件
- **租户表 (tenants).sql** - 租户信息表（学校、公司、个人）
- **用户扩展表 (profiles).sql** - 用户扩展信息（用户名、邮箱、角色、租户）
- **套餐表 (plans).sql** - 服务套餐（free、pro、enterprise）
- **订阅表 (subscriptions).sql** - 用户订阅信息
- **DSL 存储表 (dsl_records).sql** - 存储 AI 生成的 DSL 数据
- **动画解释表 (explanations).sql** - 存储动画解释内容
- **积分消耗日志表 (credits_log).sql** - 记录积分消耗
- **使用日志表 (usage_log).sql** - 记录 API 使用情况

### 🔒 安全策略文件
- **rls_polices.sql** - 行级安全策略（RLS）设置

### ⚡ 触发器文件
- **triggers.sql** - 自动创建用户 profile 和订阅的触发器

### 🚀 执行文件
- **00_main.sql** - 主执行文件，按顺序执行所有模块

## 🚀 使用方法

### 方法 1：使用主执行文件（推荐）
在 Supabase SQL Editor 中执行：
```sql
\i 00_main.sql
```

### 方法 2：手动按顺序执行
1. 先执行表结构文件
2. 再执行 RLS 策略文件
3. 最后执行触发器文件

## ⚠️ 重要说明

1. **执行顺序**：必须按照主执行文件中的顺序执行，因为表之间有外键依赖关系
2. **现有项目**：如果是更新现有项目，请先备份数据库
3. **权限要求**：需要 Supabase 的 service_role 权限来创建触发器和策略

## 🔧 更新现有项目

如果你的 Supabase 项目中已经有表，但缺少某些字段，可以：

1. 执行 `用户扩展表 (profiles).sql` 来添加 username 和 email 字段
2. 执行 `triggers.sql` 来更新触发器函数
3. 执行 `rls_polices.sql` 来设置安全策略

## 📊 表关系图

```
tenants (租户)
    ↑
profiles (用户扩展) ← auth.users (认证用户)
    ↑                    ↑
subscriptions (订阅) ← plans (套餐)
    ↑
credits_log (积分日志)

dsl_records (DSL记录) ← profiles
    ↑
explanations (解释) ← usage_log (使用日志)
```

## 🆘 常见问题

**Q: 执行时出现外键错误？**
A: 请确保按照主执行文件中的顺序执行

**Q: 用户名重复怎么办？**
A: 系统会自动生成唯一的用户名，格式为 `user_xxxxxxxx`

**Q: 如何修改默认套餐？**
A: 编辑 `套餐表 (plans).sql` 文件中的 insert 语句
