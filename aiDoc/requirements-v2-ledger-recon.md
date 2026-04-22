# Requirements V2 — Ledger & Reconciliation Gap Fix

> Date: 2026-04-22
> Status: **Draft — Awaiting Review**
> Based on: User feedback screenshots + ui-spec-module2/module3

---

## Table of Contents

1. [Ledger Transaction List Page Redesign](#1-ledger-transaction-list-page-redesign)
2. [Transaction Form — Missing Fields](#2-transaction-form--missing-fields)
3. [Reconciliation — Supplier Data Not Showing](#3-reconciliation--supplier-data-not-showing)
4. [Reconciliation — Grouping & Annotation](#4-reconciliation--grouping--annotation)
5. [Reports Page — Full Redesign](#5-reports-page--full-redesign)
6. [Account Management Page Redesign](#6-account-management-page-redesign)
7. [Category Management Page Redesign](#7-category-management-page-redesign)
8. [Project Management Page (New)](#8-project-management-page-new)
9. [Supplier / Counterparty Management Page (New)](#9-supplier--counterparty-management-page-new)
10. [Ledger Overview / Dashboard Page (New)](#10-ledger-overview--dashboard-page-new)

---

## 1. Ledger Transaction List Page Redesign

### Current State (what exists)

| Feature | Status | Notes |
|---------|--------|-------|
| Monthly navigator (left panel) | ✅ Exists | Fixed by month only |
| Stats bar (header) | ✅ Exists | Only shows current page totals, not full month/all-time |
| Toolbar (+New, Import, Search) | ✅ Exists | Missing: batch edit, filter panel |
| Filter bar | ⚠️ Partial | Inline type + account only; no drawer |
| Transaction list | ⚠️ Partial | Grouped by date, but `showHeader={false}` |
| Transaction form drawer | ✅ Exists | Missing: project, attachment |
| Transaction detail drawer | ✅ Exists | Missing: attachment preview |
| Batch entry page | ✅ Exists | At `/ledger/batch-entry` |

### Required Changes (from screenshots)

#### 1.1 Header Stats Bar

**Current**: Shows income/expense/balance for current page of transactions only.

**Required** (see Image 1 top bar):
```
流水列表   结余 2,275,853.04   收入 11,394,573.73   支出 9,118,520.69
```

- **Balance** (结余): Sum of ALL submitted transactions (not just current month), or account total balance
- **Income** (收入): ALL-time or current filter scope
- **Expense** (支出): ALL-time or current filter scope
- These values should come from a dedicated API (`/ledger/stats`) that computes across all data, not just the current page
- Numbers should use large, bold font (monospace/DIN)

**Action**: Add `/ledger/stats` API endpoint; update `TransactionListPage` statsBar to fetch from this API.

#### 1.2 Left Navigator — Aggregation Selector

**Current**: Fixed monthly grouping (Year → Month cards with income/expense/balance).

**Required** (see Image 2):
- A **"汇总" dropdown** at the top of the left panel with the current aggregation mode (default: 月)
- Click → cascading menu:
  - **时间**: 年 / 季 / 月 / 周 / 天
  - **分类**: Group by category (parent → child)
  - **账户**: Group by account
  - **项目**: Group by project_name
  - **其它**: (reserved)
- This is a **single-select** control — selecting one option changes the left navigator grouping
- When grouping changes, the navigator re-fetches data with the new grouping dimension
- Click an item in navigator → filters the right-side transaction list

**Action**:
- Add `groupBy` parameter to `/ledger/monthly-summary` (or new `/ledger/summary` endpoint)
- Support groupBy: `month` (default), `year`, `quarter`, `week`, `day`, `category`, `account`, `project`
- Update `MonthlyNavigator` component to accept and render different grouping modes
- Add aggregation selector dropdown above the navigator

#### 1.3 Toolbar — Missing Buttons

**Current**: +New, Import dropdown, Search, Filter toggle, Refresh.

**Required** (see Image 1 top-right):
- **数据导入** (Data Import) — already exists as dropdown
- **筛选** (Filter) — should open a **right-side drawer** (not inline bar)
- **搜索** (Search) — already exists
- **批量编辑** (Batch Edit) — **MISSING**, needs to be added

**Batch Edit** behavior:
- Toggle into batch edit mode
- Checkboxes appear on each row
- Bottom bar shows "Selected: N" with actions: Delete (drafts only), Change Category, Change Account, Change Project
- Confirm → batch update API call

**Action**: Add batch edit mode UI + batch update API endpoint.

#### 1.4 Filter — Right-Side Drawer (Multi-Filter)

**Current**: Inline filter bar with type + account selects.

**Required** (see Image 3):
- Click "筛选" button → opens a **Drawer from right** (not inline)
- Filter fields:
  - **流水类型** (Transaction Type): Select (全部/收入/支出/转账/退款)
  - **时间筛选** (Date Filter): DateRangePicker + preset buttons:
    - 今天 / 昨天 / 近7天 / 近30天 / 本周 / 上周 / 本月 / 上月 / 本季 / 上季 / 本年 / 去年
  - **分类** (Category): Select/Cascader
  - **账户** (Account): Select
  - **金额区间** (Amount Range): InputNumber × 2 (min ~ max)
  - **项目** (Project): Select (from distinct project_name values)
  - **关键字** (Keyword): Input (searches summary, remark, counterparty)
  - **状态** (Status): Select (全部/草稿/已提交)
- Bottom: **重置** (Reset) + **确定** (Confirm) buttons
- Applying filter updates the transaction list + header stats

**Action**: Replace inline filterBar with FilterDrawer component.

#### 1.5 Transaction List — Column Headers

**Current**: `showHeader={false}` — date-grouped tables have NO column headers.

**Required** (see Image 1 — columns visible):
```
分类 | 金额 | 账户 | 经团 | 时间 | 商家 | 项目 | 图片 | 备注 | 团/报人 | 操作
```

- Show a **fixed column header row** at the top of the right panel (below the toolbar area)
- Each date group's table data aligns with these columns
- The column header should be sticky/fixed while scrolling

**Columns needed** (from Image 1):
| Column | Field | Width | Notes |
|--------|-------|-------|-------|
| 分类 (Category) | categoryId → name | 120px | With color icon |
| 金额 (Amount) | amount | 120px | Color by type, right-aligned |
| 账户 (Account) | accountId → name | 120px | |
| 经团 (Account Type) | account type | 80px | 金额/会员/etc |
| 时间 (Time) | transactionDate + time | 160px | YYYY-MM-DD HH:mm |
| 商家 (Counterparty) | counterpartyName | 120px | |
| 项目 (Project) | projectName | 100px | **Currently not shown** |
| 图片 (Image) | attachments | 60px | **Thumbnail preview** |
| 备注 (Remark) | remark | 100px | Truncated with tooltip |
| 团/报人 (Reimbursement) | createdBy / reimbursement | 80px | |
| 操作 (Actions) | - | 80px | Edit / Delete / Copy |

**Action**:
- Set `showHeader={true}` or use a fixed header row
- Add missing columns: project, image thumbnail, remark, actions
- The image column shows a small thumbnail (40×40) if attachments exist; click to preview

#### 1.6 Image Thumbnails in List

**Current**: No image/attachment display in the transaction list.

**Required** (see Image 1 — "图片" column):
- If a transaction has attachments, show a **small thumbnail** (40×40px) in the list
- Click thumbnail → open image preview (lightbox)
- If multiple attachments, show first one with a badge count "+N"

**Technical notes**:
- DB: `transaction_attachments` table already exists
- API: `GET /ledger/transactions/:id/attachments` already exists
- Need: Include `attachmentCount` and `firstAttachmentUrl` in the transaction list API response
- Need: MinIO presigned URL generation for thumbnails

**Action**:
- Modify `listTransactions` repository to LEFT JOIN `transaction_attachments` and return count + first URL
- Add thumbnail display component in list
- Add `Image.PreviewGroup` for full preview

---

## 2. Transaction Form — Missing Fields

### 2.1 Project Name Field

**Current State**:
- DB: `transactions.project_name` column EXISTS ✅
- API: `createTransaction` accepts `projectName` ✅
- Frontend form: **NOT shown** ❌

**Required**: Add a `project_name` Input field in `TransactionFormDrawer.tsx` between counterparty and summary fields.

**Action**: Add `Form.Item name="projectName" label="项目"` with Input component.

### 2.2 Attachment Upload

**Current State**:
- DB: `transaction_attachments` table EXISTS ✅
- API: `POST /ledger/transactions/:id/attachments` EXISTS (accepts `fileUrl`, `fileName`) ✅
- API: `GET /ledger/transactions/:id/attachments` EXISTS ✅
- MinIO: Storage infrastructure EXISTS (docker-compose, `storage.ts`) ✅
- Frontend form: **NO upload component** ❌

**Required** (from UI spec):
- Drag-drop upload area in transaction form
- Max 5 files, 20MB each, image/pdf
- After save, files uploaded to MinIO → URLs stored in `transaction_attachments`

**Technical flow**:
1. User selects files in form
2. On save: first create transaction → get transaction ID
3. Upload each file to MinIO (`uploadFile` from `storage.ts`)
4. Call `POST /ledger/transactions/:id/attachments` for each file
5. Show upload progress

**Problems to solve**:
- Current API `uploadTransactionAttachment` expects a `fileUrl` (assumes file already uploaded)
- Need: Either (a) add binary upload endpoint, or (b) add presigned-upload-URL endpoint
- Recommended: Add `POST /upload/presign` → returns presigned PUT URL; frontend uploads directly to MinIO, then saves URL

**Action**:
- Add presigned upload API endpoint
- Add `Upload` (Ant Design) component to `TransactionFormDrawer`
- Add attachment preview in `TransactionDetailDrawer`

### 2.3 Remark Field Visibility

**Current State**:
- Form: `remark` TextArea EXISTS ✅
- Detail drawer: Shown conditionally (`tx.remark && ...`) ✅
- List: NOT shown ❌

**Required**:
- Show remark in list as a column (truncated, with tooltip for full text)
- Already covered in 1.5 column changes

---

## 3. Reconciliation — Supplier Data Not Showing

### Root Cause

The system has **two sets of tables** that are disconnected:

| Purpose | Tables | Row Count | Used By |
|---------|--------|-----------|---------|
| Lingxing sync data | `lx_purchase_orders`, `lx_payment_requests`, `lx_delivery_orders`, `lx_suppliers` | 119, 279, 800, 45 | Sync scripts only |
| App business tables | `purchase_orders`, `payment_requests`, `delivery_orders`, `invoice_records` | 0, 0, 0, 0 | Frontend API queries |

The API repository (`reconciliation.repository.ts`) queries the **empty** app tables (`purchase_orders`), while all the actual data is in `lx_*` tables.

### Required Fix

**Rewrite `reconciliation.repository.ts`** to query `lx_*` tables:

```sql
-- Example: Purchase Order List (current: queries empty table)
-- Before:
SELECT id, order_no, supplier_name, amount, invoice_status FROM purchase_orders

-- After:
SELECT 
  po.id,
  po.po_number AS orderNo,
  s.name AS supplierName,
  po.total_amount AS amount,
  po.status,
  po.order_date AS orderDate,
  po.currency,
  po.synced_at AS sourceUpdatedAt
FROM lx_purchase_orders po
LEFT JOIN lx_suppliers s ON po.supplier_id = s.id
ORDER BY po.order_date DESC
```

Same pattern for:
- `lx_payment_requests` → JOIN `lx_suppliers`
- `lx_delivery_orders` (no supplier FK, has `destination`)
- `lx_invoices` → JOIN `lx_suppliers`

### Additional Fields Needed

The `lx_purchase_orders` table has `raw_data` JSON column containing full Lingxing response. Useful fields to surface:
- Purchase type (采购类型)
- Custom PO number (custom_order_sn)
- Line items (from `lx_po_items` table)

**Action**:
1. Rewrite all repository functions to query `lx_*` tables
2. Update TypeScript interfaces to match new column names
3. Frontend columns may need minor adjustments for field name changes
4. Add supplier filter to PO/PR list pages

### Supplier List Page

Currently no standalone supplier management page. Consider adding:
- `/reconciliation/suppliers` or `/settings/suppliers`
- Shows `lx_suppliers` data (45 records)
- Read-only (synced from Lingxing)
- With search/filter

---

## 4. Reconciliation — Grouping & Annotation

### Current State

Existing components:
- `EntityDetailDrawer.tsx` — ✅ EXISTS (shows entity detail + linked records + progress)
- `LinkingModal.tsx` — ✅ EXISTS (invoice linking with split amounts)
- `WorkspacePage.tsx` — ✅ EXISTS (but may need data source fix)

These components look functional but **cannot work** because the underlying data is empty (queries go to wrong tables).

### What's Missing After Data Fix

Once data flows correctly, evaluate:
1. **User annotations** — ability to add notes/tags to PO/PR/DO records
   - Options: Add `user_note`, `user_tags` columns to `lx_*` tables or use a separate `entity_annotations` table
2. **Grouping** — ability to group POs by supplier, date range, status
   - Add filter/group controls to list pages (similar to left navigator pattern)
3. **"Do-not-remind"** status per entity
   - The app tables have `reminder_disabled` column but lx tables don't
   - Option: Add to lx tables or use a separate preference table

**Note**: These should be evaluated AFTER the P0 data fix is deployed and users can see actual data.

---

## Implementation Priority

| Phase | Items | Effort | Blocker? |
|-------|-------|--------|----------|
| **Phase 1** | 3. Recon data source fix (lx_* tables) | 2-3h | YES — core feature broken |
| **Phase 2** | 2.1 Project field in form | 30min | No |
| **Phase 2** | 1.5 Column headers + project/remark columns | 1h | No |
| **Phase 2** | 1.1 Header stats (full-scope totals) | 1h | No |
| **Phase 2** | 10. Ledger overview dashboard (today/week/month/year + chart + rankings) | 3-4h | No |
| **Phase 3** | 5.3 Reports: 基础统计 tab (overview + charts) | 3-4h | No |
| **Phase 3** | 5.4 Reports: 分类 tab (category breakdown) | 2-3h | No |
| **Phase 3** | 1.2 Left navigator aggregation selector | 2-3h | No |
| **Phase 3** | 1.4 Filter drawer (multi-filter) | 2h | No |
| **Phase 3** | 1.6 Image thumbnails in list | 1-2h | No |
| **Phase 3** | 2.2 Attachment upload in form | 3-4h | No |
| **Phase 3** | 6. Account management: stats + grouped list + 查看流水 | 2-3h | No |
| **Phase 3** | 7. Category management: amounts + table layout + 查看流水 | 2-3h | No |
| **Phase 3** | 8. Project management: new page + amounts + 查看流水 | 2h | No |
| **Phase 3** | 9.1 Counterparty management: new page + amounts + 查看流水 | 2h | No |
| **Phase 3** | 9.2 Supplier management (recon): lx_suppliers + PO counts | 1-2h | No |
| **Phase 4** | 5.5-5.8 Reports: 账户/项目/商家/月报 tabs | 4-6h | No |
| **Phase 4** | 1.3 Batch edit mode | 3-4h | No |
| **Phase 4** | 4. Recon grouping & annotation | 1-2d | Needs design |

---

## 5. Reports Page — Full Redesign

### Current State

The current `ReportsPage.tsx` has only **2 basic tabs**:
- **收支汇总**: Monthly summary table (month / income / expense / net), 3 stat cards at top
- **账户余额**: Account cards + balance table

**Major gaps**:
- NO time range filter / period selector
- NO charts (bar, line, pie)
- NO category breakdown
- NO drill-down by field (分类/账户/项目/商家/成员)
- Only shows monthly summary, no other aggregation dimensions
- No data export ("生成图片" / export)

### Required (from screenshot + UI spec)

The reference screenshot shows a rich reporting page with **multiple tabs across the top**:

```
基础统计 | 分类 | 账户 | 项目 | 商家 | 成本管理 | 项目分类 | 收入管理 | 账户详情 | 收入分类 | 支出分类 | 月报
```

#### 5.1 Tab System

| Tab | Description | Priority |
|-----|-------------|----------|
| **基础统计** (Basic Stats) | Overview: balance, income, expense, record count, expense distribution, income sources, monthly trend chart | P0 |
| **分类** (Category) | Expense/income by category with pie chart + drill-down table | P0 |
| **账户** (Account) | Per-account income/expense/balance breakdown | P1 |
| **项目** (Project) | Per-project income/expense summary | P1 |
| **商家** (Counterparty) | Per-counterparty spending summary | P2 |
| **成员** (Members) | Per-user transaction summary | P2 |
| **收入分类** (Income Categories) | Detailed income category breakdown | P1 |
| **支出分类** (Expense Categories) | Detailed expense category breakdown | P1 |
| **月报** (Monthly Report) | Monthly comparison report | P1 |

#### 5.2 Global Controls (applies to all tabs)

```
┌─ Controls ──────────────────────────────────────────┐
│ Period: [< 2026年 >]   [Apply]   [生成图片]          │
│ Time Range: Can select year, or specific month range │
└─────────────────────────────────────────────────────┘
```

- **Year selector**: `< 2026年 >` with prev/next arrows
- **Period filter**: Select specific date range within the year
- **"生成图片"** (Generate Image): Export report as image (nice-to-have, P2)

#### 5.3 Tab: 基础统计 (Basic Stats)

From the screenshot, this tab contains:

**Top section — Balance overview**:
```
账本流水统计
结余: 452,474.12
总收入 2,893,024.27   总支出 2,440,550.15
记账里程碑: 记账数 900
```

**Left column — 支出分布 (Expense Distribution)**:
| # | Category | Percentage | Amount |
|---|----------|-----------|--------|
| 1 | 货品材料 | 60.61% | 1,479,119.89 |
| 2 | 人工支出 | 22.22% | 542,204.36 |
| 3 | 运营费用 | 7.63% | 186,319.19 |
| 4 | 推广费用 | 6.89% | 168,184.70 |
| 5 | 固定资产 | 1.06% | 25,903.66 |

- Ranked list with percentage + amount
- Progress bar for each row showing proportion
- "点击展开" (click to expand) for drill-down to child categories

**Right column — 收入来源 (Income Sources)**:
| # | Category | Percentage | Amount |
|---|----------|-----------|--------|
| 1 | 营业收入 | 99.98% | 2,892,322.44 |
| 2 | 其他收入 | 0.02% | 597.23 |
| 3 | 金融投资收入 | 0.00% | 104.60 |

**Right column — 月度收支趋势 (Monthly Trend Chart)**:
- Line chart with two series: 收入 (income, red/orange) and 支出 (expense, green)
- X-axis: months; Y-axis: amount
- Shows trends over the selected year

#### 5.4 Tab: 分类 (Category)

- **Pie/donut chart**: Expense by parent category
- **Ranked table**: Category name, percentage, amount, bar visualization
- **Drill-down**: Click parent category → expand to show child categories
- **Toggle**: Switch between expense categories and income categories

#### 5.5 Tab: 账户 (Account)

- Per-account summary:
  - Account name, currency
  - Income total, Expense total, Transfer in, Transfer out
  - Current balance
- Click account → navigate to filtered transaction list

#### 5.6 Tab: 项目 (Project)

- Per-project summary based on `transactions.project_name`:
  - Project name
  - Total income, total expense, net
  - Transaction count
- Filter by time range

#### 5.7 Tab: 商家 (Counterparty)

- Per-counterparty summary based on `transactions.counterparty`:
  - Counterparty name
  - Total spending, transaction count
  - Average transaction amount
- Ranked by total spending

#### 5.8 Tab: 月报 (Monthly Report)

- Month-by-month comparison table:
  - Month | Income | Expense | Net | vs Previous Month %
- Bar chart comparing months side by side

### API Requirements

The current API only has `/ledger/monthly-summary` which returns basic monthly income/expense/balance.

**New endpoints needed**:

| Endpoint | Purpose |
|----------|---------|
| `GET /ledger/reports/overview` | Balance, income, expense totals for period |
| `GET /ledger/reports/category-breakdown` | Income/expense grouped by category with percentages |
| `GET /ledger/reports/account-breakdown` | Per-account income/expense/balance |
| `GET /ledger/reports/project-breakdown` | Per-project income/expense |
| `GET /ledger/reports/counterparty-breakdown` | Per-counterparty spending |
| `GET /ledger/reports/monthly-trend` | Monthly income/expense series for chart |
| `GET /ledger/reports/member-breakdown` | Per-user transaction summary |

All endpoints accept query params: `startDate`, `endDate`, `year`.

### Chart Library

Current dependencies don't include a chart library. Need to add one:
- **Recommended**: `@ant-design/charts` (built on G2, integrates well with Ant Design)
- Alternative: `recharts` (lighter, React-native)
- Charts needed: Line chart, Bar chart, Pie/Donut chart

### Implementation Priority

| Priority | Tab | Effort |
|----------|-----|--------|
| P0 | 基础统计 (overview + expense/income distribution + trend chart) | 3-4h |
| P0 | 分类 (category breakdown with pie + drill-down) | 2-3h |
| P1 | 账户 (account breakdown) | 1-2h |
| P1 | 项目 (project breakdown) | 1h |
| P1 | 收入分类 / 支出分类 (detailed category) | 1-2h |
| P1 | 月报 (monthly comparison) | 1-2h |
| P2 | 商家 (counterparty) | 1h |
| P2 | 成员 (member) | 1h |
| P2 | 生成图片 export | 2h |

---

## 6. Account Management Page Redesign

### Current State

`AccountListPage.tsx` — simple flat table with columns:
- 名称, 类型(tag), 币种, 期初余额, 当前余额, 状态, 编辑按钮

**Missing features**:
- NO summary stats at top (净资产/总资产/总负债)
- NO grouping by account type (现金账户/储蓄账户/负债账户)
- NO "计入资产" (include in net worth) indicator
- NO "查看流水" (view transactions) link per row
- NO "删除" action
- NO tabs for asset vs liability accounts
- NO "显示已隐藏的账户" toggle
- NO remark column display

### Required (from screenshot)

#### 6.1 Header Summary Stats

```
账户管理   净资产 2,262,933.81   总资产 2,262,933.81   总负债 0.00   [+ 新建账户]
```

- **净资产** = 总资产 - 总负债
- **总资产** = sum of currentBalance where accountType is asset-type
- **总负债** = sum of currentBalance where accountType is liability-type (credit_card etc.)
- Large bold numbers, same style as transaction list header

#### 6.2 Tabs: Asset / Liability

```
[资产账户] [负债账户]   ☐ 显示已隐藏的账户
```

- Switch between asset accounts and liability accounts
- Checkbox to toggle hidden/disabled accounts

#### 6.3 Grouped List by Account Type

Accounts grouped by their sub-type with group subtotals:

```
▼ 现金账户                          -5,063.13    CNY
    冯磊拼现金账户      1,490.00     CNY    是              编辑  删除  查看流水
    微广惠现金账户      11,231.82    CNY    是              编辑  删除  查看流水
    ...

▼ 储蓄账户                        1,999,716.19   CNY
    农禾公账           292,960.79    CNY    是    冯磊掉9883卡  编辑  删除  查看流水
    ...
```

**Columns**:
| Column | Field | Notes |
|--------|-------|-------|
| 账户名称 | accountName | With icon by type |
| 资产 (Balance) | currentBalance | Right-aligned, colored |
| 币种 | currency | |
| 计入资产 | includedInAssets | 是/否 toggle — **new field needed** |
| 备注 | remark | Currently exists in DB but not shown |
| 操作 | - | 编辑 / 删除 / **查看流水** |

#### 6.4 "查看流水" Navigation

Each account row has a **"查看流水"** link that navigates to:
```
/ledger/transactions?account={accountId}
```

The transaction list page should:
- Detect `account` query param on load
- Auto-apply the account filter
- Show a breadcrumb or tag indicating "Filtered by: {accountName}"

**Action**:
- Add `navigate('/ledger/transactions?account=' + record.id)` onClick handler
- Transaction list page already supports `filterAccount` from searchParams ✅

#### 6.5 New DB Field: `include_in_assets`

The `accounts` table may need an `include_in_assets` boolean column (default true).
Check if this already exists:

```sql
-- Check accounts table schema
DESCRIBE accounts;
```

If not, add migration.

#### 6.6 Delete Account

Add delete button with confirmation dialog. Only allow if account has no transactions (or soft-delete/disable).

### API Changes

| Change | Description |
|--------|-------------|
| `GET /ledger/accounts` response | Add `totalAssets`, `totalLiabilities`, `netWorth` to response |
| Account model | Add `includeInAssets` field if not exists |

---

## 7. Category Management Page Redesign

### Current State

`CategoryPage.tsx` — uses Ant Design `Tree` component in a 2-column layout:
- Left: expense tree, Right: income tree
- Each node shows: category name + edit button + add child button (for parents)
- Inline editing via Input

**Missing features**:
- NO aggregated amounts next to each category
- NO "查看流水" (view transactions) link
- NO "删除" (delete) action per child
- NO table-style layout (columns: 分类名称 / 金额 / 操作)
- Uses Tree component instead of expandable table
- NO tabs (支出类型/收入类型) — currently side-by-side
- NO "显示已隐藏的分类" toggle

### Required (from screenshot)

#### 7.1 Layout Change: Tabs instead of Side-by-Side

```
收支分类管理                                           [+ 新增分类]
[支出类型] [收入类型]   ☐ 显示已隐藏的分类
```

- Tabs to switch between expense and income categories (not side-by-side)
- Full-width display for better readability

#### 7.2 Table-Style Layout with Amounts

Replace `Tree` with an **expandable table** or custom list:

```
分类名称                              支出/收入            操作
▼ 货品材料                          5,995,699.49         编辑  删除
    包装耗材                           50,975.47         编辑  删除  查看流水
    货品支出                        4,723,777.58         编辑  删除  查看流水
    货品头程运费                    1,019,099.83         编辑  删除  查看流水
    样品费                            17,239.13         编辑  删除  查看流水
    ...
▼ 人工支出                        1,411,962.57         编辑  删除
    员工工资                        1,042,336.43         编辑  删除  查看流水
    员工提成                              0.00         编辑  删除  查看流水
    员工福利                           10,371.53         编辑  删除  查看流水
```

**Key features**:
- **Parent rows**: Bold, with expand/collapse toggle, shows sum of all child transactions
- **Child rows**: Indented, shows individual category transaction total
- **Amount column**: Aggregated total of all transactions in that category for the selected time period
- **操作 column**: 编辑 / 删除 / 查看流水

#### 7.3 Aggregated Amounts per Category

This is the **core new feature**: show the total amount of transactions for each category.

**API requirement**: New endpoint or enhanced existing endpoint:

```
GET /ledger/reports/category-breakdown?startDate=2026-01-01&endDate=2026-12-31
```

Returns:
```json
[
  {
    "categoryId": 1,
    "categoryName": "货品材料",
    "categoryType": "expense",
    "parentId": null,
    "totalAmount": 5995699.49,
    "children": [
      { "categoryId": 10, "categoryName": "包装耗材", "totalAmount": 50975.47 },
      { "categoryId": 11, "categoryName": "货品支出", "totalAmount": 4723777.58 },
      ...
    ]
  },
  ...
]
```

This endpoint is **shared with Reports page** (Section 5.4), so implement once, use in both places.

#### 7.4 "查看流水" Navigation

Each child category row has a **"查看流水"** link that navigates to:
```
/ledger/transactions?category={categoryId}
```

The transaction list page should:
- Detect `category` query param on load
- Auto-apply the category filter
- Show filter tag indicating "Filtered by: {categoryName}"

**Action**:
- Add `navigate('/ledger/transactions?category=' + record.id)` onClick handler
- Need to add `categoryId` filter support to TransactionListPage (currently not wired up from URL params)

#### 7.5 Delete Category

- Child categories: Allow delete if no transactions reference it (or reassign)
- Parent categories: Allow delete only if no children

#### 7.6 Time Period Filter (Optional)

The amounts shown could be for a specific period. Consider adding a year/month selector at the top to scope the aggregated amounts. Default: current year.

### API Changes

| Change | Description |
|--------|-------------|
| `GET /ledger/reports/category-breakdown` | New endpoint: category tree with aggregated transaction amounts |
| Category list response | Optionally include `transactionCount` and `totalAmount` per category |

---

## 8. Project Management Page (New)

### Current State

- **No standalone project management page** exists in the ledger module
- The `transactions.project_name` field is a free-text varchar(200) — no project master table for ledger
- There is a `projects` table (0 rows) used by the product-dev module (stages: idea→sourcing→...→launched)
- Currently no page in the menu for managing financial projects
- DB data: no transactions have `project_name` set yet (field not exposed in form)

### Purpose

A "project" in the financial context is a **cost center / budget tag** — e.g., "新品A开发费用", "2026 Q2 推广", "Amazon PPC Campaign". It is different from the product-dev `projects` table.

### Required (similar to Account/Category management)

#### 8.1 New Menu Entry

Add to ledger menu:
```
财务记账 > 项目管理    /ledger/projects
```

#### 8.2 Page Layout

```
项目管理                                              [+ 新增项目]

项目名称                    收入          支出          净额       流水数    操作
──────────────────────────────────────────────────────────────────────────
新品A开发费用              0.00      12,500.00    -12,500.00     5    编辑  删除  查看流水
2026 Q2 推广               0.00      45,000.00    -45,000.00    12    编辑  删除  查看流水
Amazon PPC Campaign    180,000.00     0.00      180,000.00     3    编辑  删除  查看流水
(未分配项目)            2,712,024.27  2,383,050.15  328,974.12  880    -     -    查看流水
```

**Columns**:
| Column | Source | Notes |
|--------|--------|-------|
| 项目名称 | `DISTINCT project_name` from transactions or project master table | |
| 收入 | SUM(amount) WHERE type='income' AND project_name=X | |
| 支出 | SUM(amount) WHERE type='expense' AND project_name=X | |
| 净额 | income - expense | |
| 流水数 | COUNT(*) | |
| 操作 | - | 编辑 / 删除 / **查看流水** |

- Last row: "(未分配项目)" for transactions where `project_name IS NULL OR = ''`

#### 8.3 "查看流水" Navigation

```
/ledger/transactions?project={projectName}
```

TransactionListPage needs `project` query param support.

#### 8.4 Project CRUD

Two approaches:

**Option A — Master table** (recommended):
- Create `ledger_projects` table: `id, name, description, budget, status, created_at`
- `transactions.project_name` references project name (or migrate to `project_id` FK)
- Pros: Proper management, budgeting, can't have typos
- Cons: Migration effort

**Option B — Derived from transactions**:
- No master table; project list is `SELECT DISTINCT project_name FROM transactions`
- CRUD = rename all matching transactions' `project_name`
- Pros: Zero migration, works immediately
- Cons: No budget, description, or independent lifecycle

**Recommendation**: Start with **Option B** (quick win), plan Option A for later.

#### 8.5 New Project Form

If using Option A:
```
Drawer: 新增项目
- 名称 (required)
- 描述
- 预算 (optional)
- 状态 (active / archived)
```

#### 8.6 Time Period Filter

Add year selector to scope aggregated amounts. Default: current year.

### API Requirements

| Endpoint | Description |
|----------|-------------|
| `GET /ledger/reports/project-breakdown` | Project list with aggregated amounts (shared with Reports tab) |
| `POST /ledger/projects` | Create project (Option A only) |
| `PUT /ledger/projects/:id` | Update project (Option A only) |

---

## 9. Supplier / Counterparty Management Page (New)

### Current State

- **No standalone counterparty/supplier management page** in ledger module
- `transactions.counterparty` is a free-text field — only 2 distinct values in DB ("Amazon", "Client A")
- `lx_suppliers` has **45 suppliers** synced from Lingxing (博白浩森, 广西润达, 广西源藤轩...)
- These are two different datasets:
  - **Counterparties** (对方) = who you transact with in the ledger
  - **Suppliers** (供应商) = Lingxing procurement partners used in reconciliation
- No menu entry for either

### Required

#### 9.1 Counterparty Management (商家管理) — Ledger Side

Similar to project management, derived from transaction data:

```
商家管理                                              [+ 新增商家]

商家名称                    收入          支出          净额       流水数    操作
──────────────────────────────────────────────────────────────────────────
Amazon                 180,000.00     0.00      180,000.00     3    编辑  删除  查看流水
Client A                50,000.00     0.00       50,000.00     1    编辑  删除  查看流水
(未指定商家)          2,662,024.27  2,440,550.15  221,474.12  896    -     -    查看流水
```

**Menu entry**:
```
财务记账 > 商家管理    /ledger/counterparties
```

**Columns**: Same pattern as project management (名称, 收入, 支出, 净额, 流水数, 操作)

**"查看流水"**: `/ledger/transactions?counterparty={name}`

#### 9.2 Supplier Management (供应商管理) — Reconciliation Side

For the reconciliation module, show Lingxing suppliers:

```
供应商管理 (Lingxing同步)                               [同步供应商]

供应商名称         联系人      采购单数    请款单数    总采购额        操作
─────────────────────────────────────────────────────────────────────
博白浩森           秦其林        5          3       125,000.00    查看采购单
广西润达           王熙英       12          8       450,000.00    查看采购单
广西源藤轩         龚东辉        8          5       280,000.00    查看采购单
...
```

**Menu entry**:
```
对账中心 > 供应商    /reconciliation/suppliers
```

**Data source**: `lx_suppliers` table (45 records), joined with `lx_purchase_orders` for aggregates

**Columns**:
| Column | Source | Notes |
|--------|--------|-------|
| 供应商名称 | `lx_suppliers.name` | |
| 联系人 | `lx_suppliers.contact` | |
| 采购单数 | COUNT from `lx_purchase_orders` WHERE supplier_id = X | |
| 请款单数 | COUNT from `lx_payment_requests` WHERE supplier_id = X | |
| 总采购额 | SUM(total_amount) from `lx_purchase_orders` | |
| 操作 | - | **查看采购单** → `/reconciliation/purchase-orders?supplier={id}` |

**"查看采购单"**: Navigate to PO list filtered by supplier. Requires adding `supplier` filter to PO list page.

#### 9.3 Shared API Pattern

Both pages follow the same pattern as reports breakdowns:

| Endpoint | Description |
|----------|-------------|
| `GET /ledger/reports/counterparty-breakdown` | Counterparty list with aggregated amounts (shared with Reports) |
| `GET /reconciliation/suppliers` | Lingxing supplier list with PO/PR counts and amounts |

### Implementation Notes

- **Counterparty management** and **Project management** share the same UI pattern — consider a shared `DimensionManagementPage` component
- Both pages: table with amounts + "查看流水" link
- The `category-breakdown`, `project-breakdown`, `counterparty-breakdown`, `account-breakdown` APIs all follow the same shape: `[{ name, income, expense, net, count }]`

---

## 10. Ledger Overview / Dashboard Page (New)

### Current State

- No ledger-specific overview/dashboard page
- The generic "工作台" (`/dashboard`) shows system-wide stats but not financial summaries
- All ledger data is only accessible through individual pages (transactions, accounts, categories, reports)

### Purpose

A **financial dashboard** that gives an at-a-glance view of the current financial state: today's activity, this month's trends, category rankings, income/expense breakdowns, and per-user stats.

### Required (from screenshot)

#### 10.1 Menu Entry & Route

```
财务记账 > 总览    /ledger/overview    (place at top of ledger submenu)
```

Or replace the existing top-level "工作台" with this page if ledger is the primary module.

#### 10.2 Page Layout

Two-column layout:

```
┌─────────────────────────────────────────┬───────────────────────────────┐
│                                         │  本周 / 本月 / 本年 summary   │
│  今日收支 (hero card)                    │  cards (right top)            │
│  总收入 0.00    总支出 0.00              │                               │
│                                         ├───────────────────────────────┤
├─────────────────────────────────────────┤  本月各分类支出排行            │
│                                         │  (category ranking list)      │
│  本月收支趋势 (line chart)               │                               │
│  日粒度，x=日期，y=金额                  │                               │
│  两条线：收入(橙) + 支出(绿)             ├───────────────────────────────┤
│                                         │  本月应收款统计               │
├─────────────────────────────────────────┤                               │
│                                         ├───────────────────────────────┤
│  本月收入 (income breakdown)             │  本月记账人收支统计            │
│  本月应付款统计 (payables)               │  (per-user stats)            │
│                                         │                               │
└─────────────────────────────────────────┴───────────────────────────────┘
```

#### 10.3 Components Detail

**A. 今日收支 (Today's Income/Expense) — Hero Card**

```
┌──────────────────────────────────┐
│  今日收支                        │
│  记余  0.00                      │
│  总收入 0.00    总支出 0.00      │
└──────────────────────────────────┘
```

- Today's date
- Balance = income - expense for today
- Income total, expense total for today
- Can have a banner/illustration background (optional)

**B. Period Summary Cards (本周/本月/本年)**

```
本周    04/20 - 04/26         总收入   0.00      总支出 2,116.58
本月    04/01 - 04/30         总收入 512,228.86   总支出 501,169.31
本年    2026年                 总收入 2,893,024.27  总支出 2,440,550.15
```

- Three rows, each showing: period label, date range, income, expense
- Income in green/orange, expense in red

**C. 本月收支趋势 (Monthly Trend Chart)**

- **Line chart** with daily data points for the current month
- Two series: 收入 (income, orange/red) and 支出 (expense, green)
- X-axis: dates (04.01 ~ 04.30)
- Y-axis: amount
- Current day highlighted with a dot
- Tooltip on hover showing exact amounts
- Chart library: same as Reports page (`@ant-design/charts` or `recharts`)

**D. 本月收入 (Monthly Income Breakdown)**

```
本月收入                          流入笔数 34    总收入 512,228.86

  营业收入         流入笔数 33                    合计 512,168.86
  (收入大类)

  其他收入         流入笔数 1                     合计    60.00
  (收入大类)
```

- Income grouped by parent category
- Each row: category icon + name, entry count, subtotal

**E. 本月各分类支出排行 (Monthly Expense Category Ranking)**

```
本月各分类支出排行         记账笔数 130      总支出 501,169.31

1  货品材料    ████████████████████ 57.75%  289,431.00
2  人工支出    ██████████           32.08%  160,764.00
3  推广费用    ██                    5.54%   27,780.42
4  运营费用    █                     3.58%   17,945.70
5  固定资产    ▏                     0.64%    3,200.00

                    点击展开 ▽
```

- Top 5 expense categories ranked by amount
- Each row: rank, icon, category name, progress bar, percentage, amount
- "点击展开" to show all categories
- Shared data with Reports category-breakdown API

**F. 本月应收款统计 (Monthly Receivables)**

```
本月应收款统计                    合计 0.00

  客户应收款           应收 0.00
  (客户应收款账户)     流出 0.00
```

- Based on accounts with type = receivable/payable (if applicable)
- Or based on `reimbursement_required` transactions

**G. 本月应付款统计 (Monthly Payables)**

Similar to receivables but for payable accounts.

**H. 本月记账人收支统计 (Monthly Per-User Stats)**

```
本月记账人收支统计

  冯磊锋    已记账 ●    总收入 0.00       总支出 -29,321.08
  毛伟创    已记账 ●    总收入 60.00      总支出  18,107.78
```

- Grouped by `transactions.created_by` (user who created the transaction)
- Each user: avatar, name, income total, expense total
- Need to join with users table to get user names

### API Requirements

| Endpoint | Description |
|----------|-------------|
| `GET /ledger/overview` | Combined dashboard data in one call (or split into multiple) |
| Sub-data: `todaySummary` | Income/expense/balance for today |
| Sub-data: `periodSummaries` | Week/month/year income/expense |
| Sub-data: `dailyTrend` | Array of `{ date, income, expense }` for current month |
| Sub-data: `categoryRanking` | Top expense categories with percentages (reuse category-breakdown) |
| Sub-data: `incomeBreakdown` | Income by parent category |
| Sub-data: `userStats` | Per-user income/expense for current month |

Can be one composite endpoint or multiple parallel calls. Recommend **one composite endpoint** `/ledger/overview` for performance.

### Implementation Notes

- This page reuses data patterns from Reports (Section 5) — trend chart, category breakdown
- The line chart component can be shared between overview and reports
- Category ranking component can also be shared
- Period summary cards are simple SQL aggregations
- Priority: **P1** — visible improvement, impresses users immediately

---

## Open Questions (Need User Input)

1. **Header stats scope**: Should 结余/收入/支出 show all-time totals or current filter scope? The screenshot shows very large numbers suggesting all-time.

2. **Left navigator — "分类" grouping**: When grouped by category, what does each card show? Category name + total income/expense for that category?

3. **Image upload timing**: Upload images during create (before transaction ID exists) or only after save? Pre-upload to MinIO then attach on save is recommended.

4. **Reconciliation annotation**: Add columns to `lx_*` tables directly, or use a separate annotation table? Former is simpler but mixes synced data with user data.

5. **Batch edit**: Which fields should be batch-editable? Suggest: category, account, project, status (draft→submitted), delete.

6. **Reports chart library**: Use `@ant-design/charts` (heavier but richer) or `recharts` (lighter)? Recommend `@ant-design/charts` for consistency with Ant Design.

7. **Reports tabs**: The reference app has 12+ tabs. Do we need all of them or start with core tabs (基础统计/分类/账户/项目/月报)? The rest (成本管理/收入管理/成员) can be added later.

8. **Empty app tables**: `purchase_orders`, `payment_requests`, `delivery_orders`, `invoice_records` — these are currently empty and unused. Should we:
   - (A) Drop them and only use `lx_*` tables?
   - (B) Keep them as a "merged view" layer (future use)?
   - (C) Populate them from `lx_*` via a sync pipeline?
