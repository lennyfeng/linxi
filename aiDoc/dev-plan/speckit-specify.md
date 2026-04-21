# speckit.specify — Internal Platform Full Specification

## What

A unified internal operations platform for a cross-border e-commerce company, consisting of four functional modules integrated with external systems (Lingxing ERP, Airwallex, future Feishu).

---

## Why

- Replace fragmented tools (SuiShouJi for bookkeeping, spreadsheets for profit estimation)
- Establish a unified login and permission system for all internal tools
- Automate data synchronization with Lingxing ERP (purchase orders, payment requests, delivery orders, suppliers, products)
- Provide financial reconciliation capabilities between invoices and procurement documents
- Manage new product development lifecycle from ideation to Lingxing product creation

---

## Module 1: Unified Users & Permissions

### What it does
- Unified login portal (Phase 1: local admin login; Phase 2: Feishu SSO)
- User lifecycle management (create, activate, disable — no physical delete)
- Organization structure (department tree, members, hierarchy)
- Role-based access control with 4 permission layers:
  - Menu permissions (page visibility)
  - Operation permissions (CRUD, submit, approve, export, sync)
  - Data permissions (self-only / department / all)
  - Field permissions (visible / editable per role)
- Audit logging: login logs, permission change logs, status change logs

### Roles (Phase 1)
Super Admin, System Admin, Finance, Finance Lead, Department Head, Employee, Read-only

### What it does NOT do (Phase 1)
- Feishu login/sync (deferred per user instruction)
- Multi-tenant
- Fine-grained field permissions for all modules
- Legacy page SSO integration

---

## Module 2: Ledger (New Bookkeeping System)

### What it does
- Replace SuiShouJi as company's unified single-ledger financial transaction system
- Multi-account management (bank, Airwallex, cash) with per-account balance tracking
- Multi-currency with auto exchange rate (CNY base), cross-currency transfers
- Transaction types: Income, Expense, Transfer, Refund
- Transaction fields: date, amount, currency, rate, CNY equivalent, account, category (2-level), counterparty, summary, remark, attachment, reimbursement flag, invoice flag, import match fields
- **Draft state**: transactions can be saved as draft, not counted in balance until submitted
- **Cross-currency transfer**: single transaction record (not split) with source account/currency/amount + target account/currency/amount + exchange gain/loss auto-calculated
- **Account opening balance**: all accounts start at 0 on migration date; SuiShouJi import includes full history, balances computed from transactions
- **Ledger → Invoice/Payment reverse link**: expense transactions can optionally link to a Payment Request / Invoice (clickable jump); most transactions are non-supplier (salary, rent, etc.) so link is optional
- Category management (admin-only, 2-level hierarchy)
- Counterparty/merchant reference (optional, links to Lingxing suppliers in future)
- Reimbursement workflow: flag transactions → batch submit to Feishu approval (Phase 2, no local approval)
- **Import & Matching workflow:**
  - Import Airwallex PDF statements (parse → staging → confirm page)
  - Import bank statements from Lemon Cloud API (sync → staging → confirm page)
  - Confirm page: batch display, allow editing/enrichment before posting
  - Auto-match imported transactions with existing system transactions
  - Match criteria: payment account, amount, currency, date, counterparty
  - Match rules: N external → 1 system (sum must match), NOT N system → 1 external
  - Preserve import batch, match result, unmatched reason, manual handling record
  - **Airwallex dedup**: filename warning on every upload; if duplicate date+amount+account rows detected, modal popup listing duplicates, user checks "confirm import anyway" to proceed
  - **SuiShouJi migration**: one-time operation handled by external Python script that cleans data and inserts into DB directly (no in-app progress bar needed)
- Reports: income/expense summary, account balances, period comparison

### Airwallex Statement Format (Confirmed)
```
Source: PDF, 12 pages
Structure per transaction row:
- Date (e.g. "Mar 01 2026")
- Details (type + description, e.g. "Transfer\n8528.30 CNY received from PIPO...")
- Credit (amount CNY, present for inflows)
- Debit (amount CNY, present for outflows)
- Balance (running balance CNY)
Transaction types: Transfer (income), Fee (deduction), Payout (withdrawal)
Account: DBS Hong Kong, CNY account
```

