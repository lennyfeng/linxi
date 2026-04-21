# Frontend Gap Analysis: Design Document vs Current Implementation

Generated: 2026-04-21

Source: `E:\work\linxi\linxi\aiDoc\页面设计文档\完整站点页面设计提取.md`

---

## Summary

Design document specifies **60+ pages** across 5 modules with multi-level navigation.
Current implementation has **5 HTML files**, each compressing an entire module into a single-page prototype.

**Overall completion: ~15%** — basic CRUD scaffolding exists but missing most business pages, navigation, and UX flows.

---

## 1. Dashboard / Workspace (工作台)

### Design Requires (§3.2)
| Page | Status |
|------|--------|
| 工作台首页 (待办/公告/快捷入口/提醒) | 🔴 Missing |
| 通知中心 | 🔴 Missing |
| 我的待办 | 🔴 Missing |

### Current (`dashboard.html`)
- Shows system health status (API/DB/Modules)
- Shows module cards with stats (transactions, accounts, etc.)
- **Missing**: 我的待办、最近操作、系统公告、同步异常提醒、审批提醒、导入待确认提醒、未勾稽提醒

---

## 2. Users & Permissions (统一用户权限)

### Design Requires (§4.2) — 11 pages
| Page | Status |
|------|--------|
| 权限首页 (统计概览) | 🔴 Missing |
| 登录入口页 (飞书+密码) | 🟡 Partial — only "Login" button, no UI |
| 用户管理页 (列表/搜索/筛选) | 🟡 Partial — basic table only |
| 用户详情页 (基础+角色+日志+变更) | 🟡 Partial — right panel shows basic info |
| 部门管理页 (部门树+成员+负责人) | 🟡 Partial — flat list, no tree |
| 角色管理页 (列表/新建/复制/编辑) | 🟡 Partial — list only |
| 角色详情/配置页 (权限矩阵) | 🔴 Missing |
| 权限管理页 (权限项定义) | 🟡 Partial — flat list only |
| 管理员账号管理页 | 🔴 Missing |
| 日志页 (登录/权限变更/状态) | 🔴 Missing |
| 旧页面接入页 | 🔴 Missing |

### Current (`admin.html` + `admin.js`)
- 4 tabs: Users / Roles / Departments / Permissions
- Left: list table, Right: detail panel
- **Missing**: 部门树、角色权限配置、用户编辑表单、搜索筛选、日志、跨页跳转

---

## 3. Ledger (新流水记账)

### Design Requires (§5.2) — 18 pages
| Page | Status |
|------|--------|
| 记账首页 (收支概览/趋势/快捷入口) | 🔴 Missing (index.html is transaction list, not dashboard) |
| 流水明细页 | 🟡 Partial — table + filters exist |
| 流水详情页 | 🟡 Partial — right panel |
| 新增/编辑流水页 | 🟢 Done — single + multi entry |
| 账户管理页 | 🔴 Missing (only left sidebar overview) |
| 账户详情页 | 🔴 Missing |
| 分类标签管理页 | 🔴 Missing |
| 分类详情页 | 🔴 Missing |
| 往来单位/供应商页 | 🔴 Missing |
| 往来单位详情页 | 🔴 Missing |
| 项目分类页 | 🔴 Missing |
| 成员角色页 | 🔴 Missing |
| 报销管理页 | 🔴 Missing |
| 导入批次页 | 🟡 Partial — batch list in index.html |
| 导入确认页 | 🟡 Partial — inline panel in index.html |
| 匹配结果页 | 🔴 Missing (only detail-level match) |
| 收支报表页 | 🔴 Missing |
| 迁移中心页 | 🔴 Missing |

### Current (`index.html` + `app.js`)
- All-in-one single page: filters + transaction list + detail + new entry + multi entry + import confirm + import batches
- **Exists**: transaction CRUD, filters, saved views, account overview sidebar, attachment upload, match records
- **Missing**: 独立的账户管理/详情、分类管理/详情、往来单位、报销管理、报表、迁移中心、收支趋势图、记账首页 dashboard

### Key UX Gaps (§5.3)
- ❌ No cross-page navigation (e.g., click account → account detail page)
- ❌ No summary dashboard with charts (收支趋势、分类排行)
- ❌ No dedicated report views
- ❌ No reimbursement workflow (批量报销提交、飞书审批单号)
- ❌ Matching results page not independent

---

## 4. Reconciliation (勾稽系统)

