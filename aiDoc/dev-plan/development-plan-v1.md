# Development Plan — Internal Platform

> Based on `speckit-specify.md` (all questions resolved ✅)
> Created: 2026-04-21

---

## Existing Codebase Assessment

### What exists (reusable)
- **Monorepo**: npm workspaces (`apps/api`, `apps/web`, `packages/shared`)
- **Backend**: raw Node.js HTTP server + TypeScript (tsx), modular structure
  - 6 modules: auth, users, ledger, reconciliation, product-dev, saved-views
  - Service + repository pattern per module
  - Common: auth-middleware, audit logging, pagination, error handling, context
  - Database: MySQL (mysql2/promise), connection pool
- **Docker**: docker-compose with api + web containers, MySQL on 192.168.1.251
- **Regression tests**: smoke-test, write-regression, error-regression, auth-users-regression

### What needs to change
- **Frontend**: complete rewrite — vanilla HTML/JS → React + Ant Design + Vite
- **Backend additions**: JWT (proper tokens), bcrypt, MinIO SDK, job scheduler, Lingxing/LemonCloud API clients
- **Shared package**: API type definitions (request/response interfaces)
- **Database**: schema expansion for all modules (currently minimal tables)
- **⚠️ Job queue**: pg-boss requires PostgreSQL but project uses MySQL → use **MySQL-based job scheduler** (custom `sync_jobs` table + polling worker) or add Redis for BullMQ

---

## Technical Decision: Job Scheduler

| Option | Pros | Cons |
|--------|------|------|
| **MySQL job table** (recommended) | No extra infra, simple, fits our scale (~20 jobs/hour) | No advanced features (priority queues, etc.) |
| BullMQ + Redis | Battle-tested, rich features | Adds Redis dependency |
| Switch to PostgreSQL | Enables pg-boss | Requires DB migration, breaks existing code |

**Recommendation**: MySQL job table. Our sync tasks are low-frequency (hourly/daily) and don't need distributed queue features. A simple `sync_jobs` table with status + scheduled_at + cron expression + worker polling is sufficient.

---

## Phase Overview

| Phase | Scope | Duration (est.) | Dependencies |
|-------|-------|---------|--------------|
| **P0** | Foundation + Scaffolding | 1 week | None |
| **P1** | Users & Permissions + Settings | 2 weeks | P0 |
| **P2** | Ledger | 3 weeks | P1 |
| **P3** | Reconciliation | 3 weeks | P1, partial P2 (accounts/exchange rate) |
| **P4** | Product Development | 3 weeks | P1, P3 (suppliers) |
| **P5** | Cross-Cutting + Polish | 2 weeks | P1-P4 |
| | **Total** | **~14 weeks** | |

> P2 and P3 have low dependency on each other and could partially overlap.

---

## Phase 0: Foundation + Scaffolding (Week 1)

### P0.1 — Frontend scaffolding
- [ ] Initialize `apps/web` with Vite + React 18 + TypeScript
- [ ] Install: `antd`, `@ant-design/pro-components`, `@ant-design/charts`
- [ ] Install: `react-router-dom@6`, `@tanstack/react-query`, `zustand`, `dayjs`, `axios`
- [ ] Set up ProLayout shell: sidebar + header + breadcrumb + user menu
- [ ] Define route structure (code-split per module)
- [ ] Create page template components: ListPage, DetailPage, FormPage, ImportPage
- [ ] Set up theme tokens (colors, typography, spacing)
- [ ] Build login page UI (no backend integration yet)
- [ ] Error pages: 401, 403, 404, 500

### P0.2 — Shared types package
- [ ] Initialize `packages/shared` with TypeScript
- [ ] Define API response envelope type (`{ code, message, data, requestId }`)
- [ ] Define pagination types (`PaginatedRequest`, `PaginatedResponse`)
- [ ] Define common entity types (User, Role, Department, etc.) — evolve per phase

### P0.3 — Backend infrastructure
- [ ] Add dependencies: `jsonwebtoken`, `bcryptjs`, `@aws-sdk/client-s3` (MinIO), `multer` (file upload), `uuid`
- [ ] Implement proper JWT auth: sign/verify, access+refresh tokens, middleware
- [ ] Add bcrypt password hashing in users module
- [ ] Add CORS middleware (for Vite dev proxy)
- [ ] Create file upload middleware + MinIO client wrapper