### Data Sources
- **Airwallex**: PDF statement import (manual upload, parsed locally)
- **Lemon Cloud**: Bank statement sync via REST API (日记账 Journal API)
- **SuiShouJi (随手记) migration**: Excel import, one-time migration
- **Exchange rate**: Sync from Lingxing ERP (official + custom rates by month)

### Lemon Cloud API (Bank Statements + Invoices)
Docs: https://open2.ningmengyun.com/
Base: `$ACCAPI_HOST` (HTTPS, JSON, Token auth)
Credentials: AppKey/AppSecret pending application, configurable in admin settings

| Function | Method | Endpoint |
|----------|--------|----------|
| Get journal list | POST | `/api/Cashier/Journal/GetCDJournal` |
| Add journal entry | POST | `/api/Cashier/Journal/AddCDJournal` |
| Modify journal entry | POST | `/api/Cashier/Journal/ModifyCDJournal` |
| Delete journal entry | POST | `/api/Cashier/Journal/DeleteCDJournal` |
| Get bank accounts | POST | `/api/Cashier/CDAccount/GetCDAccounts` |
| Add bank account | POST | `/api/Cashier/CDAccount/AddCDAccount` |
| Get bank list | GET | `/api/Cashier/CDAccount/GetBankList` |
| Income/expense categories | POST | `/api/Cashier/IEType/GetIETypeList` |
| Fund report (by account) | POST | `/api/Cashier/CashierReport/GetCDReport` |
| Fund report (by category) | POST | `/api/Cashier/CashierReport/GetIEReport` |
| Internal transfer | POST | `/api/Cashier/Transfer/*` |
| **Get account sets** | POST | `/api/AccountSet/*` |
| **Query invoices** | POST | `/api/Invoice/Invoice/GetInvoice` |
| Add invoice | POST | `/api/Invoice/Invoice/AddInvoice` |
| Get invoice by code | POST | `/api/InvoiceApi/GetInfoByInput/GetInvoiceInfo` |
| Get invoice by QR | POST | `/api/InvoiceApi/GetInfoByQRCode/GetInvoiceInfoByQRCode` |

**Invoice sync flow**: Get all account set IDs → iterate each → call `GetInvoice` per account set → store locally for reconciliation

### SuiShouJi Export Format (Confirmed)
File: `随手记霖淅科技账本20260412135807.xlsx`
4 sheets, total ~4,072 rows:

**Sheet 1: 支出 (Expense)** — 3,048 rows
| Column | Field |
|--------|-------|
| 交易类型 | Fixed "支出" |
| 日期 | "2026-04-12 01:32:49" |
| 分类 | e.g. "运营费用" |
| 子分类 | e.g. "差旅费" |
| 账户1 | Source account, e.g. "金颖现金账" |
| 账户2 | (empty for expense) |
| 账户币种 | "CNY" |
| 金额 | e.g. 1131.0 |
| 成员 | e.g. "金颖" |
| 商家 | Counterparty |
| 项目分类 | e.g. "所有" |
| 项目 | e.g. "霖淅科技" |
| 记账人 | Bookkeeper |
| 备注 | Remark |
| 图片1~7 | Attachment URLs |

**Sheet 2: 转账 (Transfer)** — 201 rows
Same columns (no images), 账户1=from, 账户2=to

**Sheet 3: 收入 (Income)** — 814 rows
Same as 支出, 1 image column

**Sheet 4: 退款 (Refund)** — 9 rows
Same as 转账, amounts are negative

### What it does NOT do (Phase 1)
- Accounting entries (debit/credit journal)
- Multiple ledgers
- Budget management
- Full auto-reconciliation engine

---

## Module 3: Purchase-Payment-Invoice Reconciliation

