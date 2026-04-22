# Internal Platform 项目缺陷评审报告

> 审查日期: 2026-04-22  
> 测试环境: http://192.168.1.251:3201 (API: :3101)  
> 审查方法: API 端点测试 + 代码审查 + 数据库结构比对

---

## 一、严重缺陷 (P0 - 功能完全不可用)

### 1. 【Dashboard】首页报500错误
- **现象**: `GET /dashboard` → `internal_server_error`
- **根因**: 代码查询了不存在的表名
  - `ledger_transactions` → 实际表名 `transactions`
  - `pd_projects` → 实际表名 `projects`，且无 `project_status` 字段（实际是 `stage`）
- **文件**: `apps/api/src/modules/dashboard/index.ts:20,25`
- **影响**: 用户登录后首页直接白屏/报错

### 2. 【Product Dev】产品开发模块完全不可用
- **现象**: `GET /product-dev/projects` → `Table 'product_dev_projects' doesn't exist`
- **根因**: 代码查询 `product_dev_projects` 表，但数据库中实际表名是 `projects`
- **文件**: `apps/api/src/modules/product-dev/repository/product-dev.repository.ts`
- **影响**: 项目列表、创建、编辑、详情页全部不可用。看板页、完整创建页均失败
- **字段不匹配清单**:
  | 代码中字段名 | 数据库实际字段名 |
  |---|---|
  | `product_name` | `name` |
  | `developer_name` | 不存在 |
  | `owner_name` | 不存在（只有 `owner_id` INT） |
  | `target_platform` | 不存在 |
  | `estimated_cost` | 不存在 |
  | `gross_margin_target` | 不存在 |
  | `project_status` | `stage` (ENUM) |
  | `project_code` | 不存在 |

### 3. 【Reconciliation】对账模块列表页全部不可用
- **现象**: 四个列表页均返回 `Table doesn't exist`
- **根因**: 代码查询的表名 vs 数据库实际表名:
  | 代码中表名 | 数据库实际表名 |
  |---|---|
  | `purchase_orders` | `lx_purchase_orders` |
  | `payment_requests` | `lx_payment_requests` |
  | `delivery_orders` | `lx_delivery_orders` |
  | `invoice_records` | `lx_invoices` |
  | `invoice_purchase_relations` | `recon_relations` |
  | `invoice_payment_request_relations` | 不存在 |
  | `invoice_delivery_relations` | 不存在 |
- **文件**: `apps/api/src/modules/reconciliation/repository/reconciliation.repository.ts`
- **影响**: 采购单、请款单、发货单、发票列表页全部报错；关联关系、推荐、告警、报表均不可用
- **附加问题**: 即使修正表名，列的字段名也大量不匹配（代码期望 `invoice_status`, `reminder_disabled` 等列，但 lx_xxx 表的实际列完全不同）

### 4. 【Permissions】权限表不存在
- **现象**: `GET /permissions` → `Table 'permissions' doesn't exist`
- **根因**: 没有任何 migration 创建 `permissions` 表
- **文件**: `apps/api/src/modules/users/repository/users.repository.ts:281`
- **影响**: 角色权限配置完全不可用（角色页面的"权限"按钮点击后空白）

### 5. 【Saved Views】字段名不匹配
- **现象**: `GET /saved-views` → `Unknown column 'module_key'`
- **根因**: 代码查询 `module_key`、`view_name`、`view_config_json`，但数据库实际字段为 `module`、`name`、`config`
- **文件**: `apps/api/src/modules/saved-views/repository/saved-views.repository.ts`
- **字段映射**:
  | 代码中字段 | 数据库实际字段 |
  |---|---|
  | `module_key` | `module` |
  | `view_name` | `name` |
  | `view_config_json` | `config` |

---

## 二、中等缺陷 (P1 - 部分功能受影响)

### 6. 【Departments】查询报 TIMESTAMP 错误
- **现象**: `GET /departments` → `Incorrect TIMESTAMP value: '0000-00-00 00:00:00'`
- **根因**: SQL 条件 `WHERE deleted_at IS NULL OR deleted_at = '0000-00-00 00:00:00'` 在 strict mode 下不合法
- **文件**: `apps/api/src/modules/users/repository/users.repository.ts:177`
- **修复**: 改为 `WHERE deleted_at IS NULL`
- **影响**: 部门管理页面无法加载列表；新建用户时部门下拉框为空

