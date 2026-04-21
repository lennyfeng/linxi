# Development Plan v2 — Internal Platform

> Based on: speckit-specify.md + UI specs (Module 1-5) + UX review + visual design system
> Updated: 2026-04-21
> Visual style: 清新爽快 (Feidee-inspired, mint green primary)

---

## Codebase Assessment

### Reusable
- Monorepo: npm workspaces (`apps/api`, `apps/web`, `packages/shared`)
- Backend: Node.js HTTP + TypeScript, 6 modules, service+repository pattern, MySQL (mysql2/promise)
- Docker: docker-compose (api + web), MySQL on 192.168.1.251
- Regression tests: smoke, write, error, auth-users

### Needs Change
- **Frontend**: vanilla HTML/JS → React 18 + Vite + Ant Design 5 + ProComponents
- **Backend additions**: JWT, bcrypt, MinIO SDK, job scheduler, Lingxing/LemonCloud API clients
- **Database**: full schema for all modules
- **Job queue**: MySQL-based (not pg-boss, since we use MySQL)

---

## Phase Overview

| Phase | Scope | Duration | Dependencies |
|-------|-------|----------|-------------|
| **P0** | Foundation + Design System | 1 week | None |
| **P1** | Users & Permissions + Settings | 2 weeks | P0 |
| **P2** | Ledger (Feidee-style UI) | 3 weeks | P1 |
| **P3** | Reconciliation + Workspace | 3 weeks | P1 |
| **P4** | Product Dev + Kanban | 3 weeks | P1, P3 (suppliers) |
| **P5** | Dashboard + Cross-Cutting + Polish | 2 weeks | P1-P4 |
| | **Total** | **~14 weeks** | |

---

## Phase 0: Foundation (Week 1)

### P0.1 Frontend Scaffolding
> Ref: design-system.md, visual-style-proposal.md

- [ ] Vite + React 18 + TypeScript project in `apps/web`
- [ ] Dependencies: antd, @ant-design/pro-components, react-router-dom@6, zustand, axios, dayjs, lucide-react
- [ ] **Design system tokens**: mint green `#00B894` primary, `#F5F7FA` bg, white sidebar, 8px radius (see design-system.md §5)
- [ ] **ProLayout shell**: white sidebar (240px) + 56px header + breadcrumb + user avatar menu
- [ ] Active menu: 3px left green border + `#E8FBF5` bg + `#00B894` text
- [ ] **Global shortcuts**: `Ctrl+N` new transaction, `Ctrl+K` search, `Ctrl+S` save, `Esc` close
- [ ] Route structure (code-split per module):
  ```
  /                    → Dashboard
  /login               → Login
  /approvals           → Unified Approval Center
  /users/*             → Module 1
  /ledger/*            → Module 2
  /reconciliation/*    → Module 3
  /product-dev/*       → Module 4
  /settings/*          → Module 5
  /notifications       → Notification Center
  ```
- [ ] Common components: AmountText (colored, right-aligned, tabular nums), StatusBadge (dot+text+bg), CategoryIcon (colored circle + Lucide), EmptyState
- [ ] Login page UI (username + password + remember me)
- [ ] Error pages: 401, 403, 404, 500

### P0.2 Shared Types
- [ ] `packages/shared`: API envelope, pagination, common entity interfaces

### P0.3 Backend Infra
- [ ] JWT auth (access 2h + refresh 7d), bcrypt, CORS, MinIO client, file upload middleware

### P0.4 Job Scheduler
- [ ] `sync_jobs` + `sync_job_logs` tables
- [ ] Worker: 30s polling, exponential backoff retry (max 3)
- [ ] API: list jobs, trigger manual, view logs

### P0.5 Docker + MinIO
- [ ] MinIO service in docker-compose, bucket init script, presigned URL utility

### P0.6 Database Schema
- [ ] Full migration SQL for all modules (users, ledger, reconciliation, product-dev, system)
- [ ] Versioned migration files

**Deliverable**: Login page + ProLayout shell + design tokens + API health check + MinIO running.

---

## Phase 1: Users & Permissions + Settings (Weeks 2-3)

> Ref: ui-spec-module1-users.md, ui-spec-module5-settings-dashboard.md