### P0.4 — Job scheduler
- [ ] Design `sync_jobs` table: id, job_type, cron_expr, status, scheduled_at, started_at, completed_at, result, error, retry_count, config_json
- [ ] Design `sync_job_logs` table: id, job_id, level, message, detail_json, created_at
- [ ] Implement worker: poll loop (30s interval), pick next due job, execute, update status
- [ ] Implement retry logic: exponential backoff, max 3 retries
- [ ] API: GET /sync-jobs (list), POST /sync-jobs/:id/trigger (manual), GET /sync-jobs/:id/logs

### P0.5 — Docker + MinIO
- [ ] Add MinIO service to docker-compose (test env)
- [ ] Create bucket initialization script
- [ ] Presigned URL generation utility

### P0.6 — Database schema (full design)
- [ ] Users: `users`, `departments`, `roles`, `role_permissions`, `user_roles`
- [ ] Ledger: `accounts`, `categories`, `transactions`, `transaction_attachments`, `import_batches`
- [ ] Reconciliation: `lx_purchase_orders`, `lx_payment_requests`, `lx_delivery_orders`, `lx_suppliers`, `lx_invoices`, `recon_relations`
- [ ] Product Dev: `projects`, `sampling_rounds`, `supplier_quotes`, `quote_tiers`, `profit_calcs`, `approvals`, `lingxing_sync_log`
- [ ] System: `sync_jobs`, `sync_job_logs`, `notifications`, `audit_logs`, `settings`, `saved_views`
- [ ] Create migration SQL files (versioned)

**Deliverable**: App skeleton running locally — login page visible, ProLayout shell, API health check, MinIO accessible.

---

## Phase 1: Users & Permissions + Settings (Weeks 2-3)

### P1.1 — Backend: Auth
- [ ] POST /auth/login — validate credentials, return JWT access+refresh tokens
- [ ] POST /auth/refresh — renew access token
- [ ] POST /auth/logout — invalidate refresh token
- [ ] GET /auth/me — current user info + permissions
- [ ] First-login forced password change flag

### P1.2 — Backend: Users CRUD
- [ ] GET /users — list (paginated, filterable by status/department/role)
- [ ] POST /users — create (hash password, validate unique username)
- [ ] PUT /users/:id — update (profile fields)
- [ ] PUT /users/:id/status — enable/disable (soft, no delete)
- [ ] PUT /users/:id/password — admin reset password
- [ ] GET /users/:id — detail with roles, department, audit history

### P1.3 — Backend: Departments
- [ ] GET /departments — tree structure
- [ ] POST /departments — create node
- [ ] PUT /departments/:id — rename/move
- [ ] DELETE /departments/:id — soft delete (only if no active members)

### P1.4 — Backend: Roles & Permissions
- [ ] GET /roles — list
- [ ] POST /roles — create with permission set
- [ ] PUT /roles/:id — update permissions
- [ ] DELETE /roles/:id — soft delete (only if no users assigned)
- [ ] Permission definitions: menu (page visibility), operation (CRUD/export/sync), data scope (self/dept/all)
- [ ] Middleware: `requirePermission('ledger.transactions.read')` pattern

### P1.5 — Backend: Lingxing user sync
- [ ] Lingxing API client: token acquisition, auto-refresh, request wrapper
- [ ] Sync job: GET `/erp/sc/data/account/lists` → upsert local users by lingxing_uid
- [ ] Map fields: uid→lingxing_uid, realname→display_name, username, mobile, email, status

### P1.6 — Backend: Settings
- [ ] GET/PUT /settings — key-value store (credentials, sync config, profit defaults)
- [ ] Settings encrypted at rest for sensitive values (API keys)

### P1.7 — Frontend: Login page
- [ ] Login form: username + password + remember me
- [ ] JWT storage (httpOnly cookie or localStorage) + auto-refresh interceptor
- [ ] Redirect to dashboard on success
- [ ] First-login password change modal