### What it does
- Synchronize from Lingxing ERP: Purchase Orders, Payment Requests, Delivery Orders, Suppliers
- Synchronize from Lemon Cloud: Invoices (all Chinese RMB invoices, no USD)
- **Sync strategy**: initial full sync, then incremental by `update_time` (Lingxing's update_time_start/end; Lemon Cloud by modified date)
- **Invoice amount basis**: tax-inclusive (含税) amount is used for reconciliation matching
- **Source data change handling**: if Lingxing voids/deletes a PO after sync, mark local record as "voided" (do not delete); relationships preserved but flagged
- Maintain many-to-many reconciliation relationships between:
  - Invoice ↔ Purchase Order (with split amounts)
  - Invoice ↔ Payment Request (with split amounts)
  - Invoice ↔ Delivery Order (with split amounts)
- **Bidirectional**: from any object's detail page, trace all related objects and their amounts
- Relationship maintenance mode: system recommendation + manual confirmation
- Recommendation criteria: supplier, date proximity, amount similarity, existing relations
- Status tracking per object:
  - Purchase Order: Not linked / Partially linked / Fully linked / Do-not-remind
  - Payment Request: Not obtained / Partially obtained / Fully obtained / Do-not-remind
  - Delivery Order: Not linked / Partially linked / Fully linked
  - Invoice: Not matched / Partially matched / Fully matched
- Alerts: uninvoiced purchase orders, payment requests without invoices, uncovered deliveries
- Reports: uninvoiced lists, invoice-vs-purchase comparisons, supplier invoice summaries

### Lingxing API Endpoints (Confirmed)

| Function | Method | Path |
|----------|--------|------|
| Auth Token | POST | `/api/auth-server/oauth/access-token` |
| Purchase Orders | POST | `/erp/sc/routing/data/local_inventory/purchaseOrderList` |
| Payment Requests | POST | `/basicOpen/finance/requestFunds/order/list` |
| Delivery Orders | POST | `/erp/sc/routing/storage/shipment/getInboundShipmentList` |
| Suppliers | POST | `/erp/sc/data/local_inventory/supplier` |

### Lingxing Auth
- Base URL: `https://openapi.lingxing.com`
- App ID: `ak_lxYsroy8y1VK9`
- App Secret: `S6VOAQcQ7pWSlLw/fWNB6w==`
- Token type: access_token (expires in ~7200s), refresh via refresh_token
- Request format: JSON body with `access_token` in query params + `sign` + `timestamp` + `app_key`

### Lingxing User & Exchange Rate APIs (Cross-Module)

| Function | Method | Path | Usage |
|----------|--------|------|-------|
| User List | GET | `/erp/sc/data/account/lists` | Sync users: uid, realname, username, mobile, email, status, role, is_master |
| Exchange Rate | POST | `/erp/sc/routing/finance/currency/currencyMonth` | Get monthly rates by currency: rate_org (official), my_rate (custom) |

### What it does NOT do (Phase 1)
- SKU-level detail reconciliation
- Fully automatic matching
- Accounting voucher generation
- Invoice OCR
- USD invoices (invoices are RMB-only)

---

## Module 4: New Product Development

### What it does
- Full lifecycle project management: Ideation → Research → Sampling → Quoting → Profit Calc → Approval → Finalization → Online Approval → Filing → **Sync to Lingxing** → First Order
- Project master data: product name, type, SKU (temp code + formal), material, tags, developer, owner, target platform/market, competitor links, expected cost, target price, margin target, packaging/certification requirements, images, research files
- SKU/SPU rules: 1 project = 1 SKU; support standalone SKU, new SPU + SKU, or attach to existing SPU
- **Sampling management**: multiple rounds per project, each with supplier, cost, timeline, images, review result, rejection reason, improvement notes, final confirmation
- **Supplier quoting**: multi-supplier comparison; fields: supplier, Lingxing supplier ID, purchase links[], quote notes, lead time, preferred flag, currency, tax included, tax rate, MOQ, tiered pricing
- **Profit calculation** (Amazon channel only, Phase 1):
  ```
  Inputs:
  - Product name, image
  - Dimensions (cm), volumetric weight (kg), actual weight (kg)
  - Product cost (RMB), accessories cost (RMB)
  - Selling price (USD), exchange rate (RMB/USD)
  - Shipping rates: express/kg, air/kg, sea/kg
  - FBA delivery fee (manual input, USD)

  Formulas:
  - Cost(USD) = Cost(RMB) / rate
  - Express shipping = actual_weight × express_rate / rate
  - Air shipping = actual_weight × air_rate / rate
  - Sea shipping = volumetric_weight × sea_rate / rate
  - Accessories(USD) = accessories(RMB) / rate
  - Storage fee = price × 2%
  - Commission = price × 15%
  - Advertising = price × 13%
  - Return cost = price × 3%

  Profit margins (3 scenarios):
  - Express = (price - ad - FBA - commission - storage - accessories - express - cost) / price
  - Air = (price - ad - FBA - commission - storage - accessories - air - cost) / price
  - Sea = (price - ad - FBA - commission - storage - accessories - sea - cost - return) / price
  - Profit = price × selected_margin
  ```
- **Approval workflow**:
  - Sampling approval: product owner
  - Project approval: product owner + operations lead + general lead (requires profit calc result)
  - Finalization approval: same as project
  - Online approval: product owner
  - Each approval record: node, approver, submit time, result, opinion, rejection reason, approval time
- **Progress Kanban**: statuses = Pending Research / Researching / Sampling Approval / Sampling Rejected / Sampling / Pending Quote / Pending Project Approval / Project Confirmed / Project Rejected / Pending Finalization / Pending Online / Synced to Lingxing / First Order Placed
- **Sync to Lingxing** (manual trigger after online approval):
  - Creates SPU/SKU in Lingxing via API
  - Sync content: SPU/SKU master data, product name, model, unit, category, brand, description, developer, owner, purchaser, purchase notes, lead time, material, single-item specs, packaging specs, carton specs, weight, quantity, product images, special attributes, supplier quotes
  - Records sync status, time, operator, result, failure reason; supports retry

### Lingxing Product API Endpoints (Confirmed)

| Function | Method | Path |
|----------|--------|------|
| Query Local Products | POST | `/erp/sc/routing/data/local_inventory/productList` |
| Query SPU List | POST | `/erp/sc/routing/storage/spu/spuList` |
| Create/Edit Product (SKU) | POST | `/erp/sc/routing/storage/product/set` |
| Create/Edit SPU | POST | `/erp/sc/routing/storage/spu/set` |

### Key Lingxing Product Fields for Sync
- `sku`, `product_name`, `unit`, `category_id`/`category`, `brand_id`/`brand`, `model`, `description`
- `product_developer_uid`/`product_developer`, `product_duty_uids`
- `cg_opt_uid`/`cg_opt_username`, `purchase_remark`, `cg_delivery`, `cg_product_material`
- Specs: `cg_product_length/width/height`, `cg_product_net_weight/gross_weight`
- Package: `cg_package_length/width/height`
- Carton: `cg_box_length/width/height`, `cg_box_weight`, `cg_box_pcs`
- `picture_list[]`, `special_attr[]`
- `supplier_quote[]` with `erp_supplier_id`, `supplier_product_url[]`, `is_primary`, `quotes[]` (currency, tax, step_prices[])

### SKU Conflict Handling
- Before creating a new SKU, query Lingxing `productList` to check existence
- If conflict detected: block submission, prompt user to change SKU code, show existing Lingxing product info

### What it does NOT do (Phase 1)
- Complex BOM management
- Full customs/clearance management
- Multi-country logistics cost maintenance
- Complex accessory relationship management
- Auto-publish to e-commerce platforms
- Non-Amazon profit calculation
- Project comments / @mentions (future)
- Profit calc version history (future)

---

## Module 5: System Settings (Admin Only)

### What it does
- **External credentials**: Lingxing AppId/Secret, Lemon Cloud AppKey/Secret, Airwallex account info (editable)
- **Sync schedules**: enable/disable + frequency per external API (e.g. Lingxing users daily, invoices hourly, exchange rate monthly)
- **Manual sync triggers**: on-demand "sync now" button per data source
- **Profit calc defaults**: FBA category, commission %, storage %, advertising %, return %, shipping rates (express/air/sea per kg)
- **Currency & exchange rate override**: view Lingxing rates; admin can set custom `my_rate` per currency/month
- **Account management**: resource accounts (banks, Airwallex, cash) with currency, opening balance date, initial balance
- **Category management**: income/expense 2-level categories
- **Attachment storage config**: storage backend selection (local / MinIO), max file size, allowed types

---

## Cross-Cutting Infrastructure

### 1. Attachment Storage
- Backend: **MinIO** self-hosted, S3-compatible
- Deployment: test on `192.168.1.251` during dev; production on Aliyun server `47.111.184.254` after go-live
- Use cases: ledger receipts, sampling photos, project research docs, invoice scans, profit calc product images
- Features: presigned URLs, image thumbnail generation, PDF/image inline preview, max 20MB/file

### 2. Background Sync Job System
- Queue: **`pg-boss`** (PostgreSQL-backed, no extra infra)
- Job types: Lingxing PO/PR/DO/Supplier/User/ExchangeRate sync, Lemon Cloud Journal/Invoice sync, Airwallex PDF parse
- **Default schedules**: Lingxing users=daily, POs/PRs/DOs=hourly, exchange rate=monthly, Lemon Cloud journal=hourly, invoices=daily (configurable in Settings)
- **Rate limiting**: respect Lingxing token bucket per endpoint (e.g. PO=1/s, Product=10/s)
- **Retry policy**: exponential backoff, max 3 retries, then failure alert via Notification Center
- Admin UI: job list page (status, started, duration, result, error log, retry button)

### 3. Notification Center
- Top-right bell icon + dropdown list + unread badge
- Types: sync failures, reconciliation alerts (uninvoiced POs >30 days), approval pending, system announcements
- Storage: persisted in DB; mark-as-read; link to source page

### 4. Global Audit Log
- All mutations recorded: user, IP, timestamp, module, entity, action, before/after snapshot
- Global log viewer page (admin only): filter by user / module / entity / action / time range
- External sync logs: full request/response JSON for debugging

### 5. Global Search
- Top bar search box, cross-module full-text search
- Searchable fields: all 4 modules — PO#/PR#/shipment#/invoice#, SKU/SPU/project name, supplier name, transaction memo/counterparty, user name, category, attachment filename
- Results grouped by module; click to jump to detail
- Permission-aware: only returns records the current user has permission to view

### 6. Login & Error Pages
- Login page: account + password + remember-me + forgot-password (Phase 1 local; Phase 2 Feishu SSO button)
- Session: JWT access token (2h) + refresh token (7d); auto-refresh before expiry
- First-login forced password change
- Error pages: 401 (redirect to login), 403 (no permission), 404 (not found), 500 (server error) with friendly UI

### 7. Dashboard
- Dashboard widgets are permission-gated: users without permission to a module do not see that module's menu entry or widget
- **My Todos**: pending approvals, pending reconciliations, pending product syncs
- **Financial snapshot**: this month income/expense/balance, trend chart (Ledger permission required)
- **Active product projects**: in-progress count by stage (Product Dev permission required)
- **Recent activity feed**: my recent operations + team operations (filterable)
- **External system status**: Lingxing / Lemon Cloud / Airwallex connection health, last sync time (admin only)

### 8. Personal Center
- Edit profile (name, avatar, phone, email)
- Change password
- My approvals history
- My notifications
- Session management (active devices, logout all)

### 9. Data Safety Principles
- No physical deletion anywhere — soft delete / disable only
- **Disabled users**: retain all historical data (transactions, projects, approvals), cannot log in, cannot be assigned to new records; existing assignments remain visible
- All mutations audited (who, when, what changed)
- External sync operations recorded with full request/response logs
- Destructive operations (delete, void, bulk update) require confirmation dialog

### 10. User Sync Strategy (Lingxing)
- **First time**: full pull from `/erp/sc/data/account/lists`, create local users mapped to Lingxing uid
- **Ongoing**: periodic update (daily cron) — update existing users by uid, add new users, mark missing as disabled
- Local users have independent password/role; Lingxing uid is stored for product ownership/purchaser mapping

---

## Frontend UX Patterns (React + Ant Design)

### Stack (Confirmed)
```
React 18 + TypeScript + Vite
Ant Design 5.x + @ant-design/pro-components (ProTable / ProForm / ProLayout / ProDescriptions)
@ant-design/charts (dashboards / reports)
TanStack Query (server state + caching)
Zustand (client state)
React Router 6 (code-split routes per module)
dayjs (date handling)
```

### Navigation Structure
- Dashboard
- Users & Permissions (users, roles, departments, permissions, audit logs)
- Ledger (transactions, accounts, categories, import, reports, reimbursements)
- Reconciliation (overview, POs, PRs, DOs, invoices, relations, reports)
- Product Development (projects, kanban, sampling, quoting, profit calc, approvals, Lingxing sync)
- Settings (admin only: credentials, sync schedules, profit defaults, accounts, categories)
- Notification Center, Personal Center, Global Search (top bar)

### Page Templates
| Template | Components |
|----------|------------|
| **List page** | Filter bar (collapsible) + toolbar (create/export/batch/saved views) + ProTable + detail Drawer |
| **Detail page** | PageHeader (breadcrumb + actions) + ProDescriptions + Tabs + related lists |
| **Form page** | ProForm (Step layout for complex) + sticky bottom save bar |
| **Kanban page** | Column layout (drag-drop) + card click → Drawer |
| **Import page** | Stepper (Upload → Preview → Confirm → Done) |

### Common UI Capabilities (All Modules)
- **Saved list views**: column visibility, filter presets, sort — persisted per user per page
- **Excel export**: every list page has export-current-filter button
- **Batch operations**: multi-select rows + batch status change / delete / export
- **Virtual scroll**: ProTable virtual mode for >500 rows
- **Inline refresh**: toast on new data from background sync
- **Empty / loading / error states**: consistent illustrations + guidance
- **Confirmation dialogs**: all destructive operations
- **Query caching**: 5-min stale time for reference data (users, suppliers, categories, exchange rates)

### Design System
- Status colors: success=green / warn=orange / error=red / syncing=blue / draft=gray
- Amounts: thousand separators, red negative / green positive, currency prefix, right-aligned
- Dates: `YYYY-MM-DD HH:mm` uniformly; relative time in feed views
- Target viewport: **desktop-only**, minimum 1440px width (no mobile/tablet optimization)
- Browser support: latest Chrome / Edge / Firefox (no IE)

### Performance
- Route-based code splitting (one chunk per module)
- Image lazy load + thumbnail via MinIO presign
- Debounced search inputs (300ms)
- Optimistic UI for simple mutations

---

## External System Dependencies Summary

| System | Direction | Module | Status |
|--------|-----------|--------|--------|
| Lingxing ERP | Read | Reconciliation (PO/PR/DO/Supplier) | API docs available ✅ |
| Lingxing ERP | Write | Product Dev (create SKU/SPU) | API docs available ✅ |
| Lingxing ERP | Read | Users (sync user list) | API available ✅ |
| Lingxing ERP | Read | Exchange Rate (monthly rates) | API available ✅ |
| Airwallex | Import (PDF parse) | Ledger | Sample available ✅ |
| Lemon Cloud | Read/Write | Ledger (journal/bank statements) | API available ✅ |
| Lemon Cloud | Read | Reconciliation (invoices) | API available ✅ |
| Feishu | Login + Sync + Approval | Users + Ledger | Deferred per user |
| MinIO | Attachment storage | All modules | Self-hosted ✅ |

---

## Open Questions

_All questions resolved ✅_

### Confirmed Decisions
- Frontend: React 18 + TypeScript + Vite + Ant Design 5 + ProComponents
- Attachment storage: MinIO (test: 192.168.1.251 → production: Aliyun 47.111.184.254)
- Background jobs: pg-boss on PostgreSQL
- Sync schedules: users/invoices=daily, POs/PRs/DOs/journal=hourly, exchange rate=monthly
- Menu & dashboard widgets are permission-gated (no entry if no permission)
- Global search: all 4 modules, all key fields, permission-aware