### P1.1-1.6 Backend
- [ ] Auth: login/refresh/logout/me, first-login password change
- [ ] Users CRUD: list (paginated), create (bcrypt), update, enable/disable, admin reset password
- [ ] Departments: tree CRUD, soft delete
- [ ] Roles & Permissions: CRUD, 4-layer permission model (menu/operation/data/field)
- [ ] Middleware: `requirePermission('module.entity.action')` pattern
- [ ] Lingxing user sync job (daily)
- [ ] Settings key-value store (encrypted for secrets)

### P1.7-1.11 Frontend
- [ ] **Login page**: form → JWT storage → auto-refresh interceptor → redirect
- [ ] **User list** (ProTable): search, filter status/dept/role, batch enable/disable
- [ ] **User create/edit Drawer** (ProForm): fields per ui-spec-module1 §2
- [ ] **Department tree page**: Ant Tree + side CRUD panel
- [ ] **Role management**: role list + permission checkbox matrix (per ui-spec-module1 §5)
- [ ] **Audit log list**: ProTable with expandable detail (per ui-spec-module1 §6)
- [ ] **Personal center**: profile edit, password change, notification preferences (per ui-spec-module5 §3)
- [ ] **Settings page** (admin, tabs): Credentials / Sync Schedules / Profit Defaults / Accounts / Categories
- [ ] **Permission-gated navigation**: dynamic menu + route guards + button hide

**Deliverable**: Full auth + user management + settings. Admin can configure external credentials.

---

## Phase 2: Ledger (Weeks 4-6)

> Ref: ui-spec-module2-ledger.md (Feidee-inspired dual-panel layout)

### P2.1-2.7 Backend
- [ ] Accounts CRUD, balance = SUM(transactions)
- [ ] Categories: 2-level hierarchy, admin CRUD, seed defaults
- [ ] Transactions: CRUD, draft/submitted status, 4 types (income/expense/transfer/refund)
- [ ] **Transfer**: single record with from/to account+currency+amount, exchange gain/loss
- [ ] Batch create API (for batch entry mode)
- [ ] Monthly summary API: per-month income/expense/balance (for left navigator)
- [ ] Transaction list API: grouped by date, filtered by month
- [ ] Attachment upload (MinIO) + link to transaction
- [ ] Counterparty auto-suggest API
- [ ] Exchange rate sync job (Lingxing monthly)
- [ ] Airwallex PDF import: upload → parse → staging → dedup check → confirm
- [ ] Lemon Cloud journal sync (when credentials ready)
- [ ] Reports: monthly summary, account balances, category breakdown

### P2.8 Frontend: Transaction List (Feidee-style)
> This is the most important UI — reference ui-spec-module2 §1 + screenshot

- [ ] **Dual-panel layout**: left monthly navigator (180px) + right date-grouped list
- [ ] **Monthly navigator**: year accordion → month cards (balance, income green, expense red)
- [ ] Click month → load/scroll to that month's transactions
- [ ] Active month: left green border + `#E8FBF5` bg
- [ ] **Date group headers**: sticky "April 21, Today" separators
- [ ] **Transaction rows**: category icon (colored circle 32px) + summary + amount (right-aligned, colored) + account + time
- [ ] Row hover: `#F5F7FA` bg, no grid lines (just bottom 1px `#F0F2F5`)
- [ ] Row click → Transaction Detail Drawer (800px)
- [ ] **Top stats bar**: Balance / Income / Expense inline (per Feidee), Account Balance Quick View (collapsible)
- [ ] **Toolbar**: [+ New] primary button, [Batch Entry], [Import▾], [Filter▾], [Search], [Export]
- [ ] **Filter bar** (collapsible): date range, type, account, category, currency, counterparty, amount range, status, keyword
- [ ] Saved views dropdown, Excel export, batch operations (submit/delete drafts)

### P2.9 Frontend: Transaction Form Drawer (640px)
> Ref: ui-spec-module2 §3

- [ ] **Type Tabs** at top: [Income] [Expense] [Transfer] [Refund] — switch preserves shared fields
- [ ] Vertical form: Date, Account, Amount, Category (cascader with Recent 5), Counterparty (autocomplete), Summary, Remark, Attachments (drag-drop)
- [ ] Transfer type: from/to account + currency + amount + exchange rate
- [ ] CNY equivalent live calculation
- [ ] **Footer**: [Save] primary (submit) + [Save▾] dropdown → [Save as Draft]
- [ ] **Continuous entry toggle**: ☐ save-and-continue (preserves date+account, clears rest)