### P1.8 — Frontend: User management
- [ ] User list page (ProTable): search, filter by status/dept/role, batch enable/disable
- [ ] User create/edit drawer (ProForm)
- [ ] Department tree page (Tree + CRUD panel)
- [ ] Role management page: role list + permission matrix editor
- [ ] Audit log list (per user or global)

### P1.9 — Frontend: Settings page
- [ ] Tabs: Credentials | Sync Schedules | Profit Defaults | Accounts | Categories
- [ ] Credentials tab: Lingxing/LemonCloud/Airwallex key-value forms (masked input)
- [ ] Sync tab: enable/disable toggle + cron frequency selector + "Sync Now" button per source
- [ ] Profit defaults tab: percentage inputs (commission, storage, ad, return, shipping rates)

### P1.10 — Frontend: Personal center
- [ ] Profile edit (name, avatar, phone, email)
- [ ] Change password
- [ ] My notifications list

### P1.11 — Frontend: Permission-gated navigation
- [ ] Dynamic menu generation based on user permissions
- [ ] Route guards: redirect to 403 if no permission
- [ ] Hide toolbar buttons (create/delete/export) based on operation permissions

**Deliverable**: Full login → user management → role/permission → settings workflow. Admin can create users, assign roles, configure external credentials. Lingxing user sync runs daily.

---

## Phase 2: Ledger (Weeks 4-6)

### P2.1 — Backend: Accounts
- [ ] CRUD for accounts (bank/Airwallex/cash/other)
- [ ] Fields: name, type, currency, bank_name, account_number, opening_balance (0), opening_date, status
- [ ] Balance calculation: derived from transactions (no stored balance column; query SUM)

### P2.2 — Backend: Categories
- [ ] 2-level hierarchy: parent categories + child categories
- [ ] CRUD (admin only), soft delete
- [ ] Seed defaults from SuiShouJi category mapping

### P2.3 — Backend: Transactions
- [ ] CRUD with draft/submitted status
- [ ] Types: income, expense, transfer, refund
- [ ] Fields: date, amount, currency, exchange_rate, cny_equivalent, account_id, category_id, counterparty, summary, remark, reimbursement_flag, invoice_flag, linked_recon_id (optional)
- [ ] **Transfer**: single record with from_account + from_amount + from_currency + to_account + to_amount + to_currency + exchange_gain_loss
- [ ] Attachment upload (MinIO) + link to transaction
- [ ] Counterparty auto-suggest from history

### P2.4 — Backend: Exchange rate sync
- [ ] Job: POST Lingxing `/erp/sc/routing/finance/currency/currencyMonth`
- [ ] Store: `exchange_rates` table (year_month, currency_code, official_rate, custom_rate, updated_at)
- [ ] API: GET /exchange-rates?month=2026-04 — for frontend forms

### P2.5 — Backend: Airwallex PDF import
- [ ] POST /import/airwallex — upload PDF
- [ ] PDF parser (pdf-parse or pdfjs-dist): extract transaction rows
- [ ] **Dedup logic**: check filename in import_batches; check date+amount+account in transactions
- [ ] Staging: save parsed rows to `import_batches` + `import_rows`
- [ ] PUT /import/:batchId/confirm — post confirmed rows as transactions

### P2.6 — Backend: Lemon Cloud journal sync (when credentials available)
- [ ] Lemon Cloud API client: auth, request wrapper
- [ ] Sync job: GetCDAccounts → GetCDJournal per account → staging
- [ ] Map to local transactions

### P2.7 — Backend: Reports
- [ ] GET /ledger/reports/summary?period=monthly — income/expense/balance by period
- [ ] GET /ledger/reports/account-balances — all accounts current balance
- [ ] GET /ledger/reports/category — breakdown by category

### P2.8 — Frontend: Transaction list
- [ ] ProTable with columns: date, type, amount, currency, account, category, counterparty, summary, status (draft/submitted), attachments indicator
- [ ] Collapsible filter bar: date range, type, account, category, amount range, keyword
- [ ] Saved views
- [ ] Excel export
- [ ] Batch operations: submit drafts, delete drafts