### Design Requires (§6.2) — 10+ pages
| Page | Status |
|------|--------|
| 勾稽首页 (统计/未开票/异常提醒) | 🔴 Missing |
| 采购单列表页 | 🟡 Partial — tab in single page |
| 采购单详情页 | 🟡 Partial — right panel |
| 请款单列表页 | 🟡 Partial |
| 请款单详情页 | 🟡 Partial |
| 发货单列表页 | 🟡 Partial |
| 发货单详情页 | 🟡 Partial |
| 发票列表页 | 🟡 Partial |
| 发票详情页 | 🟡 Partial |
| 关系维护页 (推荐/拆分/确认) | 🔴 Missing |
| 双向追溯页 (链路图/树状) | 🔴 Missing |
| 提醒清单页 | 🔴 Missing |
| 报表页 (发票对应明细/供应商汇总) | 🔴 Missing |

### Current (`reconciliation.html` + `reconciliation.js`)
- Overview cards (matched/partial/pending)
- 4 tabs: Purchase / Payment / Delivery / Invoice
- List + detail panels with relation add/delete
- **Missing**: 独立详情页、关系维护页、双向追溯(链路图)、提醒清单、报表、勾稽首页 dashboard

---

## 5. Product Development (新品开发)

### Design Requires (§7.2) — 12 pages
| Page | Status |
|------|--------|
| 新品首页 (状态统计) | 🔴 Missing |
| 进度看板页 (Kanban by status) | 🔴 Missing |
| 项目列表页 | 🟡 Partial — basic table |
| 项目详情页 | 🟡 Partial — right panel with tabs |
| 新建/编辑项目页 | 🔴 Missing |
| 打样管理页 | 🔴 Missing (sub-list in detail) |
| 报价管理页 | 🔴 Missing (sub-list in detail) |
| 利润试算页 | 🔴 Missing (sub-list in detail) |
| 审批中心页 | 🔴 Missing |
| 领星同步页 | 🔴 Missing (sub-list in detail) |
| SPU/SKU 归属页 | 🔴 Missing |
| 基础分类页 | 🔴 Missing |

### Current (`product-dev.html` + `product-dev.js`)
- Left: project list table
- Right: project detail with workflow actions (approve/reject/sync check), sub-lists for quotes/samples/profit/sync
- **Missing**: Kanban 看板、新建/编辑表单、独立打样/报价/利润页面、审批中心、领星同步独立页、SPU/SKU、筛选器

---

## 6. Cross-Module Navigation (§8)

### Design Requires
- 全站一级导航: 工作台 / 权限 / 记账 / 勾稽 / 新品
- 每个模块内 3 层页面层级
- 跨模块跳转 (用户→角色→权限, 流水→账户→分类, etc.)

### Current
- Each page has top-bar links (`Dashboard / Ledger / Reconciliation / Product Dev / Admin`)
- ❌ No unified sidebar/header navigation
- ❌ No breadcrumb navigation
- ❌ No cross-module deep links (e.g., click user → user detail → role detail)
- ❌ All content crammed into single pages per module

---

## 7. Missing Global Infrastructure

| Item | Status |
|------|--------|
| Unified layout/shell (sidebar + header) | 🔴 Missing |
| Router (SPA or MPA routing) | 🔴 Missing (dev-server serves static files) |
| Breadcrumb navigation | 🔴 Missing |
| Search bar (global) | 🔴 Missing |
| Notification/toast system | 🔴 Missing |
| Loading/skeleton states | 🔴 Missing |
| Error boundary/fallback | 🔴 Missing |
| Responsive mobile layout | 🟡 Partial (basic media queries) |
| Dark mode | 🔴 Missing |
| i18n | 🔴 Missing |

---

## 8. Quantified Summary

| Module | Required Pages | Implemented | Coverage |
|--------|---------------|-------------|----------|
| Dashboard | 3 | 1 (basic) | ~20% |
| Users/Permissions | 11 | 1 (4-tab) | ~15% |
| Ledger | 18 | 1 (all-in-one) | ~25% |
| Reconciliation | 10+ | 1 (4-tab) | ~20% |
| Product Dev | 12 | 1 (list+detail) | ~10% |
| Cross-module/Global | 10+ items | 0 | 0% |
| **Total** | **~64+ pages** | **5 files** | **~15%** |

---

## 9. Recommended Next Steps

The current pages are **API smoke-test prototypes**, not production UI. To match the design document:

1. **Choose a proper frontend framework** — React/Vue/Next.js with component library (Ant Design / shadcn)
2. **Build unified layout shell** — sidebar nav + header + breadcrumbs + router
3. **Implement module by module** — start with the most-used: Ledger → Reconciliation → Product Dev → Admin
4. **Each module needs**:
   - Dashboard/overview page
   - List pages with full filters
   - Detail pages (standalone, not panel)
   - Create/edit form pages
   - Configuration/settings pages
   - Report/analytics pages
5. **Cross-module navigation** — deep links between related entities
