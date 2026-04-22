# Implementation Plan V2 — Ledger & Reconciliation

> Date: 2026-04-22
> Based on: `requirements-v2-ledger-recon.md`
> Status: **Ready for execution**

---

## Phase 1 — Reconciliation Data Source Fix (Blocker)

### Task 1.1: Rewrite PO repository to query lx_purchase_orders
- **File**: `apps/api/src/modules/reconciliation/repository/reconciliation.repository.ts`
- **What**: Change `listPurchaseOrders()` from `SELECT ... FROM purchase_orders` → `SELECT ... FROM lx_purchase_orders po LEFT JOIN lx_suppliers s ON po.supplier_id = s.id`
- **Columns**: `po.id, po.po_number AS orderNo, s.name AS supplierName, po.total_amount AS amount, po.status AS invoiceStatus, po.order_date, po.currency`
- **Acceptance**: API `/reconciliation/purchase-orders` returns 119 rows

### Task 1.2: Rewrite PO detail query
- **File**: same as 1.1
- **What**: Change `getPurchaseOrderById()` → query `lx_purchase_orders` with supplier join
- **Acceptance**: API `/reconciliation/purchase-orders/:id` returns data with supplierName

### Task 1.3: Rewrite Payment Request repository to query lx_payment_requests
- **File**: same as 1.1
- **What**: Change `listPaymentRequests()` / `getPaymentRequestById()` → `lx_payment_requests pr LEFT JOIN lx_suppliers s ON pr.supplier_id = s.id`
- **Columns**: `pr.id, pr.request_number AS requestNo, s.name AS supplierName, pr.amount, pr.status AS invoiceStatus, pr.request_date, pr.currency`
- **Acceptance**: API `/reconciliation/payment-requests` returns 279 rows

### Task 1.4: Rewrite Delivery Order repository to query lx_delivery_orders
- **File**: same as 1.1
- **What**: Change `listDeliveryOrders()` / `getDeliveryOrderById()` → `lx_delivery_orders`
- **Columns**: `id, delivery_number AS orderNo, destination AS supplierName, status AS invoiceStatus, ship_date`
- **Note**: No supplier_id FK on delivery orders; use `destination` or leave supplierName empty
- **Acceptance**: API `/reconciliation/delivery-orders` returns 800 rows

### Task 1.5: Update TypeScript entity types
- **File**: `apps/api/src/common/entity-types.ts`
- **What**: Ensure `PurchaseOrder`, `PaymentRequest`, `DeliveryOrder` interfaces match new column aliases
- **Acceptance**: No TypeScript compilation errors

### Task 1.6: Update reconciliation reports/alerts to use lx_* tables
- **File**: `apps/api/src/modules/reconciliation/service/reconciliation.service.ts`
- **What**: `getReconciliationReports()` and `getReconciliationAlerts()` — change COUNT/SUM queries from app tables to lx_* tables
- **Acceptance**: Overview page shows correct counts (119/279/800) and amounts

### Task 1.7: Test & verify on 192.168.1.251
- **What**: Deploy, hit API endpoints, verify frontend pages show data
- **Acceptance**: All reconciliation list pages show Lingxing data

---

## Phase 2 — Quick Wins (Form/List/Overview)

### Task 2.1: Add project field to transaction form
- **File**: `apps/web/src/pages/ledger/components/TransactionFormDrawer.tsx`
- **What**: Add `<Form.Item name="projectName" label="Project">` with `<Input />` between counterparty and summary
- **Also**: Include `projectName` in create/update payload
- **Acceptance**: New transaction form shows project field; saved value appears in detail drawer

### Task 2.2: Show column headers in transaction list
- **File**: `apps/web/src/pages/ledger/TransactionListPage.tsx`
- **What**: Change `showHeader={false}` → `showHeader={true}` on grouped tables, or add a fixed column header row above
- **Acceptance**: Column names visible above transaction rows

### Task 2.3: Add project + remark columns to transaction list
- **File**: same as 2.2
- **What**: Add columns for `projectName` (100px), `remark` (ellipsis + tooltip, 100px), and action buttons (edit/delete/copy)
- **Acceptance**: Project and remark visible in list; action buttons work

