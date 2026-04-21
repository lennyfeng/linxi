# UI Spec — Module 2: Ledger (Bookkeeping)

> Per-page field definitions, interaction flows, and state transitions.

---

## Page Map

```
/ledger/transactions          → Transaction List
/ledger/transactions/batch    → Batch Entry Mode
/ledger/accounts              → Account Management
/ledger/categories            → Category Management
/ledger/import                → Import Workflow (Airwallex / Lemon Cloud)
/ledger/reports               → Financial Reports
```

## Global Shortcuts (available on any page)

| Shortcut | Action |
|----------|--------|
| `Ctrl+N` | Open New Transaction Drawer (Income by default) |
| `Ctrl+K` | Focus global search box |
| `Ctrl+S` | Save current form |
| `Esc` | Close current Drawer/Modal |

---

## 1. Transaction List `/ledger/transactions`

### Layout
**Feidee-inspired dual-panel**: left monthly navigator + right transaction list with date grouping.

```
┌─ Top Bar ────────────────────────────────────────────────────────────────┐
│ [+ New ✏️]  Transactions   Balance ¥2,280,879  Income ¥11,394,373       │
│                            Expense ¥9,113,494                            │
│                   [Import ▾] [Filter ▾] [🔍 Search] [Batch Edit] [Export]│
└──────────────────────────────────────────────────────────────────────────┘
┌─ Left: Monthly Navigator ──┬─ Right: Transaction List ───────────────────┐
│ (180px, white, scrollable)  │ (fluid, #F5F7FA bg)                        │
│                              │                                            │
│ ▾ 2026                      │ ┌─ April 21, Today ─────────────────────┐  │
│ ┌──────────────────────┐    │ │ 🔴 基础支出    ¥90.00   全球财金账户  │  │
│ │ 4月       balance     │    │ │     金额  会员  2026-04-21 15:25      │  │
│ │           ¥11,059     │    │ │                                       │  │
│ │ ¥512,228  ¥501,169   │    │ │ 🔴 基础支出    ¥200.00  全球财金账户  │  │
│ │ (green)   (red)      │    │ │     金额  会员  2026-04-21 15:18      │  │
│ └──────────────────────┘    │ └───────────────────────────────────────┘  │
│ ┌──────────────────────┐    │                                            │
│ │ 3月       balance     │    │ ┌─ April 19 ───────────────────────────┐  │
│ │           ¥274,665    │    │ │ 🟢 茶歇费     ¥20.00   全额对公账户  │  │
│ │ ¥874,678  ¥600,013   │    │ │                                       │  │
│ └──────────────────────┘    │ │ 🔴 差旅费     ¥52.00   全额对公账户  │  │
│ ┌──────────────────────┐    │ └───────────────────────────────────────┘  │
│ │ 2月       balance     │    │                                            │
│ │           -¥51,494    │    │ ┌─ April 18 ───────────────────────────┐  │
│ │ ¥693,573  ¥715,067   │    │ │ 🔵 货品国内运费 ¥480.00  各市场账户  │  │
│ └──────────────────────┘    │ │                                       │  │
│ ...                         │ │ 🔵 货品国际运费 ¥480.00  各市场账户  │  │
│                              │ │                                       │  │
│ ▾ 2025                      │ │ 🟣 手续费     $3.26     Airwallex    │  │
│ ┌──────────────────────┐    │ │                                       │  │
│ │ 12月                 │    │ │ 🟢 主营业务收入 ¥3,270.98 Airwallex  │  │
│ │ ...                  │    │ └───────────────────────────────────────┘  │
│ └──────────────────────┘    │                                            │
│                              │ Load more...                               │
│ ⚙️ Settings                 │                                            │
└──────────────────────────────┴────────────────────────────────────────────┘
```

### Key Design Differences from Standard ProTable
1. **No traditional table grid** — transactions are card-like rows grouped by date
2. **Monthly navigator** replaces date range filter as primary navigation
3. **Click month** → scrolls/loads that month's transactions
4. **Active month** highlighted with primary color left border + light bg
5. **Each month card** shows: balance, income (green), expense (red)
6. **Date group headers** as sticky separators: "April 21, Today" / "April 19"
7. **Category icons** with colored circle backgrounds (like Feidee)