### P2.10 Frontend: Batch Entry Mode `/ledger/transactions/batch`
> Ref: ui-spec-module2 §2a

- [ ] Spreadsheet-like editable table (2-line rows: core fields + counterparty/summary)
- [ ] Tab between cells, Enter next row, click + to add row
- [ ] Defaults: date=today, type=expense, account=last used, currency=CNY
- [ ] Inline validation (red border)
- [ ] [Submit All] → batch create → result summary (N success, N failed)
- [ ] Only Income/Expense/Refund (no Transfer in batch)

### P2.11 Frontend: Transaction Detail Drawer (800px)
> Ref: ui-spec-module2 §4

- [ ] ProDescriptions layout
- [ ] Linked records section (optional: payment request / invoice link, clickable jump)
- [ ] Attachments gallery (image preview, PDF inline viewer)
- [ ] Audit trail (created by, edited by, timestamps)
- [ ] **Footer navigation**: [← Prev] [Next →] buttons (follow current list order)
- [ ] [Edit] → switch to form mode in same Drawer

### P2.12-2.13 Frontend: Accounts, Categories, Import, Reports
- [ ] Account list + balance + create/edit drawer
- [ ] Category tree with inline add/edit/disable
- [ ] **Import stepper**: Upload → Preview (editable cells) → Dedup Check → Result (auto-redirect 5s)
- [ ] **Reports**: income/expense bar chart, account balances cards, period comparison table

### P2.14 SuiShouJi Migration
- [ ] Python script: read Excel → clean → map categories/accounts → insert MySQL
- [ ] Output: migration report

**Deliverable**: Complete Feidee-style bookkeeping. Dual-panel transaction list, batch entry, continuous entry, Airwallex import, reports.

---

## Phase 3: Reconciliation (Weeks 7-9)

> Ref: ui-spec-module3-reconciliation.md (includes Workspace)

### P3.1-3.5 Backend
- [ ] Lingxing sync: PO/PR/DO/Supplier (reuse API client), full + incremental by update_time
- [ ] Voided source handling: mark local record voided, preserve relations with ⚠️ flag
- [ ] Lemon Cloud invoice sync: get account sets → GetInvoice per set → store
- [ ] `recon_relations` table: many-to-many with split amounts, validation
- [ ] Status calculation: not_linked / partial / fully_linked / do_not_remind
- [ ] Recommendation engine: supplier + date ±30d + amount ±5% → ranked candidates
- [ ] Alerts: uninvoiced POs >30d, PRs without invoices
- [ ] Reports: uninvoiced list, invoice-vs-purchase by supplier

### P3.6 Frontend: Overview `/reconciliation`
- [ ] Stats cards: PO/PR/DO/Invoice totals, linked %, unlinked count, alert count
- [ ] Alert list (clickable → source record)
- [ ] **[Start Matching →]** shortcut button → opens Workspace

### P3.7 Frontend: Entity List Pages (PO/PR/DO/Invoice)
- [ ] Each: ProTable + filter bar + status badge + row click → detail Drawer
- [ ] Sync status indicator + "Sync Now" button (admin)
- [ ] Standard table style: no vertical dividers, hover `#F5F7FA`, header `#FAFBFC`

### P3.8 Frontend: Entity Detail Drawer
- [ ] ProDescriptions + linked records table (split amounts, progress bar)
- [ ] [+ Link Invoice/PO] → Linking Modal (candidates + search + split amount editor)
- [ ] [✕] remove link (confirm dialog)
- [ ] Sync log section

### P3.9 Frontend: Reconciliation Workspace `/reconciliation/workspace`
> Ref: ui-spec-module3 §8 — KEY UX IMPROVEMENT