### Task 2.4: Fix header stats to show global totals
- **File (API)**: `apps/api/src/modules/ledger/service/ledger.service.ts` + `repository/ledger.repository.ts`
- **What**: Add `getGlobalStats()` function: `SELECT SUM(CASE WHEN transaction_type='income' THEN amount ELSE 0 END) AS income, SUM(CASE WHEN transaction_type='expense' THEN amount ELSE 0 END) AS expense FROM transactions WHERE status='submitted'`
- **File (API route)**: `apps/api/src/modules/ledger/index.ts`
- **What**: Add `GET /ledger/stats` endpoint
- **File (Frontend)**: `apps/web/src/pages/ledger/TransactionListPage.tsx`
- **What**: Fetch `/ledger/stats` for statsBar instead of computing from current page
- **Acceptance**: Header shows all-time income/expense/balance, not just current page

### Task 2.5: Install chart library
- **File**: `apps/web/package.json`
- **What**: Add `@ant-design/charts` (or `recharts`) dependency
- **Acceptance**: Import and render a test chart without errors

### Task 2.6: Create Ledger Overview page — API endpoint
- **File (new)**: `apps/api/src/modules/ledger/service/ledger-reports.service.ts`
- **What**: Create `getLedgerOverview()` function that returns composite data:
  - `todaySummary`: income/expense/balance for today
  - `periodSummaries`: this week / this month / this year
  - `dailyTrend`: array of `{ date, income, expense }` for current month (one SQL with GROUP BY DATE)
  - `categoryRanking`: top expense categories with percentages (GROUP BY category_id, JOIN categories)
  - `incomeBreakdown`: income by parent category
  - `userStats`: per-user income/expense (GROUP BY created_by)
- **File (route)**: `apps/api/src/modules/ledger/index.ts`
- **What**: Add `GET /ledger/overview` endpoint
- **Acceptance**: API returns valid JSON with all sub-data; manual curl test passes

### Task 2.7: Create Ledger Overview page — Frontend
- **File (new)**: `apps/web/src/pages/ledger/OverviewPage.tsx`
- **What**: Two-column layout page with:
  - Today's income/expense hero card (top-left)
  - Period summary cards: week/month/year (top-right)
  - Monthly trend line chart using @ant-design/charts (mid-left)
  - Expense category ranking list with progress bars (mid-right)
  - Income breakdown by category (bottom-left)
  - Per-user stats (bottom-right)
- **Acceptance**: Page renders with real data, chart displays correctly

### Task 2.8: Register Overview page in router + menu
- **File**: `apps/web/src/router/index.tsx`
- **What**: Add lazy import for `OverviewPage`, add route `/ledger/overview`
- **File**: `apps/web/src/layouts/menuConfig.tsx`
- **What**: Add `{ path: '/ledger/overview', name: '总览', icon: <></> }` at top of ledger children
- **File**: `apps/web/src/router/index.tsx`
- **What**: Change `/ledger` redirect from `/ledger/transactions` → `/ledger/overview`
- **Acceptance**: Navigate to `/ledger/overview` shows the dashboard; menu entry visible

---

## Phase 3A — Reports Page Rebuild

### Task 3A.1: Create reports API — category breakdown
- **File**: `apps/api/src/modules/ledger/service/ledger-reports.service.ts`
- **What**: Add `getCategoryBreakdown(startDate, endDate, type)`:
  - `SELECT c.id, c.category_name, c.parent_id, SUM(t.amount) AS totalAmount, COUNT(*) AS txCount FROM transactions t JOIN categories c ON t.category_id = c.id WHERE t.transaction_date BETWEEN ? AND ? AND t.transaction_type = ? GROUP BY c.id`
  - Build parent-child tree in code
- **File (route)**: add `GET /ledger/reports/category-breakdown?startDate=&endDate=&type=expense|income`
- **Acceptance**: Returns category tree with amounts and percentages

### Task 3A.2: Create reports API — account breakdown
- **File**: same service file
- **What**: Add `getAccountBreakdown(startDate, endDate)`:
  - Per-account: income, expense, transfer_in, transfer_out, balance