### 7. 【Create Transaction】account_id 不能为空
- **现象**: `POST /ledger/transactions` → `Column 'account_id' cannot be null`
- **根因**: `transactions.account_id` 是 `NOT NULL`，但创建流水时未验证 `accountId` 必填
- **文件**: `apps/api/src/modules/ledger/service/ledger.service.ts` (createTransaction)
- **影响**: 新建流水如果不选账户会直接数据库报错（用户体验差）

### 8. 【User Dropdown】其他页面用户选择不可下拉
- **现象**: 产品开发表单中"开发人"、"负责人"字段是纯文本 Input 而非 Select 下拉框
- **根因**: `ProjectFormPage.tsx` 和 `ProjectListPage.tsx` 中使用 `<Input>` 而非用户选择器
- **影响**: 无法从已有用户中选择，容易输入不一致的值
- **建议**: 需要做一个通用的用户选择组件，调用 `GET /users` 获取用户列表作为下拉选项

### 9. 【Settings Tab 标签错误】
- **现象**: Settings 页第二个 Tab 标签显示"物流默认值"，但内容是领星凭证配置
- **文件**: `apps/web/src/pages/settings/SettingsPage.tsx:275`
- **代码**: `{ key: 'shipping', label: '物流默认值', children: <LingxingConfigTab /> }` 应改为 `label: '领星凭证'`

### 10. 【Dashboard 表名 audit_logs】
- **现象**: Dashboard 查询 `audit_logs` 时用了 `module` 和 `entity_type` 字段
- **数据库实际**: `audit_logs` 表需确认是否存在及字段名是否匹配
- **影响**: 如果字段不匹配，最近动态会为空或报错

### 11. 【Sync Jobs Tab 字段映射】
- **现象**: SyncJobsTab 前端期望字段 `jobKey`/`jobName`/`cronExpr`/`lastRunAt`/`nextRunAt`
- **后端**: `GET /sync-jobs` 直接返回 `name`, `job_type`, `status`, `last_run_at` 等原始字段
- **影响**: 同步任务表格中"任务"和"键名"列可能显示空

---

## 三、低等缺陷 (P2 - 可用但体验不佳)

### 12. 前端 catch 静默吞错误
- 多处 `catch { /* ignore */ }` 导致 API 报错时用户完全无反馈
- **涉及文件**: `ProjectListPage.tsx`, `ProjectDetailPage.tsx`, `DashboardPage.tsx` 等
- **建议**: 至少加 `console.error` 或 `message.error`

### 13. ProjectDetailPage 请求子资源路径错误
- 代码请求 `/product-dev/projects/${id}/samples`、`/quotes`、`/profit-calculations`、`/sync-records`
- 后端路由无这些嵌套路径——后端只有 `/product-dev/samples`、`/product-dev/quotes` 等顶级路径
- **影响**: 详情页的打样、报价、利润测算、同步记录 Tab 全部为空

### 14. 【Notification 表字段】
- Dashboard 查询 `notifications WHERE type = 'approval'`，需确认 `type` 字段是否存在

---

## 四、汇总

| 严重度 | 数量 | 模块 |
|--------|------|------|
| P0 严重 | 5 | Dashboard, Product Dev, Reconciliation (4页), Permissions, Saved Views |
| P1 中等 | 6 | Departments, Transaction创建, User Dropdown, Settings标签, Dashboard字段, SyncJobs字段 |
| P2 轻微 | 3 | 静默catch, 详情页子路径, Notification字段 |

## 五、核心根因

**代码层与数据库层的表名/字段名严重脱节。** 存在两套命名体系：
- **Migration SQL** (实际 DB): `projects`, `transactions`, `lx_purchase_orders`, `recon_relations`, `saved_views(module, name, config)`
- **Service/Repository 代码**: `product_dev_projects`, `ledger_transactions`, `purchase_orders`, `invoice_purchase_relations`, `saved_views(module_key, view_name, view_config_json)`

这说明代码和数据库的开发不是同步进行的，需要 **选择一方作为基准统一对齐**。

## 六、推荐修复策略

**方案A: 以数据库 migration 为准，修改 Service/Repository 代码（推荐）**
- 优点：不需要改数据库，已有数据不受影响
- 工作量：修改 ~5 个 repository 文件 + dashboard 的 SQL 查询

**方案B: 以代码为准，创建新的 migration 修改表名/添加字段**
- 风险：可能丢失已有数据，需要数据迁移

建议选择 **方案A**。
