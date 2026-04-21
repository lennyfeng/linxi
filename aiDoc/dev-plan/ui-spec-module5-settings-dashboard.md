# UI Spec — Module 5: Settings + Dashboard + Common Components

> Covers Settings, Dashboard, Notification Center, Global Search, and shared UI patterns.

---

## Page Map

```
/                              → Dashboard
/approvals                     → Unified Approval Center
/settings                      → Settings (admin only)
/settings/credentials          → External Credentials
/settings/sync                 → Sync Schedules
/settings/profit-defaults      → Profit Calculation Defaults
/settings/accounts             → Account Management (same as ledger)
/settings/categories           → Category Management (same as ledger)
/notifications                 → Notification Center (full page)
```

---

## 1. Dashboard `/`

### Layout
Permission-gated widgets. Each widget only visible if user has corresponding module permission.

```
┌─ Welcome, 张三 — 2026-04-21 Monday ─────────────────────────────┐
│                                                                    │
│ ┌─ Row 1: My Todos (always visible) ────────────────────────┐    │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │    │
│ │ │ 📋 3     │ │ ⚠️ 8     │ │ 📦 2     │ │ 📝 5     │       │    │
│ │ │ Pending  │ │ Unlinked │ │ Pending  │ │ Draft    │       │    │
│ │ │ Approvals│ │ POs      │ │ Syncs    │ │ Txns     │       │    │
│ │ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │    │
│ │ (each card clickable → navigate to filtered list)          │    │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌─ Row 2 (left 60%): Finance ─┬─ Row 2 (right 40%): Projects ─┐ │
│ │ (Ledger permission required)  │ (Product Dev permission req.) │ │
│ │                               │                               │ │
│ │ This Month Overview           │ Projects by Stage             │ │
│ │ Income:  ¥128,350  ↑12%      │ (horizontal bar chart)        │ │
│ │ Expense: ¥95,200   ↓5%       │                               │ │
│ │ Net:     ¥33,150              │ Research: ████ 8              │ │
│ │                               │ Sampling: ███ 5               │ │
│ │ (Line chart: daily trend,     │ Quoting:  ██ 4                │ │
│ │  last 30 days income vs       │ Approval: █ 2                 │ │
│ │  expense)                     │ Synced:   ██████ 12           │ │
│ │                               │                               │ │
│ └───────────────────────────────┴───────────────────────────────┘ │
│                                                                    │
│ ┌─ Row 3 (left 60%): Activity ─┬─ Row 3 (right 40%): System ──┐ │
│ │                               │ (Admin only)                  │ │
│ │ Recent Activity               │                               │ │
│ │ ┌─ Feed ──────────────────┐  │ External System Status         │ │
│ │ │ 10:30 张三 created txn  │  │ ┌─────────────────────────┐   │ │
│ │ │ 10:15 李四 approved     │  │ │ Lingxing    ● Connected │   │ │
│ │ │ 09:50 王五 synced POs   │  │ │ Last: 15:00 today       │   │ │
│ │ │ 09:30 张三 linked inv.  │  │ │                         │   │ │
│ │ │ ...                     │  │ │ Lemon Cloud ● Connected │   │ │
│ │ │ [View All →]            │  │ │ Last: 12:00 today       │   │ │
│ │ └─────────────────────────┘  │ │                         │   │ │
│ │                               │ │ Airwallex   ○ Manual   │   │ │
│ │ Filter: [All] [My] [Team]   │ │ Last import: 2 days ago │   │ │
│ │                               │ └─────────────────────────┘   │ │
│ └───────────────────────────────┴───────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### Widget Visibility Rules

| Widget | Required Permission |
|--------|-------------------|
| My Todos — Approvals | product-dev.approvals |
| My Todos — Unlinked POs | reconciliation.view |
| My Todos — Pending Syncs | product-dev.sync |
| My Todos — Draft Txns | ledger.transactions.view |
| Finance Overview | ledger.reports.view |
| Projects by Stage | product-dev.projects.view |
| Recent Activity | Always visible (own activities) |
| External System Status | Admin only |

### Todo Card Interaction
Each card is clickable:
- Pending Approvals → `/product-dev/projects?tab=approvals&status=pending`
- Unlinked POs → `/reconciliation/purchase-orders?status=not_linked`
- Pending Syncs → `/product-dev/projects?stage=synced_pending`
- Draft Txns → `/ledger/transactions?status=draft`

---

## 2. Settings `/settings`

### Layout
Left menu + right content panel.

```
┌─ PageHeader: "System Settings" ──────────────────────────────────┐
│                                                                    │
│ ┌─ Left Menu ─────┬─ Content ─────────────────────────────────┐  │
│ │                  │                                           │  │
│ │ Credentials      │  (Selected section content)               │  │
│ │ Sync Schedules   │                                           │  │
│ │ Profit Defaults  │                                           │  │
│ │ Accounts         │                                           │  │
│ │ Categories       │                                           │  │
│ │                  │                                           │  │
│ └──────────────────┴───────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