### Stats Bar
Summary cards at top (light background, inline):
- **This Month Income**: sum of income transactions in current month (green)
- **This Month Expense**: sum of expense transactions (red)
- **Net Balance**: income - expense (blue)
- **Drafts**: count of draft transactions (gray, clickable → filters to drafts)

**Account Balance Quick View** (collapsible, below stats):
```
▸ Account Balances          [expand/collapse]
  招商银行: ¥128,350  |  Airwallex: $12,500 / ¥85,200  |  现金: ¥5,200
```
Click any account → filters transaction list by that account.

### Table Columns

| Column | Type | Width | Sortable | Notes |
|--------|------|-------|----------|-------|
| Date | Date | 110px | ✅ default desc | `YYYY-MM-DD` |
| Type | Tag | 80px | ✅ | Income=green, Expense=red, Transfer=blue, Refund=orange |
| Summary | Text | 250px | - | Click → open Detail Drawer |
| Account | Text | 130px | - | For Transfer: "A → B" format |
| Category | Text | 120px | - | "Parent / Child" format |
| Counterparty | Text | 120px | - | - |
| Currency | Text | 60px | - | CNY / USD / EUR etc. |
| Amount | Amount | 110px | ✅ | Right-aligned, thousand separator, color by type |
| CNY Equiv. | Amount | 100px | ✅ | If currency ≠ CNY; gray if same |
| Status | Badge | 80px | ✅ | Draft=gray, Submitted=green |
| 📎 | Icon | 40px | - | Attachment indicator (count if >0) |
| Actions | Buttons | 100px | - | [Edit] [Delete] (drafts only) |

### "+ New Transaction" Button
Primary button opens Transaction Form Drawer directly (default: Expense type).
Type is switchable **inside the Drawer** via top Tabs — no need to close and reopen.

Also triggered by global shortcut `Ctrl+N` from any page.

### Toolbar Extra Buttons
- **[Batch Entry]** → navigate to `/ledger/transactions/batch` (spreadsheet-like bulk entry, see Section 2a)

### "Import" Dropdown
- Import Airwallex PDF → navigate to `/ledger/import?source=airwallex`
- Sync Lemon Cloud → navigate to `/ledger/import?source=lemoncloud`

---

## 2a. Batch Entry Mode `/ledger/transactions/batch`

### Layout
Spreadsheet-like inline editing for rapid data entry.

```
┌─ PageHeader: "Batch Entry" ─── [← Back to List] ─────────────────┐
│                                                                    │
│ ┌─ Editable Table ───────────────────────────────────────────┐   │
│ │ # | Date       | Type    | Amount  | Account | Category    │   │
│ │   | (picker)   | (select)| (input) | (select)| (cascader)  │   │
│ │   | Counterparty | Summary           | Currency | Rate      │   │
│ │───┼────────────┼─────────┼─────────┼─────────┼─────────────│   │
│ │ 1 | 2026-04-21 | Expense | 1,200   | 招商银行 | 运营/广告  │   │
│ │   | Amazon Ads | Q2 ad top-up        | CNY      | -         │   │
│ │───┼────────────┼─────────┼─────────┼─────────┼─────────────│   │
│ │ 2 | 2026-04-21 | Expense | 500     | 招商银行 | 人力/社保  │   │
│ │   | 社保中心   | April social insurance| CNY     | -         │   │
│ │───┼────────────┼─────────┼─────────┼─────────┼─────────────│   │
│ │ + | (click to add row)                                      │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ Rows: 5  |  Total: ¥3,200                                         │
│                                                  [Submit All]      │
└────────────────────────────────────────────────────────────────────┘
```

### Behavior
- Each row = 1 transaction (2-line display: line 1 core fields, line 2 counterparty + summary)
- **Tab key** moves between cells; **Enter** moves to next row
- Click `+` or press Enter on last row → add new empty row
- **Default values**: Date = today, Type = Expense, Account = last used, Currency = CNY
- Validation: inline red border on invalid cells
- [Submit All] → batch create, show result summary (N success, N failed with reasons)
- Transfers NOT supported in batch mode (too complex); only Income/Expense/Refund

### Filter Fields

