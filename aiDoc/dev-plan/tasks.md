# tasks.md — Internal Platform

> Generated from: speckit-specify.md, development-plan.md, ui-spec-module1~5.md, design-system.md, visual-style-proposal.md
> Format: speckit.tasks checklist
> Date: 2026-04-21

---

## Phase 1: Setup (Project Initialization)

- [x] T001 Initialize Vite + React 18 + TypeScript project in `apps/web/`, update `apps/web/package.json` with all dependencies (antd, pro-components, react-router-dom, zustand, axios, dayjs, lucide-react)
- [x] T002 [P] Create TypeScript configs: `apps/web/tsconfig.json`, `apps/web/tsconfig.node.json` with path alias `@/` → `src/`
- [x] T003 [P] Create Vite config with React plugin, `@/` alias, dev proxy `/api` → `localhost:3000` in `apps/web/vite.config.ts`
- [x] T004 [P] Create Vite env type declaration in `apps/web/src/vite-env.d.ts`
- [x] T005 Initialize shared types package with TypeScript in `packages/shared/package.json` and `packages/shared/tsconfig.json`
- [x] T006 [P] Define API response envelope type `ApiResponse<T>` in `packages/shared/src/types/api.ts`
- [x] T007 [P] Define pagination types `PaginatedRequest`, `PaginatedResponse<T>` in `packages/shared/src/types/pagination.ts`
- [x] T008 [P] Define common entity interfaces (User, Role, Department, Account, Category, Transaction) in `packages/shared/src/types/entities.ts`
- [x] T009 [P] Create shared package barrel export in `packages/shared/src/index.ts`
- [x] T010 Add backend dependencies (jsonwebtoken, bcryptjs, @aws-sdk/client-s3, multer, uuid) to `apps/api/package.json`
- [x] T011 Run `npm install` from workspace root to install all dependencies

**Phase 1 exit criteria**: `npm run dev` in `apps/web/` starts Vite dev server; `packages/shared` builds cleanly; backend deps installed.

---

## Phase 2: Foundational (Blocking Prerequisites)

### 2A — Design System + App Shell