### Section: Credentials

```
┌─ External System Credentials ────────────────────────────────────┐
│                                                                    │
│ ┌─ Lingxing ERP ─────────────────────────────────────────────┐   │
│ │ App ID:     [ak_lxYsroy8y1VK9_______] (masked after save) │   │
│ │ App Secret: [••••••••••••••••••••••••]  [👁 Show]          │   │
│ │ Status:     ● Connected (token valid until 2026-04-21 17:00)│  │
│ │ [Test Connection]  [Save]                                   │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌─ Lemon Cloud ──────────────────────────────────────────────┐   │
│ │ App Key:    [________________________]                      │   │
│ │ App Secret: [••••••••••••••••••••••••]  [👁 Show]          │   │
│ │ Status:     ○ Not configured                                │   │
│ │ [Test Connection]  [Save]                                   │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌─ Airwallex ────────────────────────────────────────────────┐   │
│ │ Account Info: [DBS HK, CNY_____________]  (for display)    │   │
│ │ [Save]                                                      │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ⚠️ Credentials are encrypted at rest. Only admins can view/edit.  │
└────────────────────────────────────────────────────────────────────┘
```

### Section: Sync Schedules

```
┌─ Sync Schedule Configuration ────────────────────────────────────┐
│                                                                    │
│ ┌─ ProTable ─────────────────────────────────────────────────┐   │
│ │ Source         | Data Type  | Enabled | Frequency  | Last   │   │
│ │ Lingxing       | Users      | ✅      | Daily      | 00:00  │   │
│ │ Lingxing       | PO         | ✅      | Hourly     | 15:00  │   │
│ │ Lingxing       | PR         | ✅      | Hourly     | 15:00  │   │
│ │ Lingxing       | DO         | ✅      | Hourly     | 15:00  │   │
│ │ Lingxing       | Suppliers  | ✅      | Daily      | 00:00  │   │
│ │ Lingxing       | Exch. Rate | ✅      | Monthly    | 1st    │   │
│ │ Lemon Cloud    | Journal    | ❌      | Hourly     | -      │   │
│ │ Lemon Cloud    | Invoices   | ❌      | Daily      | -      │   │
│ │                                                             │   │
│ │ Each row: [Toggle] [Edit Frequency] [Sync Now]              │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ Frequency options: Every 15 min / Hourly / Every 6 hours /        │
│                    Daily / Weekly / Monthly                        │
│                                                                    │
│ Disabled sources show warning: "Configure credentials first"      │
└────────────────────────────────────────────────────────────────────┘
```

### Section: Profit Calculation Defaults