- **Route**: `GET /ledger/reports/account-breakdown`
- **Acceptance**: Returns per-account stats

### Task 3A.3: Create reports API — project breakdown
- **File**: same service file
- **What**: Add `getProjectBreakdown(startDate, endDate)`:
  - `SELECT project_name, SUM(CASE ...) FROM transactions GROUP BY project_name`
- **Route**: `GET /ledger/reports/project-breakdown`
- **Acceptance**: Returns per-project stats

### Task 3A.4: Create reports API — counterparty breakdown
- **File**: same service file
- **What**: Add `getCounterpartyBreakdown(startDate, endDate)`
- **Route**: `GET /ledger/reports/counterparty-breakdown`
- **Acceptance**: Returns per-counterparty stats

### Task 3A.5: Create reports API — monthly trend
- **File**: same service file
- **What**: Add `getMonthlyTrend(year)`:
  - `SELECT DATE_FORMAT(transaction_date, '%Y-%m') AS month, SUM(CASE ...) FROM transactions WHERE YEAR(transaction_date) = ? GROUP BY month`
- **Route**: `GET /ledger/reports/monthly-trend?year=2026`
- **Acceptance**: Returns 12-element array

### Task 3A.6: Create reports API — member breakdown
- **File**: same service file
- **What**: Add `getMemberBreakdown(startDate, endDate)`:
  - GROUP BY created_by, JOIN users for name/avatar
- **Route**: `GET /ledger/reports/member-breakdown`

### Task 3A.7: Register all report routes
- **File**: `apps/api/src/modules/ledger/index.ts`
- **What**: Add route handlers for all `/ledger/reports/*` endpoints
- **Acceptance**: All 6 report endpoints return valid data

### Task 3A.8: Rebuild ReportsPage — 基础统计 tab
- **File**: `apps/web/src/pages/ledger/ReportsPage.tsx` (rewrite)
- **What**: 
  - Add year selector control at top (`< 2026年 >`)
  - Tab 1 "基础统计": balance overview card + expense distribution ranked list + income sources + monthly trend line chart
  - Reuse chart components from OverviewPage where possible
- **Acceptance**: 基础统计 tab renders with real data, year selector works

### Task 3A.9: ReportsPage — 分类 tab
- **What**: Tab 2 "分类": pie/donut chart + ranked table with drill-down
- **Acceptance**: Click parent category → expands children; toggle expense/income

### Task 3A.10: ReportsPage — 账户 tab
- **What**: Tab 3 "账户": per-account cards + table; click → navigate to transactions filtered by account
- **Acceptance**: Account breakdown displays; click navigates correctly

### Task 3A.11: ReportsPage — 项目 tab
- **What**: Tab 4 "项目": per-project table + 查看流水 link
- **Acceptance**: Project breakdown displays

### Task 3A.12: ReportsPage — 收入分类/支出分类 tabs
- **What**: Tab 5/6: detailed income/expense category breakdowns
- **Acceptance**: Category detail displays with drill-down

### Task 3A.13: ReportsPage — 月报 tab
- **What**: Tab 7 "月报": month-by-month comparison table + bar chart
- **Acceptance**: Month comparison renders with vs-previous-month percentages

---

## Phase 3B — Transaction List Enhancements

### Task 3B.1: Create FilterDrawer component
- **File (new)**: `apps/web/src/pages/ledger/components/FilterDrawer.tsx`
- **What**: Ant Design Drawer from right with:
  - Transaction type select
  - DateRangePicker + preset buttons (今天/昨天/近7天/近30天/本周/上周/本月/上月/本季/上季/本年/去年)
  - Category cascader
  - Account select
  - Amount range (InputNumber × 2)
  - Project select (from distinct values)
  - Keyword input
  - Status select
  - Reset + Confirm buttons
- **Acceptance**: Drawer opens/closes; filter values collected correctly

### Task 3B.2: Wire FilterDrawer to TransactionListPage
- **File**: `apps/web/src/pages/ledger/TransactionListPage.tsx`
- **What**: Replace inline filterBar with FilterDrawer; on confirm → update filters → refetch
- **Acceptance**: Filter drawer applies filters; list updates accordingly