### P2.9 — Frontend: Transaction form
- [ ] Type selector (income/expense/transfer/refund)
- [ ] Dynamic fields per type (transfer shows from/to accounts + currencies)
- [ ] Exchange rate auto-fill from synced rates (editable)
- [ ] CNY equivalent live calculation
- [ ] Category cascade picker (2-level)
- [ ] Counterparty auto-complete
- [ ] Attachment upload (drag-drop)
- [ ] Save as draft / Submit

### P2.10 — Frontend: Account management
- [ ] Account list with current balance (computed)
- [ ] Create/edit drawer
- [ ] Account detail: transaction history filtered by this account

### P2.11 — Frontend: Category management
- [ ] Tree view with drag-reorder
- [ ] Add/edit/disable inline

### P2.12 — Frontend: Import workflow
- [ ] Stepper: Upload → Preview → Dedup Check → Confirm
- [ ] Upload: drag-drop PDF, filename dedup warning
- [ ] Preview: parsed transactions table (editable cells for category/counterparty)
- [ ] Dedup: highlight duplicates in red, modal with "confirm anyway" checkbox
- [ ] Confirm: post to backend, success summary

### P2.13 — Frontend: Reports
- [ ] Income/expense summary chart (bar + line)
- [ ] Account balances cards
- [ ] Period comparison table

### P2.14 — SuiShouJi migration script
- [ ] Python script: read Excel (openpyxl), clean data, map categories, map accounts, insert into MySQL
- [ ] Handle 4 sheet types (expense/income/transfer/refund)
- [ ] Map SuiShouJi category → system category (manual mapping table)
- [ ] Map SuiShouJi account → system account
- [ ] Output: migration report (imported count, skipped, errors)

**Deliverable**: Complete bookkeeping system operational. Can create accounts, record transactions (including cross-currency transfers), import Airwallex PDF, view reports. SuiShouJi data migrated.

---

## Phase 3: Reconciliation (Weeks 7-9)

### P3.1 — Backend: Lingxing sync clients
- [ ] Reuse Lingxing API client from P1.5
- [ ] PO sync job: `purchaseOrderList` → `lx_purchase_orders` (with line items)
- [ ] PR sync job: `requestFunds/order/list` → `lx_payment_requests`
- [ ] DO sync job: `getInboundShipmentList` → `lx_delivery_orders`
- [ ] Supplier sync job: `supplier` → `lx_suppliers`
- [ ] All: full initial sync + incremental by update_time
- [ ] Voided source handling: mark local record status = 'voided'

### P3.2 — Backend: Lemon Cloud invoice sync
- [ ] Get all account set IDs
- [ ] Per account set: `GetInvoice` → `lx_invoices`
- [ ] Fields: invoice_code, invoice_number, invoice_date, amount_with_tax, amount_without_tax, tax_amount, tax_rate, seller_name, buyer_name, items, status
- [ ] Incremental by date range

### P3.3 — Backend: Reconciliation relationships
- [ ] `recon_relations` table: id, source_type (invoice/po/pr/do), source_id, target_type, target_id, amount, created_by, created_at
- [ ] Many-to-many with split amounts
- [ ] Validation: sum of split amounts ≤ source total
- [ ] Status calculation per entity: not_linked / partially / fully_linked / do_not_remind
- [ ] Alerts: query uninvoiced POs, PRs without invoices, uncovered DOs

### P3.4 — Backend: Recommendation engine
- [ ] Rule-based matching: same supplier + date within 30 days + amount ±5%
- [ ] Return ranked candidate list with match score
- [ ] API: GET /reconciliation/:type/:id/candidates

### P3.5 — Backend: Reports
- [ ] Uninvoiced PO list
- [ ] Invoice vs purchase comparison by supplier
- [ ] Supplier invoice summary

### P3.6 — Frontend: Reconciliation overview
- [ ] Stats cards: total POs/PRs/DOs/Invoices, linked %, unlinked count, alerts count
- [ ] Alert list: clickable, links to source record

### P3.7 — Frontend: Tabbed list pages
- [ ] 4 tabs: Purchase Orders / Payment Requests / Delivery Orders / Invoices
- [ ] Each tab: ProTable with relevant columns, status badge, filter bar
- [ ] Row click → detail drawer
- [ ] Sync status indicator per tab + "Sync Now" button (admin)