- [x] T012 Create Ant Design theme config with all design tokens (colorPrimary=#00B894, colorBgLayout=#F5F7FA, white sidebar, 8px radius, typography) in `apps/web/src/theme/themeConfig.ts`
- [x] T013 [P] Create financial color constants and amount display utilities in `apps/web/src/theme/financial.ts`
- [x] T014 [P] Create CSS variables file for custom tokens (category icon colors, shadows, animations) in `apps/web/src/theme/variables.css`
- [x] T015 Create React app entry point with ConfigProvider + theme + Router in `apps/web/src/main.tsx`
- [x] T016 [P] Create root HTML entry with viewport meta and font preloads in `apps/web/index.html`
- [x] T017 Create ProLayout shell component: white sidebar (240px), 56px header, breadcrumb, user avatar menu in `apps/web/src/layouts/MainLayout.tsx`
- [x] T018 [P] Create sidebar menu config with Lucide icons (Dashboard, Users, Ledger, Reconciliation, ProductDev, Settings) in `apps/web/src/layouts/menuConfig.tsx`
- [x] T019 Create route definitions with lazy-loaded module routes in `apps/web/src/router/index.tsx`
- [x] T020 [P] Create route guard component for permission check + 403 redirect in `apps/web/src/router/AuthGuard.tsx`

### 2B — Common UI Components

- [x] T021 Create AmountText component (colored, right-aligned, tabular nums, thousand separator, currency prefix) in `apps/web/src/components/AmountText.tsx`
- [x] T022 [P] Create StatusBadge component (dot + text + soft bg, per design-system §9) in `apps/web/src/components/StatusBadge.tsx`
- [x] T023 [P] Create CategoryIcon component (32px colored circle + Lucide icon, 12 category colors) in `apps/web/src/components/CategoryIcon.tsx`
- [x] T024 [P] Create EmptyState component (centered illustration, teal accent, title, description, action button) in `apps/web/src/components/EmptyState.tsx`
- [x] T025 [P] Create TransactionTypeTag component (Income green / Expense red / Transfer teal / Refund orange) in `apps/web/src/components/TransactionTypeTag.tsx`
- [x] T026 Create global keyboard shortcut hook (Ctrl+N, Ctrl+K, Ctrl+S, Esc) in `apps/web/src/hooks/useGlobalShortcuts.ts`

### 2C — API + Auth Client

- [x] T027 Create axios instance with baseURL, interceptors (JWT attach, 401 refresh, error toast) in `apps/web/src/api/client.ts`
- [x] T028 [P] Create auth store (Zustand): user, token, permissions, login/logout actions in `apps/web/src/stores/authStore.ts`
- [x] T029 [P] Create permission helper: `hasPermission()`, `hasMenuAccess()` in `apps/web/src/utils/permission.ts`

### 2D — Backend Infrastructure

- [x] T030 Implement JWT sign/verify with access (2h) + refresh (7d) tokens in `apps/api/src/common/jwt.ts`
- [x] T031 [P] Implement bcrypt password hashing utility in `apps/api/src/common/password.ts`
- [x] T032 [P] Implement CORS middleware for Vite dev proxy in `apps/api/src/common/cors.ts`
- [x] T033 Create MinIO S3 client wrapper (upload, download, presigned URL, delete) in `apps/api/src/common/storage.ts`
- [x] T034 [P] Create file upload middleware (multer, max 20MB, image/pdf types) in `apps/api/src/common/upload.ts`

### 2E — Database Schema

- [x] T035 Create migration SQL for users module: `users`, `departments`, `roles`, `role_permissions`, `user_roles` in `apps/api/src/database/migrations/001_users.sql`
- [x] T036 [P] Create migration SQL for ledger: `accounts`, `categories`, `transactions`, `transaction_attachments`, `import_batches`, `import_rows`, `exchange_rates` in `apps/api/src/database/migrations/002_ledger.sql`
- [x] T037 [P] Create migration SQL for reconciliation: `lx_purchase_orders`, `lx_po_items`, `lx_payment_requests`, `lx_delivery_orders`, `lx_suppliers`, `lx_invoices`, `recon_relations` in `apps/api/src/database/migrations/003_reconciliation.sql`
- [x] T038 [P] Create migration SQL for product dev: `projects`, `sampling_rounds`, `supplier_quotes`, `quote_tiers`, `profit_calcs`, `approvals`, `project_stage_history`, `lingxing_sync_log` in `apps/api/src/database/migrations/004_product_dev.sql`
- [x] T039 [P] Create migration SQL for system: `sync_jobs`, `sync_job_logs`, `notifications`, `audit_logs`, `settings`, `saved_views` in `apps/api/src/database/migrations/005_system.sql`
- [x] T040 Create migration runner script that executes SQL files in order in `apps/api/src/database/migrate.ts`

### 2F — Job Scheduler

- [x] T041 Implement MySQL-based job scheduler worker: poll loop (30s), pick due jobs, execute, update status, exponential backoff retry (max 3) in `apps/api/src/jobs/worker.ts`
- [x] T042 [P] Implement job registry: register job types with handler functions in `apps/api/src/jobs/registry.ts`
- [x] T043 [P] Create sync jobs API: GET /sync-jobs, POST /sync-jobs/:id/trigger, GET /sync-jobs/:id/logs in `apps/api/src/modules/sync-jobs/index.ts`

### 2G — Docker

- [x] T044 Add MinIO service to docker-compose with bucket init in `docker-compose.yml`
- [x] T045 [P] Create MinIO bucket initialization script in `scripts/init-minio.sh`

### 2H — Error & Static Pages

- [x] T046 Create Login page UI (form: username + password + remember me + submit) in `apps/web/src/pages/login/LoginPage.tsx`
- [x] T047 [P] Create 401 Unauthorized page in `apps/web/src/pages/error/Page401.tsx`
- [x] T048 [P] Create 403 Forbidden page in `apps/web/src/pages/error/Page403.tsx`
- [x] T049 [P] Create 404 Not Found page in `apps/web/src/pages/error/Page404.tsx`
- [x] T050 [P] Create 500 Server Error page in `apps/web/src/pages/error/Page500.tsx`

**Phase 2 exit criteria**: ProLayout shell renders with sidebar + header + theme tokens; common components available; backend JWT + MinIO + job worker running; all DB tables created; login page visible.

---

## Phase 3: US1 — Users & Permissions + Settings

> Ref: ui-spec-module1-users.md, ui-spec-module5-settings-dashboard.md §4-5

### Backend

- [x] T051 [US1] Implement auth login/refresh/logout/me endpoints in `apps/api/src/modules/auth/index.ts`
- [x] T052 [US1] Implement first-login forced password change logic in `apps/api/src/modules/auth/index.ts`
- [x] T053 [US1] Implement users CRUD: list (paginated, filterable), create (bcrypt), update, enable/disable, reset password, detail in `apps/api/src/modules/users/index.ts`
- [x] T054 [P] [US1] Implement departments tree CRUD: list tree, create, rename/move, soft delete in `apps/api/src/modules/users/index.ts`
- [x] T055 [P] [US1] Implement roles CRUD with 4-layer permission model (menu/operation/data/field) in `apps/api/src/modules/users/index.ts`
- [x] T056 [US1] Implement permission middleware: `requirePermission('module.entity.action')` pattern in `apps/api/src/common/auth-middleware.ts`
- [x] T057 [US1] Implement Lingxing API client: token acquisition, auto-refresh, signed request wrapper in `apps/api/src/external/lingxing/client.ts`
- [x] T058 [US1] Implement Lingxing user sync job: GET `/erp/sc/data/account/lists` → upsert local users by lingxing_uid in `apps/api/src/external/lingxing/sync-users.ts`
- [x] T059 [P] [US1] Implement settings key-value store API (GET/PUT, encrypted secrets) in `apps/api/src/modules/settings/index.ts`

### Frontend

- [x] T060 [US1] Wire login page: form submit → POST /auth/login → store JWT → redirect to dashboard in `apps/web/src/pages/login/LoginPage.tsx`
- [x] T061 [US1] Implement first-login password change modal in `apps/web/src/pages/login/FirstLoginModal.tsx`
- [x] T062 [US1] Create user list page (ProTable): search, filter by status/dept/role, batch enable/disable in `apps/web/src/pages/users/UserListPage.tsx`
- [x] T063 [US1] Create user create/edit Drawer (ProForm) with all fields per ui-spec §2 in `apps/web/src/pages/users/UserFormDrawer.tsx`
- [x] T064 [P] [US1] Create department tree page: Ant Tree + side CRUD panel in `apps/web/src/pages/users/DepartmentPage.tsx`
- [x] T065 [P] [US1] Create role management page: role list + permission checkbox matrix in `apps/web/src/pages/users/RolePage.tsx`
- [x] T066 [US1] Create audit log list page (ProTable, expandable rows, filterable) in `apps/web/src/pages/users/AuditLogPage.tsx`
- [x] T067 [US1] Create personal center page: profile edit, password change, notification preferences in `apps/web/src/pages/personal/PersonalCenter.tsx`
- [x] T068 [US1] Create settings page with tabs: Credentials / Sync Schedules / Profit Defaults in `apps/web/src/pages/settings/SettingsPage.tsx`
- [x] T069 [US1] Create settings Credentials tab: Lingxing/LemonCloud/Airwallex masked input forms (merged into SettingsPage.tsx Lingxing tab)
- [x] T070 [P] [US1] Create settings Sync Schedules tab: enable/disable toggle + cron selector + "Sync Now" per source (merged into SettingsPage.tsx Sync Jobs tab)
- [x] T071 [P] [US1] Create settings Profit Defaults tab: percentage inputs per formula field in `apps/web/src/pages/settings/ProfitDefaultsTab.tsx`
- [x] T072 [US1] Implement permission-gated dynamic menu generation and route guards in `apps/web/src/layouts/MainLayout.tsx`

**Phase 3 exit criteria**: Login → user CRUD → role/permission → department tree → settings → audit log all operational; Lingxing user sync runs; navigation permission-gated.

---

## Phase 4: US2 — Ledger (Feidee-Style)

> Ref: ui-spec-module2-ledger.md, design-system.md, visual-style-proposal.md §D

### Backend

- [x] T073 [US2] Implement accounts CRUD: create, update, list, detail, balance = SUM(transactions) in `apps/api/src/modules/ledger/accounts.ts`
- [x] T074 [P] [US2] Implement categories 2-level hierarchy CRUD (admin only, soft delete) in `apps/api/src/modules/ledger/categories.ts`
- [x] T075 [US2] Implement transactions CRUD: create, update, list (by month, grouped by date), detail, draft/submitted status in `apps/api/src/modules/ledger/transactions.ts`
- [x] T076 [US2] Implement cross-currency transfer logic: single record, from/to account+currency+amount, exchange gain/loss calc in `apps/api/src/modules/ledger/transactions.ts`
- [x] T077 [P] [US2] Implement batch transactions create API (POST /ledger/transactions/batch) in `apps/api/src/modules/ledger/transactions.ts`
- [x] T078 [US2] Implement monthly summary API: per-month income/expense/balance for left navigator in `apps/api/src/modules/ledger/reports.ts`
- [x] T079 [P] [US2] Implement counterparty auto-suggest API (GET /ledger/counterparties?q=) in `apps/api/src/modules/ledger/transactions.ts`
- [x] T080 [P] [US2] Implement transaction attachment upload + link in `apps/api/src/modules/ledger/attachments.ts`
- [x] T081 [US2] Implement exchange rate sync job: Lingxing `/currencyMonth` → `exchange_rates` table in `apps/api/src/external/lingxing/sync-exchange-rates.ts`
- [x] T082 [US2] Implement Airwallex PDF import: upload → parse → staging → dedup check → confirm in `apps/api/src/modules/ledger/import-airwallex.ts`
- [x] T083 [P] [US2] Implement Lemon Cloud API client and journal sync job in `apps/api/src/external/lemoncloud/client.ts`
- [x] T084 [US2] Implement ledger reports API: monthly summary, account balances, category breakdown in `apps/api/src/modules/ledger/reports.ts`

### Frontend — Transaction List (Feidee Dual-Panel)

- [x] T085 [US2] Create transaction list page container with dual-panel layout (left 180px + right fluid) in `apps/web/src/pages/ledger/TransactionListPage.tsx`
- [x] T086 [US2] Create monthly navigator component: year accordion → month cards (balance, income green, expense red), click loads month, active = green left border in `apps/web/src/pages/ledger/components/MonthlyNavigator.tsx`
- [x] T087 [US2] Create date-grouped transaction list: sticky date headers, transaction rows with CategoryIcon + summary + AmountText + account + time in `apps/web/src/pages/ledger/components/TransactionDateList.tsx`
- [x] T088 [US2] Create top stats bar: Balance / Income / Expense inline, account balance quick view (collapsible) in `apps/web/src/pages/ledger/components/StatsBar.tsx`
- [x] T089 [US2] Create toolbar: [+ New] primary, [Batch Entry], [Import▾], [Filter▾], [Search], [Export] in `apps/web/src/pages/ledger/components/Toolbar.tsx`
- [x] T090 [US2] Create collapsible filter bar: date range, type, account, category, currency, counterparty, amount range, status, keyword, reset in `apps/web/src/pages/ledger/components/FilterBar.tsx`
- [x] T091 [P] [US2] Create saved views dropdown component in `apps/web/src/pages/ledger/components/SavedViews.tsx`

### Frontend — Transaction Form & Detail

- [x] T092 [US2] Create transaction form Drawer (640px): type tabs (Income/Expense/Transfer/Refund), vertical form layout, CNY live calc in `apps/web/src/pages/ledger/TransactionFormDrawer.tsx`
- [x] T093 [US2] Implement transfer type fields: from/to account + currency + amount + exchange rate in `apps/web/src/pages/ledger/TransactionFormDrawer.tsx`
- [x] T094 [US2] Implement continuous entry toggle: save-and-continue (preserve date+account, clear rest) in `apps/web/src/pages/ledger/TransactionFormDrawer.tsx`
- [x] T095 [US2] Create transaction detail Drawer (800px): ProDescriptions, linked records, attachments gallery, audit trail, Prev/Next navigation in `apps/web/src/pages/ledger/TransactionDetailDrawer.tsx`

### Frontend — Batch Entry

- [x] T096 [US2] Create batch entry page: spreadsheet-like editable table, Tab/Enter navigation, inline validation in `apps/web/src/pages/ledger/BatchEntryPage.tsx`
- [x] T097 [US2] Implement batch submit: [Submit All] → batch create → result summary (N success, N failed) in `apps/web/src/pages/ledger/BatchEntryPage.tsx`

### Frontend — Accounts, Categories, Import, Reports

- [x] T098 [P] [US2] Create account list page with current balance + create/edit Drawer in `apps/web/src/pages/ledger/AccountListPage.tsx`
- [x] T099 [P] [US2] Create category management page: tree view with inline add/edit/disable in `apps/web/src/pages/ledger/CategoryPage.tsx`
- [x] T100 [US2] Create import workflow stepper: Upload → Preview (editable cells) → Dedup Check → Result (auto-redirect 5s) in `apps/web/src/pages/ledger/ImportPage.tsx`
- [x] T101 [US2] Create reports page: income/expense bar chart, account balances cards, period comparison table in `apps/web/src/pages/ledger/ReportsPage.tsx`

### Migration

- [x] T102 [US2] Create SuiShouJi migration Python script: read Excel → clean → map categories/accounts → insert MySQL → output report in `scripts/migrate-suishouji.py`

**Phase 4 exit criteria**: Feidee-style dual-panel transaction list functional; batch entry works; Airwallex PDF import works; reports render; SuiShouJi data migrated.

---

## Phase 5: US3 — Reconciliation + Workspace

> Ref: ui-spec-module3-reconciliation.md

### Backend

- [x] T103 [US3] Implement Lingxing PO sync job: `purchaseOrderList` → `lx_purchase_orders` + `lx_po_items`, full + incremental in `apps/api/src/external/lingxing/sync-purchase-orders.ts`
- [x] T104 [P] [US3] Implement Lingxing PR sync job: `requestFunds/order/list` → `lx_payment_requests` in `apps/api/src/external/lingxing/sync-payment-requests.ts`
- [x] T105 [P] [US3] Implement Lingxing DO sync job: `getInboundShipmentList` → `lx_delivery_orders` in `apps/api/src/external/lingxing/sync-delivery-orders.ts`
- [x] T106 [P] [US3] Implement Lingxing supplier sync job: `supplier` → `lx_suppliers` in `apps/api/src/external/lingxing/sync-suppliers.ts`
- [x] T107 [US3] Implement voided source handling: mark local record status='voided', preserve relations with flag in `apps/api/src/external/lingxing/sync-common.ts`
- [x] T108 [US3] Implement Lemon Cloud invoice sync: get account sets → GetInvoice per set → `lx_invoices` in `apps/api/src/external/lemoncloud/sync-invoices.ts`
- [x] T109 [US3] Implement recon_relations CRUD: create/delete link with split amount, validation (sum ≤ total), status calculation in `apps/api/src/modules/reconciliation/relations.ts`
- [x] T110 [US3] Implement recommendation engine: same supplier + date ±30d + amount ±5% → ranked candidates in `apps/api/src/modules/reconciliation/recommend.ts`
- [x] T111 [P] [US3] Implement reconciliation alerts: uninvoiced POs >30d, PRs without invoices in `apps/api/src/modules/reconciliation/alerts.ts`
- [x] T112 [P] [US3] Implement reconciliation reports: uninvoiced list, invoice-vs-purchase by supplier in `apps/api/src/modules/reconciliation/reports.ts`

### Frontend

- [x] T113 [US3] Create reconciliation overview page: stats cards (PO/PR/DO/Invoice totals, linked %, alerts), alert list, [Start Matching →] button in `apps/web/src/pages/reconciliation/OverviewPage.tsx`
- [x] T114 [US3] Create PO list page: ProTable, status badge, filters, row click → detail Drawer, sync indicator in `apps/web/src/pages/reconciliation/PurchaseOrderListPage.tsx`
- [x] T115 [P] [US3] Create PR list page: ProTable, status badge, filters, row click → detail Drawer in `apps/web/src/pages/reconciliation/PaymentRequestListPage.tsx`
- [x] T116 [P] [US3] Create DO list page: ProTable, status badge, filters, row click → detail Drawer in `apps/web/src/pages/reconciliation/DeliveryOrderListPage.tsx`
- [x] T117 [P] [US3] Create invoice list page: ProTable, status badge, filters, row click → detail Drawer in `apps/web/src/pages/reconciliation/InvoiceListPage.tsx`
- [x] T118 [US3] Create entity detail Drawer: ProDescriptions + linked records table (split amounts, progress bar) + [+ Link] button in `apps/web/src/pages/reconciliation/EntityDetailDrawer.tsx`
- [x] T119 [US3] Create linking modal: candidate list from recommendation engine + search + split amount input + confirm in `apps/web/src/pages/reconciliation/LinkingModal.tsx`
- [x] T120 [US3] Create reconciliation workspace (split-pane): left Source (PO/PR/DO) + right Target (Invoices), auto-filter by supplier, link action bar, keyboard shortcuts in `apps/web/src/pages/reconciliation/WorkspacePage.tsx`
- [x] T121 [US3] Create sync monitor page: active jobs, history ProTable, log Drawer, retry button in `apps/web/src/pages/reconciliation/SyncMonitorPage.tsx`

**Phase 5 exit criteria**: Lingxing/LemonCloud data synced; split-pane workspace enables daily matching; entity detail shows bidirectional relations; sync monitor operational.

---

## Phase 6: US4 — Product Development + Kanban

> Ref: ui-spec-module4-product-dev.md

### Backend

- [x] T122 [US4] Implement project CRUD with 13-stage state machine and stage history log in `apps/api/src/modules/product-dev/projects.ts`
- [x] T123 [P] [US4] Implement sampling rounds CRUD per project in `apps/api/src/modules/product-dev/sampling.ts`
- [x] T124 [P] [US4] Implement supplier quoting CRUD with tiered pricing in `apps/api/src/modules/product-dev/quoting.ts`
- [x] T125 [US4] Implement profit calculation engine (express/air/sea margins per formula) in `apps/api/src/modules/product-dev/profit-calc.ts`
- [x] T126 [US4] Implement approval workflow: 4 nodes, approve→advance / reject→rejected, notification on submission in `apps/api/src/modules/product-dev/approvals.ts`
- [x] T127 [US4] Implement Lingxing product sync: SKU conflict check → create SPU/SKU → log result in `apps/api/src/modules/product-dev/lingxing-sync.ts`

### Frontend

- [x] T128 [US4] Create project list page: ProTable with stage badge, filters, [+ Quick Create] mini modal + [+ Full Create] in `apps/web/src/pages/product-dev/ProjectListPage.tsx`
- [x] T129 [US4] Create Kanban board: 13 columns, horizontal scroll, drag-drop with validation, filter bar in `apps/web/src/pages/product-dev/KanbanPage.tsx`
- [x] T130 [US4] Create Kanban card component: image + name + SKU + developer + days-in-stage + status dot (🔴🟡🟢) + unread badge in `apps/web/src/pages/product-dev/components/KanbanCard.tsx`
- [x] T131 [US4] Implement Kanban card hover preview (500ms delay): cost, margin, supplier, sampling status, last activity in `apps/web/src/pages/product-dev/components/KanbanCard.tsx`
- [x] T132 [US4] Create project detail page with tabs: Overview / Sampling / Quoting / Profit Calc / Approvals / Lingxing Sync / History in `apps/web/src/pages/product-dev/ProjectDetailPage.tsx`
- [x] T133 [US4] Create sampling tab: rounds table, add/edit round Drawer, review result, approval action in `apps/web/src/pages/product-dev/tabs/SamplingTab.tsx`
- [x] T134 [P] [US4] Create quoting tab: multi-supplier comparison table, tiered pricing inline edit, preferred toggle in `apps/web/src/pages/product-dev/tabs/QuotingTab.tsx`
- [x] T135 [US4] Create profit calc tab: split-pane (inputs left, 3-scenario results right), highlight best margin, save in `apps/web/src/pages/product-dev/tabs/ProfitCalcTab.tsx`
- [x] T136 [US4] Create approvals tab: timeline of approval nodes, pending action buttons (approve/reject) in `apps/web/src/pages/product-dev/tabs/ApprovalsTab.tsx`
- [x] T137 [US4] Create Lingxing sync tab: [Sync] button, SKU conflict check, sync history table in `apps/web/src/pages/product-dev/tabs/LingxingSyncTab.tsx`
- [x] T138 [US4] Create multi-step project form (StepsForm): Basic Info → Research → Sampling → Quoting → Profit Calc → Submit in `apps/web/src/pages/product-dev/ProjectFormPage.tsx`
- [x] T139 [P] [US4] Create quick create project modal: 6 essential fields + create in `apps/web/src/pages/product-dev/QuickCreateModal.tsx`

**Phase 6 exit criteria**: Full lifecycle from ideation to Lingxing sync; Kanban with drag-drop + hover preview; profit calculator with 3 scenarios; approval workflow functional.

---

## Phase 7: US5 — Dashboard + Unified Approvals + Cross-Cutting

> Ref: ui-spec-module5-settings-dashboard.md

### Backend

- [x] T140 [US5] Implement dashboard aggregation API: my todos, financial snapshot, active projects, recent activity, system status in `apps/api/src/modules/dashboard/index.ts`
- [x] T141 [US5] Implement unified approval center API: list pending/processed approvals across modules in `apps/api/src/modules/approvals/index.ts`
- [x] T142 [US5] Implement global search API: cross-module full-text search, permission-aware in `apps/api/src/modules/search/index.ts`
- [x] T143 [US5] Implement notification CRUD: create, list, mark read, unread count in `apps/api/src/modules/notifications/index.ts`
- [x] T144 [P] [US5] Implement audit log query API: filter by user/module/entity/action/time in `apps/api/src/modules/audit-log/index.ts`
- [x] T145 [P] [US5] Implement Excel export (exceljs streaming XLSX) for all list pages in `apps/api/src/common/export.ts`
- [x] T146 [P] [US5] Implement saved views CRUD: per-user per-page filter/column/sort in `apps/api/src/modules/saved-views/index.ts`

### Frontend

- [x] T147 [US5] Create dashboard page: My Todos, Financial Snapshot, Active Projects chart, Recent Activity, System Status cards in `apps/web/src/pages/dashboard/DashboardPage.tsx`
- [x] T148 [US5] Create unified approval center page: Pending/Processed/All tabs, inline expand with project summary + decision area in `apps/web/src/pages/approvals/ApprovalCenterPage.tsx`
- [x] T149 [US5] Create global search component: top-bar search box (Ctrl+K), debounce 300ms, dropdown results grouped by module in `apps/web/src/components/GlobalSearch.tsx`
- [x] T150 [US5] Create notification center: bell icon + (N) badge + dropdown (max 5, quick approve buttons) in `apps/web/src/components/NotificationBell.tsx`
- [x] T151 [US5] Create notification full page: ProTable with type/module/time filters in `apps/web/src/pages/notifications/NotificationPage.tsx`
- [x] T152 [P] [US5] Create audit log viewer page: ProTable with expandable JSON diff rows in `apps/web/src/pages/audit/AuditLogPage.tsx`
- [x] T153 [US5] Integrate Excel export button on all list pages (uses backend export API) in `apps/web/src/components/ExportButton.tsx`
- [x] T154 [P] [US5] Integrate saved views on all list pages in `apps/web/src/components/SavedViewsDropdown.tsx`

**Phase 7 exit criteria**: Dashboard renders with permission-gated widgets; unified approval center works; global search returns cross-module results; notifications with quick approve.

---

## Phase 8: Polish & Deployment

- [x] T155 Implement ProTable virtual scroll for datasets >500 rows in `apps/web/src/components/VirtualProTable.tsx`
- [x] T156 [P] Verify route-based code splitting: one chunk per module, check bundle sizes
- [x] T157 [P] Tune query cache: 5-min stale time for reference data (users, suppliers, categories, exchange rates) in `apps/web/src/api/queryConfig.ts`
- [x] T158 [P] Implement image lazy load + MinIO presign URL caching in `apps/web/src/utils/image.ts`
- [x] T159 [P] Add page transition animation (200ms fade) and stats count-up animation in `apps/web/src/theme/animations.css`
- [x] T160 Create empty state illustrations for each module (teal accent line art) in `apps/web/src/assets/empty/`
- [x] T161 Update docker-compose: api + web (Nginx build) + MinIO in `docker-compose.yml`
- [x] T162 [P] Create Nginx config: SPA routing, API proxy, static file caching in `deploy/nginx.conf`
- [x] T163 [P] Create environment config separation (dev / test / production) in `apps/api/.env.example` and `apps/web/.env.example`
- [x] T164 Write production deployment guide (Aliyun 47.111.184.254) in `docs/deployment.md`
- [x] T165 Update API regression tests for all new endpoints in `apps/api/tests/`
- [x] T166 [P] Create external API mock mode for testing without live credentials in `apps/api/src/external/mock/`
- [x] T167 Write E2E critical path test: login → create transaction → reconcile → sync product in `apps/api/tests/e2e-critical-path.ts`

**Phase 8 exit criteria**: System deployed on test server; performance acceptable; regression tests pass; deployment guide documented.

---

## Dependencies

```
Phase 1 (Setup)
  └─ Phase 2 (Foundational)
       └─ Phase 3 (US1: Users)
            ├─ Phase 4 (US2: Ledger)          ← can start in parallel with Phase 5
            ├─ Phase 5 (US3: Reconciliation)   ← can start in parallel with Phase 4
            │    └─ Phase 6 (US4: Product Dev) ← needs US3 suppliers
            └─ Phase 7 (US5: Dashboard+Cross)  ← needs US2-US4 data
                 └─ Phase 8 (Polish)
```

## Parallel Execution Opportunities

| Tasks | Why Parallelizable |
|-------|-------------------|
| T002, T003, T004 | Independent config files |
| T006, T007, T008 | Independent type definition files |
| T021-T025 | Independent UI components, no shared state |
| T035-T039 | Independent SQL migration files per module |
| T054, T055 | Departments and roles are separate modules |
| T073, T074 | Accounts and categories are independent |
| T103-T106 | Four independent Lingxing sync jobs |
| T114-T117 | Four independent entity list pages |
| T123, T124 | Sampling and quoting are independent |
| Phase 4, Phase 5 | US2 and US3 have minimal mutual dependency |

## Summary

| Metric | Value |
|--------|-------|
| **Total tasks** | 167 |
| **Phase 1 (Setup)** | 11 tasks |
| **Phase 2 (Foundational)** | 39 tasks |
| **Phase 3 (US1: Users)** | 22 tasks |
| **Phase 4 (US2: Ledger)** | 30 tasks |
| **Phase 5 (US3: Reconciliation)** | 19 tasks |
| **Phase 6 (US4: Product Dev)** | 18 tasks |
| **Phase 7 (US5: Dashboard)** | 15 tasks |
| **Phase 8 (Polish)** | 13 tasks |
| **Parallelizable tasks** | ~60 (marked [P]) |
| **MVP scope** | Phase 1-3 (Users module, ~72 tasks) |