- [ ] **Split-pane layout**: left panel (Source: PO/PR/DO) + right panel (Target: Invoices)
- [ ] Source/Target type selectors at top of each panel
- [ ] Both panels: mini table with compact rows (entity#, amount, supplier, unlinked remaining)
- [ ] "Unlinked only" checkbox checked by default
- [ ] **Smart filtering**: select source row → right panel auto-filters to same supplier (fuzzy match)
- [ ] **Link Action Bar** at bottom: selected pair + split amount input + [Create Link]
- [ ] **Keyboard shortcuts**: ↑↓ navigate, Tab switch panels, Enter confirm link, Esc deselect
- [ ] After link → both panels refresh, status updates

### P3.10 Frontend: Sync Monitor `/reconciliation/sync`
- [ ] Active jobs table (status badges: ✅🔄❌⏭️)
- [ ] Job history ProTable (paginated, filterable)
- [ ] Log Drawer (raw request/response), [Retry] for failed

**Deliverable**: Full reconciliation with split-pane Workspace for daily matching work.

---

## Phase 4: Product Development (Weeks 10-12)

> Ref: ui-spec-module4-product-dev.md (with hover preview + quick create)

### P4.1-4.6 Backend
- [ ] Project CRUD: 13-stage state machine, stage history log
- [ ] Sampling: rounds CRUD, approval trigger notification
- [ ] Supplier quoting: multi-supplier, tiered pricing
- [ ] Profit calculation: formula engine (express/air/sea margins), store results
- [ ] Approval workflow: 4 nodes (sampling/project/finalization/online), approve→advance / reject→rejected
- [ ] Lingxing product sync: SKU conflict check → create SPU/SKU → log result

### P4.7 Frontend: Project List `/product-dev/projects`
- [ ] ProTable: name, SKU, stage badge, developer, owner, platform, dates
- [ ] Filters: stage, developer, owner, platform, date, keyword
- [ ] **[+ Quick Create]** mini modal (6 fields) + **[+ Full Create]** multi-step form
- [ ] Row click → project detail page

### P4.8 Frontend: Kanban Board `/product-dev/kanban`
> Ref: ui-spec-module4 §2

- [ ] 13 columns (horizontal scroll), column header = stage name + count
- [ ] **Card layout**: image + name + SKU + developer + owner + days-in-stage + target price
- [ ] **Status dot**: 🔴 Blocked / 🟡 Waiting / 🟢 On track (per logic in spec)
- [ ] **Unread activity badge** on card
- [ ] **Card hover preview** (500ms delay): cost, margin, supplier, sampling status, last activity
- [ ] **Drag-drop**: valid zones green, invalid grayed; confirm dialog; approval-required dialog
- [ ] Card click → Drawer with summary + [Open Detail]
- [ ] Filter bar: developer, owner, platform, search

### P4.9 Frontend: Project Detail `/product-dev/projects/:id`
- [ ] Tabbed layout: Overview / Sampling / Quoting / Profit Calc / Approvals / Lingxing Sync / History
- [ ] **Overview tab**: ProDescriptions, stage progress bar, images gallery
- [ ] **Sampling tab**: rounds table, add/edit round Drawer, review result, approval action
- [ ] **Quoting tab**: multi-supplier comparison table, tiered pricing inline edit, preferred toggle
- [ ] **Profit Calc tab**: split-pane (inputs left, 3-scenario results right), exchange/shipping rate auto-fill, highlight best margin, save to project
- [ ] **Approvals tab**: timeline of approval nodes, pending action buttons
- [ ] **Lingxing Sync tab**: [Sync to Lingxing] button (post online-approval), SKU conflict check, sync history

### P4.10 Frontend: Multi-Step Project Form
- [ ] StepsForm: Basic Info → Research → Sampling → Quoting → Profit Calc → Submit
- [ ] Each step per ui-spec-module4 §3

**Deliverable**: Full product lifecycle with enhanced Kanban (hover preview, status dots, quick create).

---

## Phase 5: Dashboard + Cross-Cutting (Weeks 13-14)

> Ref: ui-spec-module5-settings-dashboard.md

### P5.1 Dashboard `/`
- [ ] Permission-gated widgets: My Todos, Financial Snapshot, Active Projects (bar chart), Recent Activity, System Status
- [ ] My Todos: pending approvals count (click → /approvals), draft transactions, unlinked POs

### P5.2 Unified Approval Center `/approvals`
> Ref: ui-spec-module5 §3a — KEY UX IMPROVEMENT

- [ ] Tabs: Pending (count) / Processed / All
- [ ] ProTable: project, type, submitter, submitted time, expand action
- [ ] **Inline expand**: project summary + profit calc + submitter notes + [View Full Project →]
- [ ] **Decision area**: opinion input + [✅ Approve] + [❌ Reject] (reject requires reason)
- [ ] Processed tab: decision history

### P5.3 Global Search
- [ ] Backend: unified search across modules
- [ ] Frontend: top-bar search box (`Ctrl+K`), debounce 300ms, Chinese 1-char / English 2-char trigger
- [ ] Dropdown: results grouped by module (max 3 per group), permission-aware

### P5.4 Notification Center
- [ ] Backend: notification CRUD, types per spec
- [ ] Bell icon + (N) badge + dropdown (max 5)
- [ ] **Quick approve buttons** in dropdown for "Approval pending" items
- [ ] Full page `/notifications`: ProTable with type/module/time filters
- [ ] Notification preferences (in Personal Center): configurable per type

### P5.5 Global Audit Log
- [ ] Backend: query with user/module/entity/action/time filters
- [ ] Frontend: ProTable with expandable JSON diff rows

### P5.6 Excel Export + Saved Views
- [ ] Backend: streaming XLSX (exceljs), every list page
- [ ] Saved views: per-user per-page filter/column/sort persistence

### P5.7 Performance + Polish
- [ ] Route-based code splitting, ProTable virtual scroll, image lazy load
- [ ] Query cache tuning, MinIO presign caching
- [ ] Page transition animation (200ms fade)
- [ ] Stats number count-up animation
- [ ] Empty states with teal-accent illustrations

### P5.8 Deployment
- [ ] docker-compose: api + web (Nginx) + MinIO
- [ ] Nginx: SPA routing, API proxy, static cache
- [ ] Env config: dev / test (192.168.1.251) / prod (47.111.184.254)
- [ ] Production deployment guide

### P5.9 Testing
- [ ] API regression tests for all endpoints
- [ ] E2E critical paths: login → transaction → reconcile → sync product
- [ ] External API mock mode

**Deliverable**: Full system with dashboard, unified approvals, search, notifications, deployment-ready.

---

## Dependency Graph

```
P0 Foundation + Design System
 └─ P1 Users & Settings
     ├─ P2 Ledger (Feidee UI)
     ├─ P3 Reconciliation + Workspace
     │   └─ P4 Product Dev + Kanban (needs P3 suppliers)
     └─ P5 Dashboard + Approvals + Search + Notifications
         (depends on P2-P4 for widgets/data)
```

> P2 and P3 can partially overlap (low mutual dependency).

---

## Risk Register

| Risk | Impact | Mitigation |
|------|--------|------------|
| Lemon Cloud credentials delayed | Blocks invoice/journal sync | Mock data first; plug real API when ready |
| Lingxing rate limiting | Slow sync, 429 errors | Token bucket respect, queued delays, backoff retry |
| Airwallex PDF format change | Parser breaks | Modular parser with format versioning, parse failure alerts |
| SuiShouJi migration (4000+ rows) | Slow, duplicates | Python script with dry-run, batching, idempotent matching |
| Feidee-style UI complexity | Transaction list dev takes longer | Prototype early in P0, validate with stakeholders |

---

## Milestones

| Week | Milestone | Visible Demo |
|------|-----------|-------------|
| 1 | P0 done | Login page + ProLayout shell with design tokens |
| 3 | P1 done | User management, roles, settings, Lingxing user sync |
| 6 | P2 done | Feidee-style ledger: dual-panel list, batch entry, import, reports |
| 9 | P3 done | Reconciliation: sync, split-pane workspace, matching, alerts |
| 12 | P4 done | Product dev: Kanban (hover preview), profit calc, Lingxing sync |
| 14 | P5 done | Dashboard, unified approvals, search, notifications, deployment |

---

## Key UI Spec References

| Page | Spec File | Key Section |
|------|-----------|-------------|
| Transaction List (Feidee-style) | ui-spec-module2-ledger.md | §1 |
| Batch Entry | ui-spec-module2-ledger.md | §2a |
| Transaction Form Drawer | ui-spec-module2-ledger.md | §3 |
| Reconciliation Workspace | ui-spec-module3-reconciliation.md | §8 |
| Kanban + Hover Preview | ui-spec-module4-product-dev.md | §2 |
| Unified Approval Center | ui-spec-module5-settings-dashboard.md | §3a |
| Notification Quick Approve | ui-spec-module5-settings-dashboard.md | §3 |
| Design System Tokens | design-system.md | §5 |
| Visual Style | visual-style-proposal.md | all |