| Filter | Component | Notes |
|--------|-----------|-------|
| Date Range | DateRangePicker | Default: current month |
| Type | Select (multi) | Income / Expense / Transfer / Refund |
| Account | Select (multi) | From account list |
| Category | Cascader | 2-level, multi-select |
| Currency | Select | CNY / USD / EUR / GBP / JPY |
| Counterparty | Input | Auto-suggest from history |
| Amount Range | InputNumber × 2 | Min ~ Max |
| Status | Select | All / Draft / Submitted |
| Keyword | Input.Search | Searches summary, remark, counterparty |

---

## 2. Transaction Form Drawer

### Trigger
"+ New Transaction" → select type, OR click Edit on existing transaction.

### Layout
Drawer from right (width: 640px). Title: "New Transaction" (create) / "Edit Transaction" (edit).

**Type Tabs** at top of Drawer: `[Income] [Expense] [Transfer] [Refund]`
- Switching type preserves shared fields (date, summary, remark)
- Account and amount fields reset on type switch

**Continuous Entry Toggle** (bottom-left): `☐ Continuous entry (keep open after save)`
- When checked: after save, Drawer stays open, form clears (preserving date + account), ready for next entry
- When unchecked (default): save → close Drawer → refresh list

### Common Fields (all types)

| Field | Component | Required | Default | Validation |
|-------|-----------|----------|---------|------------|
| Date | DatePicker | ✅ | Today | Cannot be in future |
| Summary | Input | ✅ | - | 2-200 chars |
| Remark | TextArea | - | - | Max 500 chars |
| Attachments | Upload (drag-drop) | - | - | Max 5 files, 20MB each, image/pdf |

### Income / Expense Fields

| Field | Component | Required | Notes |
|-------|-----------|----------|-------|
| Account | Select | ✅ | From account list |
| Amount | InputNumber | ✅ | > 0, 2 decimal places |
| Currency | Select | ✅ | Default: account's currency |
| Exchange Rate | InputNumber | Auto-fill | From Lingxing monthly rate; editable; shown only if currency ≠ CNY |
| CNY Equivalent | Display | Auto-calc | = Amount × Rate; read-only |
| Category | Cascader | ✅ | 2-level (parent → child) |
| Counterparty | AutoComplete | - | Suggest from history + Lingxing suppliers |
| Reimbursement | Checkbox | - | "Flag for reimbursement" |
| Invoice Flag | Checkbox | - | "Has invoice" |
| Linked Record | Select | - | Search PR#/Invoice# to link (optional jump link) |

### Transfer Fields

| Field | Component | Required | Notes |
|-------|-----------|----------|-------|
| From Account | Select | ✅ | Source account |
| From Amount | InputNumber | ✅ | Amount debited |
| From Currency | Display | Auto | Follows from-account currency |
| To Account | Select | ✅ | Target account |
| To Amount | InputNumber | ✅ | Amount credited; **auto-calc if same currency** |
| To Currency | Display | Auto | Follows to-account currency |
| Exchange Rate | InputNumber | Auto-fill | Shown only if from/to currencies differ |
| Exchange Gain/Loss | Display | Auto-calc | = To Amount × rate - From Amount; green if gain, red if loss |

**Key interaction**: When From and To accounts have **same currency**, To Amount = From Amount (locked). When **different currencies**, To Amount is editable with rate auto-fill.

### Refund Fields
Same as Expense, plus:

| Field | Component | Required | Notes |
|-------|-----------|----------|-------|
| Original Transaction | Select | - | Search by date/amount/summary to link original |

Amount is entered as positive but stored and displayed as negative.

### Footer Buttons
- [Cancel] — close Drawer (confirm if dirty)
- [Save] (primary) — save with status=submitted, DOES affect balances immediately
- [Save ▾] dropdown → [Save as Draft] — save with status=draft, does NOT affect balances

> Note: "Save" (submit) is the primary action; Draft is secondary for incomplete entries.

### Category Quick Access
- Cascader shows **"Recent" section** at top with last 5 used categories
- Below recent: full 2-level tree as before

### Edit Mode
- **Draft transactions**: all fields editable, can Save Draft or Submit
- **Submitted transactions**: only Remark, Category, Counterparty, Attachments editable; amount/date/account locked; show warning "Submitted transactions have limited editable fields"
- **No delete for submitted transactions** — only drafts can be deleted