```
┌─ Default Values for Profit Calculator ───────────────────────────┐
│                                                                    │
│ ┌─ Platform Fee Rates ───────────────────────────────────────┐   │
│ │ Commission:      [15] %      (Amazon referral fee)         │   │
│ │ Storage:         [2] %       (FBA monthly storage)         │   │
│ │ Advertising:     [13] %      (PPC ad spend target)         │   │
│ │ Return Rate:     [3] %       (customer return rate)        │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌─ Shipping Rates ───────────────────────────────────────────┐   │
│ │ Express:  [___] RMB/kg                                     │   │
│ │ Air:      [___] RMB/kg                                     │   │
│ │ Sea:      [___] RMB/kg                                     │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌─ Default Exchange Rate ────────────────────────────────────┐   │
│ │ Current Lingxing rate (2026-04): CNY/USD = 7.2568          │   │
│ │ Custom override: [_______] (leave empty to use Lingxing)   │   │
│ └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ [Save Defaults]                                                    │
│                                                                    │
│ Note: These are defaults. Each profit calculation can override.    │
└────────────────────────────────────────────────────────────────────┘
```

### Section: Accounts
Same as `/ledger/accounts` (reuse component).

### Section: Categories
Same as `/ledger/categories` (reuse component).

---

## 3. Notification Center

### Top-bar Bell Icon (always visible)

```
  🔔 (3)  ← unread count badge
    │
    ▼ (dropdown on click, max 5 items)
┌─────────────────────────────────────────────┐
│ ⚠️ Lingxing PO sync failed     2 min ago   │
│ 📋 Approval pending: LX-A005   1 hour ago  │
│    Quick actions: [✅ Approve] [❌ Reject]  │
│ ✅ Invoice sync completed       3 hours ago │
│ ⚠️ 5 POs uninvoiced >30 days   yesterday   │
│ 📋 Approval pending: LX-A003   yesterday   │
│                                              │
│ [Mark All Read]        [View All →]          │
└─────────────────────────────────────────────┘
```

### Full Notification Page `/notifications`

Standard List Page:

| Column | Type | Notes |
|--------|------|-------|
| Read | Dot | Blue dot if unread |
| Type | Icon | ⚠️ Alert / 📋 Approval / ✅ Success / ❌ Error / 📢 Announcement |
| Message | Text | Clickable → navigate to source |
| Module | Tag | Users / Ledger / Reconciliation / Product Dev / System |
| Time | DateTime | Relative ("2 hours ago") |
| Actions | Button | [Mark Read] / [Dismiss] |

### Notification Types & Triggers

| Type | Trigger | Message Template |
|------|---------|-----------------|
| Sync failure | Background job fails after 3 retries | "Lingxing {dataType} sync failed: {error}" |
| Approval pending | Project submitted for approval | "Approval pending: {projectName} ({approvalType})" |
| Approval result | Approver approves/rejects | "Project {name} {approved/rejected} by {approver}" |
| Reconciliation alert | Daily scan finds uninvoiced POs >30 days | "{N} purchase orders uninvoiced for >30 days" |
| Invoice match | New invoice matches existing PO | "New invoice {number} may match PO {poNumber}" |
| Sync completed | Scheduled sync succeeds | "{source} {dataType} sync completed: +{new} new, △{updated} updated" |
| System | Admin sends announcement | "{message}" |

### Quick Approve in Notification
For "Approval pending" notifications, the dropdown shows inline **[✅ Approve] [❌ Reject]** buttons.
- [✅ Approve] → confirm popover: "Approve {projectName}?" + optional opinion input → submit
- [❌ Reject] → popover: "Reject {projectName}?" + required reason input → submit
- After action → notification updates inline, no page navigation needed
- For complex reviews, click notification text → full project detail page

### Notification Preferences (in Personal Center)
Users can configure which notification types they receive:

| Type | Default | Mutable |
|------|---------|---------|
| Approval pending (for you) | ✅ On | ❌ Cannot disable |
| Approval result (your submissions) | ✅ On | ❌ Cannot disable |
| Sync failure | ✅ On | ✅ |
| Sync completed | ❌ Off | ✅ |
| Reconciliation alerts | ✅ On | ✅ |
| Invoice match suggestions | ✅ On | ✅ |
| System announcements | ✅ On | ❌ Cannot disable |

---