### Task 3B.3: Support URL query params for filtering
- **File**: same as 3B.2
- **What**: Read `account`, `category`, `project`, `counterparty` from `useSearchParams()`; pre-populate filters
- **Acceptance**: Navigate to `/ledger/transactions?account=5` → auto-filters by account; show filter tag

### Task 3B.4: Left navigator aggregation selector
- **File**: `apps/web/src/pages/ledger/components/MonthlyNavigator.tsx`
- **What**: Add dropdown at top: 汇总方式 (时间:年/季/月/周/天, 分类, 账户, 项目)
- **File (API)**: `apps/api/src/modules/ledger/service/ledger.service.ts`
- **What**: Enhance `monthlySummary` or add new `/ledger/summary?groupBy=month|year|quarter|week|day|category|account|project`
- **Acceptance**: Select "分类" → navigator shows category groups; click → filters list

---

## Phase 3C — Image / Attachment Support

### Task 3C.1: Add presigned upload API endpoint
- **File (new or extend)**: `apps/api/src/modules/upload/index.ts` or add to ledger module
- **What**: `POST /upload/presign` → accepts `{ fileName, contentType }` → generates MinIO presigned PUT URL → returns `{ uploadUrl, fileKey, publicUrl }`
- **Uses**: `getPresignedUrl()` from `common/storage.ts` (need PUT presign, not GET)
- **Note**: May need to add `PutObjectCommand` presign support
- **Acceptance**: Curl to endpoint returns valid presigned URL; upload to URL succeeds

### Task 3C.2: Add Upload component to TransactionFormDrawer
- **File**: `apps/web/src/pages/ledger/components/TransactionFormDrawer.tsx`
- **What**: Add `<Upload>` component (Ant Design) below remark field
  - Max 5 files, accept image/pdf, 20MB limit
  - On select: call presign API → upload to MinIO → collect fileKey/URL
  - On form save: after transaction created, call `POST /ledger/transactions/:id/attachments` for each file
- **Acceptance**: Upload images during transaction create; files appear in MinIO; attachment records in DB

### Task 3C.3: Add attachment count + thumbnail to transaction list API
- **File**: `apps/api/src/modules/ledger/repository/ledger.repository.ts`
- **What**: Modify `listTransactions` query to LEFT JOIN `transaction_attachments` and include `COUNT(ta.id) AS attachmentCount, MIN(ta.file_url) AS firstAttachmentUrl`
- **Acceptance**: List API returns `attachmentCount` and `firstAttachmentUrl` per transaction

### Task 3C.4: Add image thumbnail column to transaction list
- **File**: `apps/web/src/pages/ledger/TransactionListPage.tsx`
- **What**: Add "图片" column (60px) — if `attachmentCount > 0`, show 40×40 thumbnail of `firstAttachmentUrl`; click → Image preview; badge "+N" if multiple
- **Acceptance**: Thumbnail shows in list; click opens lightbox

### Task 3C.5: Add attachment preview to TransactionDetailDrawer
- **File**: `apps/web/src/pages/ledger/components/TransactionDetailDrawer.tsx`
- **What**: Fetch `/ledger/transactions/:id/attachments`; display as image gallery with preview
- **Acceptance**: Detail drawer shows attached images with preview capability

---

## Phase 3D — Account & Category & Dimension Management Pages

### Task 3D.1: Account page — add header summary stats
- **File**: `apps/web/src/pages/ledger/AccountListPage.tsx`
- **What**: Compute `totalAssets`, `totalLiabilities`, `netWorth` from account list; display at top
- **Acceptance**: Header shows 净资产/总资产/总负债

### Task 3D.2: Account page — grouped by type + tabs
- **File**: same as 3D.1
- **What**: Replace flat Table with grouped display by `accountType`; add tabs for 资产/负债; checkbox for hidden accounts
- **Acceptance**: Accounts grouped under type headers with subtotals

### Task 3D.3: Account page — add remark column + 查看流水 + delete
- **File**: same as 3D.1
- **What**: Add columns: remark, 查看流水 (navigate `/ledger/transactions?account={id}`), delete button
- **Acceptance**: Click 查看流水 → navigates to filtered transaction list