---

## 3. Transaction Detail Drawer

### Trigger
Click transaction summary in list → Drawer (width: 800px)

### Record Navigation
- Footer includes **[← Prev] [Next →]** buttons to navigate between records without closing Drawer
- Follows current list sort/filter order

### Layout
```
┌─ Header: Type Tag + Summary ─── Status Badge ──────────────────┐
│                                                                  │
│ ┌─ ProDescriptions (2-column) ────────────────────────────────┐ │
│ │ Date: 2026-04-15         | Account: 招商银行               │ │
│ │ Amount: ¥12,500.00       | Currency: CNY                    │ │
│ │ Category: 运营 / 广告费  | Counterparty: Amazon Ads         │ │
│ │ Exchange Rate: -         | CNY Equiv.: ¥12,500.00           │ │
│ │ Reimbursement: No        | Invoice: Yes                      │ │
│ │ Created by: 张三         | Created at: 2026-04-15 14:30     │ │
│ │ Submitted at: 2026-04-15 14:32                               │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Remark: "Q2 广告充值"                                           │
│                                                                  │
│ ┌─ Attachments ───────────────────────────────────────────────┐ │
│ │ [receipt.pdf] [invoice.jpg]  (click to preview)             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─ Linked Record ─────────────────────────────────────────────┐ │
│ │ Payment Request: PR-2026-0415-001 → [Jump to Reconciliation]│ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─ Audit Trail (mini table) ──────────────────────────────────┐ │
│ │ 2026-04-15 14:30 张三 Created (draft)                       │ │
│ │ 2026-04-15 14:32 张三 Submitted                             │ │
│ │ 2026-04-16 10:00 李四 Updated category                      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Footer: [Edit] [Delete] (draft only)                            │
└──────────────────────────────────────────────────────────────────┘
```

### Transfer Detail
Shows both accounts:
```
From: 招商银行 (CNY)  ¥50,000.00
  →
To:   Airwallex (USD)  $6,890.00
Rate: 7.2568
Exchange Loss: -¥12.40
```

---

## 4. Account Management `/ledger/accounts`

### Layout
Card grid + detail panel.