## 3a. Unified Approval Center `/approvals`

### Purpose
One page to view and process all pending approvals without navigating to individual projects.

### Layout
```
┌─ PageHeader: "Approval Center" ──────────────────────────────────┐
│ ┌─ Tabs ─────────────────────────────────────────────────────┐   │
│ │ [Pending (3)] [Processed] [All]                             │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌─ ProTable ─────────────────────────────────────────────────┐   │
│ │ Project     | Type           | Submitter | Submitted | Act │   │
│ │ LX-A005     | Sampling Appr. | 张三      | 2h ago    |[▶] │   │
│ │ LX-A003     | Project Appr.  | 李四      | yesterday |[▶] │   │
│ │ LX-A008     | Online Appr.   | 王五      | 3 days ago|[▶] │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ Click [▶] → expand inline:                                        │
│ ┌─ Expanded Approval Detail ─────────────────────────────────┐   │
│ │ Project: LX-A005 — iPhone 16 硅胶保护套                     │   │
│ │ Stage: Sampling → Sampling Approval                         │   │
│ │ Submitter Notes: "Sample quality excellent, ready to proceed"│  │
│ │ Profit Calc: Express 38.9% / Air 41.1% / Sea 43.9%         │   │
│ │ [View Full Project →]                                       │   │
│ │                                                             │   │
│ │ Your Decision:                                              │   │
│ │ Opinion: [________________]                                 │   │
│ │ [✅ Approve]  [❌ Reject]                                   │   │
│ └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

### Processed Tab
Shows history of approvals this user has processed:
| Column | Notes |
|--------|-------|
| Project | Name + SKU |
| Type | Approval type |
| Decision | Approved ✅ / Rejected ❌ |
| Time | When decided |
| Opinion | What you wrote |

---

## 4. Global Search

### Top-bar Search Box

```
  [🔍 Search orders, SKUs, projects...]
         │
         ▼ (dropdown on type, debounce 300ms)
┌──────────────────────────────────────────────────┐
│ Recent Searches:                                  │
│   "LX-A001"  "深圳明达"  "PR-2026"               │
│                                                    │
│ ─── typing "LX-A" ───                             │
│                                                    │
│ Products (2)                                       │
│   📦 LX-A001 iPhone 16 硅胶保护套   [Product Dev] │
│   📦 LX-A002 iPad 钢化玻璃膜        [Product Dev] │
│                                                    │
│ Purchase Orders (1)                                │
│   📋 PO-2026-0321-001 (LX-A001)   [Reconciliation]│
│                                                    │
│ Transactions (1)                                   │
│   💰 "LX-A001 采购款" ¥45,800      [Ledger]       │
│                                                    │
│ [View all results →]                               │
└──────────────────────────────────────────────────┘
```

### Behavior
- Debounce 300ms
- **Chinese**: min 1 character to trigger; **English/numbers**: min 2 characters
- Results grouped by module (max 3 per group)
- Each result: icon + primary text + secondary text + module tag
- Click result → navigate to entity detail
- [View all results →] → full-page search results (optional, can be deferred)
- **Permission-aware**: only show results user has permission to view

---

## 5. Common Patterns

### Saved Views Dropdown (on every list page)

```
  [Views ▾]
      │
      ▼