### Task 3D.4: Category page — rewrite with table layout + tabs
- **File**: `apps/web/src/pages/ledger/CategoryPage.tsx` (rewrite)
- **What**: Replace Tree + 2-column → Tabs (支出类型/收入类型) + expandable table
- **Acceptance**: Tabs switch; table shows parent/child with expand/collapse

### Task 3D.5: Category page — add aggregated amounts
- **File**: same as 3D.4
- **What**: Fetch `/ledger/reports/category-breakdown` on load; merge amounts into tree data; display amount column
- **Acceptance**: Each category row shows total transaction amount

### Task 3D.6: Category page — add 查看流水 + delete actions
- **File**: same as 3D.4
- **What**: Add 查看流水 link (navigate `/ledger/transactions?category={id}`), delete button with confirm
- **Acceptance**: Click 查看流水 → filtered list; delete removes category

### Task 3D.7: Create Project management page
- **File (new)**: `apps/web/src/pages/ledger/ProjectListPage.tsx`
- **What**: Table with columns: 项目名称/收入/支出/净额/流水数/操作
- **Data**: Fetch `/ledger/reports/project-breakdown`
- **Actions**: 编辑(rename), 删除, 查看流水 (`/ledger/transactions?project={name}`)
- **File (route)**: register in router + menu
- **Acceptance**: Page shows project list with amounts; navigation works

### Task 3D.8: Create Counterparty management page
- **File (new)**: `apps/web/src/pages/ledger/CounterpartyListPage.tsx`
- **What**: Same pattern as project page but using counterparty-breakdown API
- **Data**: Fetch `/ledger/reports/counterparty-breakdown`
- **Actions**: 查看流水 (`/ledger/transactions?counterparty={name}`)
- **File (route)**: register in router + menu
- **Acceptance**: Page shows counterparty list with amounts

### Task 3D.9: Create Supplier management page (reconciliation)
- **File (new)**: `apps/web/src/pages/reconciliation/SupplierListPage.tsx`
- **What**: Table: 供应商名称/联系人/采购单数/请款单数/总采购额/操作
- **File (API)**: Add `GET /reconciliation/suppliers` endpoint → query `lx_suppliers` with aggregated PO/PR counts
- **File (route)**: register in router + menu under 对账中心
- **Acceptance**: Page shows 45 suppliers with aggregated stats

### Task 3D.10: Register all new pages in router + menu
- **File**: `apps/web/src/router/index.tsx`
- **What**: Add lazy imports + routes for:
  - `/ledger/projects` → ProjectListPage
  - `/ledger/counterparties` → CounterpartyListPage
  - `/reconciliation/suppliers` → SupplierListPage
- **File**: `apps/web/src/layouts/menuConfig.tsx`
- **What**: Add menu entries:
  - 财务记账: 总览, 流水记录, 账户管理, 分类管理, 商家管理, 项目管理, 导入, 报表
  - 对账中心: (existing items) + 供应商

---

## Phase 4 — Advanced Features

### Task 4.1: Batch edit mode in transaction list
- **File**: `apps/web/src/pages/ledger/TransactionListPage.tsx`
- **What**: Toggle batch mode → show checkboxes → bottom action bar (selected count + actions: delete/change category/change account/change project)
- **File (API)**: Add `PUT /ledger/transactions/batch` endpoint for batch updates
- **Acceptance**: Select multiple transactions → batch change category → all updated

### Task 4.2: Reports — 商家 tab
- **File**: `apps/web/src/pages/ledger/ReportsPage.tsx`
- **What**: New tab using counterparty-breakdown API
- **Acceptance**: Tab shows counterparty ranking

### Task 4.3: Reports — 成员 tab
- **File**: same
- **What**: New tab using member-breakdown API

### Task 4.4: Reports — 生成图片 export
- **File**: same
- **What**: html2canvas or dom-to-image for report export
- **Acceptance**: Click button → downloads report as PNG

### Task 4.5: Reconciliation grouping & annotation
- **Depends on**: Phase 1 completion + user feedback
- **What**: Add user_note/tags to lx_* records; grouping controls on PO/PR list pages
- **Design needed**: Separate annotation table vs columns on lx_* tables