```
┌─ PageHeader: "Accounts" ─────────────────────────────────────────┐
│ ┌─ Account Cards (grid, 3 per row) ─────────────────────────┐   │
│ │ ┌────────────┐ ┌────────────┐ ┌────────────┐               │   │
│ │ │ 🏦 招商银行 │ │ 💳 Airwallex│ │ 💵 现金账  │               │   │
│ │ │ CNY        │ │ USD + CNY  │ │ CNY        │               │   │
│ │ │ ¥128,350   │ │ $12,500    │ │ ¥5,200     │               │   │
│ │ │ Active  ●  │ │ Active  ●  │ │ Active  ●  │               │   │
│ │ └────────────┘ └────────────┘ └────────────┘               │   │
│ │                                                             │   │
│ │ [+ Add Account]                                             │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌─ Selected Account Detail ──────────────────────────────────┐   │
│ │ Account Name: 招商银行                                      │   │
│ │ Type: Bank  |  Currency: CNY  |  Bank: 招商银行             │   │
│ │ Account Number: ****6789                                    │   │
│ │ Opening Balance: ¥0.00 (2024-01-01)                         │   │
│ │ Current Balance: ¥128,350.00                                │   │
│ │                                                             │   │
│ │ Recent Transactions (last 10):                              │   │
│ │ (mini ProTable: date, summary, amount, balance)             │   │
│ │ [View All Transactions →]  (links to /ledger/transactions   │   │
│ │  with account filter pre-applied)                           │   │
│ │                                                             │   │
│ │ [Edit Account] [Disable Account]                            │   │
│ └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

### Account Card
- Click card → show detail below + highlight card
- Balance = SUM of all submitted transactions for this account
- Color by type: Bank=blue, Airwallex=purple, Cash=green, Other=gray

### Add/Edit Account Modal

| Field | Component | Required | Notes |
|-------|-----------|----------|-------|
| Account Name | Input | ✅ | 2-50 chars |
| Type | Select | ✅ | Bank / Airwallex / Cash / Other |
| Currency | Select | ✅ | CNY / USD / EUR / GBP / JPY / HKD |
| Bank Name | Input | Conditional | Required if type=Bank |
| Account Number | Input | - | Last 4 digits shown, full stored |
| Opening Balance | InputNumber | - | Default 0 |
| Opening Date | DatePicker | - | Default first transaction date or system start date |
| Status | Radio | - | Active (default) / Disabled |

### Disable Account
- Confirm dialog: "Disable account {name}? It will not appear in transaction forms."
- If account has pending drafts → warn: "{N} draft transactions use this account."

---

## 5. Category Management `/ledger/categories`

### Layout
Tree list with inline editing.

```
┌─ PageHeader: "Income/Expense Categories" ────────────────────────┐
│ ┌─ Tabs ─────────────────────────────────────────────────────┐   │
│ │ [Income Categories] [Expense Categories]                    │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌─ Category Tree ────────────────────────────────────────────┐   │
│ │ ▾ 运营费用                                    [Edit][+][✕] │   │
│ │   ├── 广告费                                  [Edit]   [✕] │   │
│ │   ├── 平台佣金                                [Edit]   [✕] │   │
│ │   ├── FBA 费用                                [Edit]   [✕] │   │
│ │   └── 仓储费                                  [Edit]   [✕] │   │
│ │ ▾ 采购成本                                    [Edit][+][✕] │   │
│ │   ├── 产品采购                                [Edit]   [✕] │   │
│ │   └── 配件采购                                [Edit]   [✕] │   │
│ │ ▸ 物流费用                                    [Edit][+][✕] │   │
│ │ ▸ 人力成本                                    [Edit][+][✕] │   │
│ │                                                             │   │
│ │ [+ Add Parent Category]                                     │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ Note: Categories used by existing transactions cannot be deleted.  │
└────────────────────────────────────────────────────────────────────┘
```

### Interactions
- **[+]** on parent → inline input to add child category; Enter=save, Esc=cancel
- **[Edit]** → inline edit name; Enter=save, Esc=cancel
- **[✕]** → if used by 0 transactions: confirm delete; if used: "Cannot delete: used by {N} transactions"
- **[+ Add Parent Category]** → inline input at bottom
- Drag to reorder within same level (optional, nice-to-have)

---

## 6. Import Workflow `/ledger/import`

### Layout
Stepper page with 4 steps.

### Step 1: Select Source & Upload
```
┌─ Source Selection ────────────────────────────────────────────────┐
│                                                                    │
│  ○ Airwallex PDF Statement                                        │
│  ○ Lemon Cloud Journal Sync                                       │
│                                                                    │
│  [If Airwallex selected]:                                         │
│  ┌─ Upload Zone (drag-drop) ─────────────────────────────────┐   │
│  │                                                            │   │
│  │   📄 Drop PDF file here or click to browse                 │   │
│  │   Max 50MB, PDF only                                       │   │
│  │                                                            │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  [If Lemon Cloud selected]:                                       │
│  ┌─ Sync Config ─────────────────────────────────────────────┐   │
│  │  Account Set: [Select ▾]   Date Range: [DateRangePicker]  │   │
│  │  [Start Sync]                                              │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│                                                [Next →]            │
└────────────────────────────────────────────────────────────────────┘
```

### Airwallex Upload Interaction
1. User drops PDF → parse begins → progress bar
2. **Filename check**: if same filename in `import_batches` → warning Alert: "A file with this name was imported on {date}. Are you sure?"
3. Parse complete → show row count: "Found {N} transactions from {start_date} to {end_date}"
4. Click [Next →]

### Step 2: Preview & Edit
```
┌─ Parsed Transactions ────────────────────────────────────────────┐
│                                                                    │
│ Batch: Airwallex_CNY_2026-03.pdf | 45 transactions found          │
│                                                                    │
│ ┌─ ProTable (editable cells) ────────────────────────────────┐   │
│ │ ☐ | Date       | Type     | Details        | Credit | Debit│   │
│ │ ☑ | 2026-03-01 | Transfer | PIPO received  | 8,528  |      │   │
│ │ ☑ | 2026-03-01 | Fee      | Monthly fee    |        | 25   │   │
│ │ ...                                                         │   │
│ │                                                             │   │
│ │ Editable columns (click cell to edit):                      │   │
│ │ - Category (Cascader)                                       │   │
│ │ - Counterparty (AutoComplete)                               │   │
│ │ - Account (Select, pre-filled from PDF)                     │   │
│ │ - Summary (Input, pre-filled from PDF Details)              │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ Uncheck rows to exclude from import.                              │
│                                                                    │
│                                    [← Back] [Next: Check Dupes →] │
└────────────────────────────────────────────────────────────────────┘
```

### Step 3: Dedup Check
```
┌─ Duplicate Detection ────────────────────────────────────────────┐
│                                                                    │
│  ✅ 40 transactions — no duplicates found                         │
│                                                                    │
│  ⚠️ 5 potential duplicates detected:                              │
│  ┌─ Duplicate Table ─────────────────────────────────────────┐   │
│  │ Import Row          | Existing Transaction    | Match     │   │
│  │ 2026-03-05 ¥8,528  | #TXN-1234 2026-03-05   | date+amt  │   │
│  │ 2026-03-10 ¥25     | #TXN-1240 2026-03-10   | date+amt  │   │
│  │ ...                                                        │   │
│  └────────────────────────────────────────────────────────────┘   │
│                                                                    │
│  For each duplicate:                                              │
│    ○ Skip (don't import)                                          │
│    ○ Import anyway (I confirm this is not a duplicate)            │
│                                                                    │
│                                         [← Back] [Confirm Import →]│
└────────────────────────────────────────────────────────────────────┘
```

### Step 4: Result
```
┌─ Import Complete ────────────────────────────────────────────────┐
│                                                                    │
│  ✅ Successfully imported 42 transactions                         │
│  ⏭️ Skipped 3 duplicates                                         │
│                                                                    │
│  Batch ID: IMP-2026-0421-001                                      │
│  Total Amount: Income ¥325,000  |  Expense ¥12,500                │
│                                                                    │
│  [View Imported Transactions →]  [Import Another File]             │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

"View Imported Transactions" → `/ledger/transactions` with batch filter pre-applied.

**Auto-redirect**: After 5 seconds, automatically redirect to transaction list (with imported batch filter). Countdown shown: "Redirecting to transactions in 5s... [Stay on this page]"

---

## 7. Reports `/ledger/reports`

### Layout
Tabs with charts + tables.

```
┌─ PageHeader: "Financial Reports" ────────────────────────────────┐
│ ┌─ Tabs ─────────────────────────────────────────────────────┐   │
│ │ [Income/Expense Summary] [Account Balances] [Category]      │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌─ Controls ─────────────────────────────────────────────────┐   │
│ │ Period: [Monthly ▾]  Range: [2026-01 ~ 2026-04]  [Apply]   │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ (Tab content below)                                                │
└────────────────────────────────────────────────────────────────────┘
```

### Tab 1: Income/Expense Summary
- **Bar chart**: monthly income (green bars) vs expense (red bars), x=month
- **Line overlay**: net balance trend
- **Summary table below**: Month | Income | Expense | Net | Cumulative Balance

### Tab 2: Account Balances
- **Cards**: one per active account, showing current balance + currency
- **Table**: Account | Currency | Opening | Income | Expense | Transfer In | Transfer Out | Current Balance
- Click account row → navigate to `/ledger/transactions?account={id}`

### Tab 3: Category Breakdown
- **Pie chart**: expense by parent category (donut style)
- **Treemap or bar chart**: income by parent category
- **Drill-down table**: click parent → show children with amounts
- Period filter applies

---

## State Transitions

### Transaction Status
```
         User creates
              │
              ▼
    ┌──── Draft ────────────────────┐
    │         │                      │
    │  User submits           User deletes
    │         │                      │
    │         ▼                      ▼
    │    Submitted              (removed)
    │         │
    │   (limited edit: remark, category,
    │    counterparty, attachments only)
    │
    └── User edits (all fields) ──→ Draft
```

### Import Batch Status
```
Upload → Parsing → Parsed → Reviewing → Confirmed → Done
                     │                       │
                     └── Parse Error          └── Partially Imported
                         (show error,             (some rows skipped)
                          allow re-upload)
```