### P3.8 — Frontend: Detail page with relations
- [ ] Entity info (ProDescriptions)
- [ ] Related records table with split amounts
- [ ] "Add relation" button → modal with candidate list (from recommendation engine)
- [ ] Amount splitter: input split amount per relation
- [ ] Bidirectional: from Invoice → see POs/PRs/DOs; from PO → see Invoices

### P3.9 — Frontend: Sync monitoring
- [ ] Job history table (from sync_jobs/sync_job_logs)
- [ ] Status badges (success/failed/running)
- [ ] Log viewer drawer
- [ ] Manual retry button

**Deliverable**: Full reconciliation workflow: Lingxing data synced, invoices from Lemon Cloud, manual/semi-auto relationship creation, status tracking, alerts.

---

## Phase 4: Product Development (Weeks 10-12)

### P4.1 — Backend: Project CRUD
- [ ] Full lifecycle state machine: 13 stages with valid transitions
- [ ] Project master data fields (per spec)
- [ ] Stage history log (who moved to which stage, when, reason)

### P4.2 — Backend: Sampling
- [ ] CRUD for sampling rounds per project
- [ ] Fields: round_number, supplier_id, cost, timeline, images[], review_result, rejection_reason, improvement_notes, confirmed_at
- [ ] Approval: sampling approval triggers notification

### P4.3 — Backend: Supplier quoting
- [ ] CRUD for quotes per project
- [ ] Multi-supplier comparison
- [ ] Tiered pricing: `quote_tiers` (min_qty, max_qty, unit_price)
- [ ] Fields: supplier_id, lingxing_supplier_id, urls[], notes, lead_time, preferred, currency, tax_included, tax_rate, MOQ

### P4.4 — Backend: Profit calculation
- [ ] Implement formula engine (per spec)
- [ ] Inputs validation, exchange rate auto-fill from synced rates
- [ ] 3 scenario results (express/air/sea margin)
- [ ] Store calc results linked to project
- [ ] API: POST /product-dev/:projectId/profit-calc, GET history

### P4.5 — Backend: Approval workflow
- [ ] Approval nodes: sampling / project / finalization / online
- [ ] Per node: approver list, submit time, result, opinion, rejection reason
- [ ] On approval → advance project stage; on rejection → move to rejected stage
- [ ] Notification to approver on submission

### P4.6 — Backend: Lingxing product sync
- [ ] Pre-check: query `productList` for SKU conflict
- [ ] Create SPU: POST `/erp/sc/routing/storage/spu/set`
- [ ] Create SKU: POST `/erp/sc/routing/storage/product/set`
- [ ] Map all fields per spec (dimensions, weight, images, supplier quotes, etc.)
- [ ] Log: `lingxing_sync_log` (project_id, request, response, status, error, operator, timestamp)
- [ ] Retry support

### P4.7 — Frontend: Project list
- [ ] ProTable: project name, SKU, stage, developer, owner, created, updated
- [ ] Status badge per stage
- [ ] Filters: stage, developer, owner, date range, keyword
- [ ] Quick actions: advance stage, open detail

### P4.8 — Frontend: Project form (multi-step)
- [ ] Step 1: Basic info (name, type, SKU, material, tags, developer, owner, market, platform)
- [ ] Step 2: Research (competitor links, images, research files upload)
- [ ] Step 3: Sampling (rounds management — add/edit/review)
- [ ] Step 4: Quoting (multi-supplier table, tiered pricing inline edit)
- [ ] Step 5: Profit calc (live calculator with 3 scenarios)
- [ ] Step 6: Approval submission

### P4.9 — Frontend: Kanban board
- [ ] 13 columns (stages), cards show: project name, SKU, developer avatar, days-in-stage
- [ ] Drag-drop to advance stage (with validation — some transitions require approval)
- [ ] Card click → detail drawer
- [ ] Filter by developer / owner

### P4.10 — Frontend: Profit calculator
- [ ] Live preview: inputs on left, 3-column result on right
- [ ] Exchange rate auto-fill (editable)
- [ ] Shipping rate auto-fill from settings defaults (editable)
- [ ] Highlight best margin scenario
- [ ] Save result to project