---

## Task Dependencies Graph

```
Phase 1 (1.1-1.7) ──── no dependencies, start immediately
    │
    ▼
Phase 2 (2.1-2.8) ──── 2.5 (chart lib) must come before 2.7
    │                    2.6 (API) must come before 2.7 (frontend)
    │                    2.8 (router) must come after 2.7
    ▼
Phase 3A (reports API 3A.1-3A.7) ──── can start in parallel with 3B/3C/3D
Phase 3A (reports UI 3A.8-3A.13) ──── depends on 3A.1-3A.7 + 2.5 (chart lib)
    │
Phase 3B (filter 3B.1-3B.4) ──── independent; can parallel with 3A
    │
Phase 3C (images 3C.1-3C.5) ──── 3C.1 first, then 3C.2-3C.5 parallel
    │
Phase 3D (management pages 3D.1-3D.10) ──── 3D.5 depends on 3A.1 (category-breakdown API)
    │                                         3D.7/3D.8 depend on 3A.3/3A.4
    │                                         3D.9 depends on 1.1 (lx_* tables)
    ▼
Phase 4 (4.1-4.5) ──── all depend on Phase 3 completion
```

---

## Estimated Total Effort

| Phase | Tasks | Estimated Hours |
|-------|-------|----------------|
| Phase 1 | 7 tasks | 2-3h |
| Phase 2 | 8 tasks | 6-8h |
| Phase 3A | 13 tasks | 10-14h |
| Phase 3B | 4 tasks | 5-7h |
| Phase 3C | 5 tasks | 5-7h |
| Phase 3D | 10 tasks | 10-14h |
| Phase 4 | 5 tasks | 8-12h |
| **Total** | **52 tasks** | **~46-65h** |

---

## Files to Create (New)

| File | Purpose |
|------|---------|
| `apps/api/src/modules/ledger/service/ledger-reports.service.ts` | All report aggregation queries |
| `apps/web/src/pages/ledger/OverviewPage.tsx` | Ledger dashboard |
| `apps/web/src/pages/ledger/components/FilterDrawer.tsx` | Multi-filter drawer |
| `apps/web/src/pages/ledger/ProjectListPage.tsx` | Project dimension management |
| `apps/web/src/pages/ledger/CounterpartyListPage.tsx` | Counterparty dimension management |
| `apps/web/src/pages/reconciliation/SupplierListPage.tsx` | Lingxing supplier management |

## Files to Modify (Existing)

| File | Changes |
|------|---------|
| `apps/api/src/modules/reconciliation/repository/reconciliation.repository.ts` | Rewrite all queries to lx_* tables |
| `apps/api/src/modules/reconciliation/service/reconciliation.service.ts` | Update reports/alerts |
| `apps/api/src/common/entity-types.ts` | Update interfaces |
| `apps/api/src/modules/ledger/index.ts` | Add report + overview + upload routes |
| `apps/api/src/modules/ledger/repository/ledger.repository.ts` | Add stats queries, attachment join |
| `apps/api/src/modules/ledger/service/ledger.service.ts` | Add getGlobalStats |
| `apps/web/src/pages/ledger/TransactionListPage.tsx` | Headers, columns, filter, batch, thumbnails |
| `apps/web/src/pages/ledger/components/TransactionFormDrawer.tsx` | Project field, upload component |
| `apps/web/src/pages/ledger/components/TransactionDetailDrawer.tsx` | Attachment preview |
| `apps/web/src/pages/ledger/components/MonthlyNavigator.tsx` | Aggregation selector |
| `apps/web/src/pages/ledger/AccountListPage.tsx` | Stats, grouping, 查看流水 |
| `apps/web/src/pages/ledger/CategoryPage.tsx` | Rewrite: table, amounts, 查看流水 |
| `apps/web/src/pages/ledger/ReportsPage.tsx` | Full rewrite: multi-tab with charts |
| `apps/web/src/router/index.tsx` | Add new routes |
| `apps/web/src/layouts/menuConfig.tsx` | Add new menu entries |
| `apps/web/package.json` | Add @ant-design/charts |