┌─────────────────────────────┐
│ Default View                 │
│ ● My Draft Transactions     │
│   This Month Income          │
│   Unlinked POs               │
│ ──────────────────────────── │
│ [+ Save Current View]        │
│ [Manage Views]               │
└─────────────────────────────┘
```

**Save Current View Modal:**
| Field | Component | Notes |
|-------|-----------|-------|
| View Name | Input | Required |
| Include filters | Checkbox | Default checked |
| Include column config | Checkbox | Default checked |
| Include sort | Checkbox | Default checked |
| Set as default | Checkbox | - |

### Excel Export

Every list page "Export" button:
- Exports current filtered + sorted data
- Format: .xlsx
- Columns: match current visible columns (respects column hide/show from saved view)
- Max rows: 10,000 (show warning if filtered result > 10,000)
- Download triggers browser download

### Confirmation Dialog (destructive actions)

```
┌─ Confirm ────────────────────────────────────┐
│                                                │
│ ⚠️ Are you sure you want to {action}?         │
│                                                │
│ {description of impact}                        │
│                                                │
│ This action cannot be undone.                  │
│                                                │
│                         [Cancel] [Confirm]     │
└────────────────────────────────────────────────┘
```

Used for: disable user, delete draft, remove relation, void record, sync to Lingxing.

### Empty States

Each list page has a tailored empty state:

| Page | Illustration | Message | Action |
|------|-------------|---------|--------|
| Transactions | Receipt icon | No transactions yet | [Create First Transaction] |
| Accounts | Bank icon | No accounts configured | [Add Account] |
| PO List | Box icon | No purchase orders synced | [Run Initial Sync] |
| Projects | Lightbulb icon | No projects yet | [Create First Project] |
| Notifications | Bell icon | All caught up! No notifications. | - |

### Loading States

- **Table loading**: ProTable built-in skeleton (gray animated rows)
- **Card loading**: Skeleton cards with shimmer
- **Form loading**: Input placeholders with shimmer
- **Full page loading**: Centered Spin with app logo
- **Button loading**: Spin icon inside button, button disabled

### Toast Notifications (antd message)

| Type | Duration | Example |
|------|----------|---------|
| Success | 3s | "Transaction created successfully" |
| Error | 5s | "Failed to save: {error message}" |
| Warning | 5s | "This file was previously imported on {date}" |
| Info | 3s | "Sync started, you will be notified when complete" |
| Loading | Until done | "Syncing to Lingxing..." (with spinner) |

---

## 6. ProLayout Shell

### Header
```
┌─ Logo ─── Breadcrumb ──────────────────── Search ── 🔔(3) ── 👤 ──┐
│ [≡] 霖淅  Dashboard > Ledger > Transactions  [🔍 Search...]  🔔  张三▾│
└──────────────────────────────────────────────────────────────────────┘
```

- **[≡]**: Toggle sidebar collapse
- **Logo**: Company name "霖淅" / icon
- **Breadcrumb**: Auto-generated from route
- **Search**: Global search (see above)
- **🔔**: Notification bell with unread badge
- **👤**: User avatar + dropdown: [Personal Center] [Logout]

### Sidebar
```
┌─ Sidebar ──────────────────┐
│                              │
│ 📊 Dashboard                 │
│                              │
│ 👥 Users & Permissions       │
│    ├─ User Management        │
│    ├─ Departments            │
│    ├─ Roles                  │
│    └─ Audit Logs             │
│                              │
│ 💰 Ledger                    │
│    ├─ Transactions           │
│    ├─ Accounts               │
│    ├─ Categories             │
│    ├─ Import                 │
│    └─ Reports                │
│                              │
│ 🔗 Reconciliation            │
│    ├─ Overview               │
│    ├─ Purchase Orders        │
│    ├─ Payment Requests       │
│    ├─ Delivery Orders        │
│    ├─ Invoices               │
│    ├─ Sync Jobs              │
│    └─ Reports                │
│                              │
│ 🚀 Product Development       │
│    ├─ Projects               │
│    ├─ Kanban                 │
│    └─ Profit Calculator      │
│                              │
│ ⚙️ Settings (admin only)     │
│                              │
└──────────────────────────────┘
```

- Menu items are **permission-gated**: hidden if user has no access
- Collapsed mode: icons only, hover to show text
- Active item: highlighted with left border + background color
- Submenu: auto-expand when parent clicked; persist expand state

---

## 7. Responsive Behavior

| Viewport | Behavior |
|----------|----------|
| ≥ 1440px | Full layout, sidebar expanded |
| 1280-1439px | Sidebar collapsed by default |
| < 1280px | Not officially supported; show warning banner: "For best experience, use a screen width of at least 1440px" |