### P4.11 — Frontend: Lingxing sync
- [ ] "Sync to Lingxing" button (visible after online approval stage)
- [ ] Pre-sync: SKU conflict check → show warning if conflict
- [ ] Sync progress indicator
- [ ] Result: success (show Lingxing product link) / failure (show error, retry button)
- [ ] Sync history table

**Deliverable**: Full product development lifecycle from ideation to Lingxing sync. Kanban board, sampling, quoting, profit calc, approval, sync all working.

---

## Phase 5: Cross-Cutting + Polish (Weeks 13-14)

### P5.1 — Dashboard
- [ ] My todos widget (pending approvals, unlinked POs, draft transactions)
- [ ] Financial snapshot (permission-gated)
- [ ] Active projects by stage (bar chart)
- [ ] Recent activity feed
- [ ] External system status cards

### P5.2 — Global search
- [ ] Backend: unified search endpoint across modules
- [ ] Frontend: top-bar search box with dropdown results grouped by module
- [ ] Permission-aware filtering

### P5.3 — Notification center
- [ ] Backend: notification CRUD + WebSocket push (or SSE)
- [ ] Frontend: bell icon + dropdown + unread badge + mark-as-read
- [ ] Types: sync failure, approval pending, reconciliation alert

### P5.4 — Global audit log viewer
- [ ] Backend: query with filters (user, module, entity, action, time)
- [ ] Frontend: ProTable with expandable rows (before/after JSON diff)

### P5.5 — Excel export
- [ ] Backend: streaming CSV/XLSX generation (exceljs)
- [ ] Frontend: "Export" button on every list page (exports current filter)

### P5.6 — Saved views
- [ ] Backend: CRUD for saved views (user_id, page_key, filter_config, column_config, sort_config)
- [ ] Frontend: "Save View" / "Load View" dropdown on list pages

### P5.7 — Performance
- [ ] ProTable virtual scroll for large datasets
- [ ] Route-based code splitting verification
- [ ] TanStack Query cache tuning (stale time per resource type)
- [ ] Image lazy load + MinIO presign URL caching

### P5.8 — Deployment
- [ ] Update docker-compose: api + web (Nginx) + MinIO
- [ ] Nginx config: SPA routing, API proxy, static file caching
- [ ] Environment config separation (dev / test / production)
- [ ] Production deployment guide (Aliyun)

### P5.9 — Testing
- [ ] API regression tests update for all new endpoints
- [ ] Critical path E2E scenarios (login → create transaction → reconcile → sync product)
- [ ] External API mock mode for testing without live credentials

---

## Dependency Graph

```
P0 Foundation
 ├── P1 Users & Settings
 │    ├── P2 Ledger
 │    │    └── P5 Polish (reports, export, saved views)
 │    ├── P3 Reconciliation
 │    │    └── P5 Polish (alerts, search, notifications)
 │    └── P4 Product Dev (needs P3.suppliers)
 │         └── P5 Polish (kanban perf, sync monitoring)
 └── P5 Dashboard, Global Search, Audit Log
```

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Lemon Cloud credentials delayed | Blocks invoice sync + journal sync | Implement with mock data; plug in real API when ready |
| Lingxing rate limiting | Slow sync, 429 errors | Respect token bucket, queue with delays, retry with backoff |
| Airwallex PDF format change | Parser breaks | Modular parser with format versioning, alert on parse failures |
| Large SuiShouJi migration (4000+ rows) | Slow import, potential duplicates | Python script with dry-run mode, transaction batching, idempotent by date+amount+account |
| MinIO disk space on test server | Storage full | Monitor usage, set retention policy, alert at 80% |

---

## Milestone Summary

| Week | Milestone | Demo |
|------|-----------|------|
| 1 | Foundation done | Login page + ProLayout shell visible |
| 3 | Users complete | Admin can manage users, roles, departments; Lingxing user sync working |
| 6 | Ledger complete | Full bookkeeping: transactions, transfers, Airwallex import, reports; SuiShouJi migrated |
| 9 | Reconciliation complete | Lingxing data synced, invoice matching, status tracking, alerts |
| 12 | Product Dev complete | Full lifecycle, kanban, profit calc, Lingxing product sync |
| 14 | System complete | Dashboard, search, notifications, audit log, deployment ready |
