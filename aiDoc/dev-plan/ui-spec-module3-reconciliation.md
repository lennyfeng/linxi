# UI Spec — Module 3: Reconciliation

> Per-page field definitions, interaction flows, and state transitions.

---

## Page Map

```
/reconciliation                    → Overview Dashboard
/reconciliation/workspace          → Reconciliation Workspace (split-pane matching)
/reconciliation/purchase-orders    → Purchase Order List
/reconciliation/payment-requests   → Payment Request List
/reconciliation/delivery-orders    → Delivery Order List
/reconciliation/invoices           → Invoice List
/reconciliation/sync               → Sync Job Monitor
```

---

## 1. Overview `/reconciliation`

### Layout
Stats + alert list.

```
┌─ PageHeader: "Reconciliation Overview" ──────────────────────────┐
│                                                                    │
│ ┌─ Stats Cards (4 columns) ──────────────────────────────────┐   │
│ │ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐       │   │
│ │ │ Purchase │ │ Payment  │ │ Delivery │ │ Invoices │       │   │
│ │ │ Orders   │ │ Requests │ │ Orders   │ │          │       │   │
│ │ │ Total:248│ │ Total:89 │ │ Total:156│ │ Total:203│       │   │
│ │ │ ✅ 180   │ │ ✅ 65    │ │ ✅ 120   │ │ ✅ 150   │       │   │
│ │ │ ⚠️ 48    │ │ ⚠️ 15    │ │ ⚠️ 30    │ │ ⚠️ 40    │       │   │
│ │ │ ❌ 20    │ │ ❌ 9     │ │ ❌ 6     │ │ ❌ 13    │       │   │
│ │ └──────────┘ └──────────┘ └──────────┘ └──────────┘       │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌─ Alerts ───────────────────────────────────────────────────┐   │
│ │ ⚠️ 8 purchase orders uninvoiced for >30 days    [View →]   │   │
│ │ ⚠️ 3 payment requests without invoices          [View →]   │   │
│ │ ⚠️ 2 invoices unmatched for >15 days            [View →]   │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌─ Last Sync Status ────────────────────────────────────────┐    │
│ │ Lingxing PO: 2026-04-21 15:00 ✅ | PR: 15:00 ✅          │    │
│ │ Lingxing DO: 2026-04-21 15:00 ✅ | Supplier: 14:00 ✅     │    │
│ │ Lemon Cloud Invoice: 2026-04-21 12:00 ✅                   │    │
│ │                                          [Sync All Now]    │    │
│ └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

### Stats Card Breakdown
- ✅ Fully linked (green number)
- ⚠️ Partially linked (orange number)
- ❌ Not linked (red number, clickable → filtered list)

Each card is clickable → navigate to corresponding list page.

### Alert Types
| Alert | Condition | Action |
|-------|-----------|--------|
| Uninvoiced PO | PO created >30 days, status = not_linked | Link to PO list filtered |
| PR without invoice | PR status = not_obtained | Link to PR list filtered |
| Unmatched invoice | Invoice status = not_matched, >15 days | Link to invoice list filtered |

---

## 2. Purchase Order List `/reconciliation/purchase-orders`

### Layout
Standard List Page.

### Table Columns

| Column | Type | Width | Sortable | Notes |
|--------|------|-------|----------|-------|
| PO Number | Text | 150px | ✅ | Lingxing order_sn; click → Detail Drawer |
| Custom PO # | Text | 130px | ✅ | custom_order_sn |
| Supplier | Text | 150px | - | Supplier name |
| Type | Tag | 80px | - | Purchase type |
| PO Date | Date | 100px | ✅ | From Lingxing |
| Total Amount | Amount | 120px | ✅ | CNY, right-aligned |
| Linked Amount | Amount | 120px | ✅ | Sum of invoice amounts linked |
| Unlinked | Amount | 100px | ✅ | Total - Linked; red if >0 |
| Status | Badge | 120px | ✅ | Not linked / Partial / Full / Do-not-remind |
| Relations | Number | 60px | - | Count of linked invoices |
| Last Sync | DateTime | 130px | ✅ | When this record was last synced |
| Actions | Buttons | 120px | - | [Link Invoice] [Do-not-remind] |

### Filters
| Filter | Component |
|--------|-----------|
| PO Number / Custom # | Input.Search |
| Supplier | Select (searchable) |
| Status | Select (multi) |
| Date Range | DateRangePicker |
| Amount Range | InputNumber × 2 |
| Has unlinked amount | Checkbox |

### Actions
- **[Link Invoice]** → opens Linking Modal (see below)
- **[Do-not-remind]** → confirm dialog, sets status to "do-not-remind" (hides from alerts)

---

## 3. Payment Request List `/reconciliation/payment-requests`

Same layout pattern as PO list.

### Table Columns

| Column | Type | Width | Notes |
|--------|------|-------|-------|
| PR Number | Text | 150px | Click → Detail Drawer |
| Supplier | Text | 150px | - |
| Status (PR) | Tag | 80px | Lingxing status (pending/approved/paid/etc.) |
| PR Date | Date | 100px | - |
| Total Amount | Amount | 120px | - |
| Invoice Amount | Amount | 120px | Sum of linked invoices |
| Unmatched | Amount | 100px | Red if >0 |
| Recon Status | Badge | 120px | Not obtained / Partial / Full / Do-not-remind |
| Actions | Buttons | 120px | [Link Invoice] [Do-not-remind] |

---

## 4. Delivery Order List `/reconciliation/delivery-orders`

Same layout pattern.

### Table Columns

| Column | Type | Width | Notes |
|--------|------|-------|-------|
| Shipment # | Text | 150px | Click → Detail Drawer |
| Destination | Text | 100px | FBA warehouse / address |
| Status (DO) | Tag | 100px | Lingxing shipment status |
| Ship Date | Date | 100px | - |
| Items | Number | 60px | Number of SKUs |
| Total Qty | Number | 80px | Total quantity |
| PO Linked | Badge | 80px | Yes/No — whether linked to PO |
| Invoice Linked | Badge | 80px | Yes/No |
| Actions | Buttons | 100px | [Link PO] [Link Invoice] |

---

## 5. Invoice List `/reconciliation/invoices`

### Table Columns

| Column | Type | Width | Notes |
|--------|------|-------|-------|
| Invoice # | Text | 130px | Click → Detail Drawer |
| Invoice Code | Text | 130px | 发票代码 |
| Seller | Text | 150px | 销售方 |
| Invoice Date | Date | 100px | - |
| Amount (tax-incl.) | Amount | 120px | 含税金额, primary for matching |
| Amount (tax-excl.) | Amount | 110px | 不含税金额 |
| Tax Amount | Amount | 90px | 税额 |
| Tax Rate | Text | 60px | e.g. "13%" |
| Matched Amount | Amount | 120px | Sum linked to POs/PRs |
| Unmatched | Amount | 100px | Red if >0 |
| Status | Badge | 100px | Not matched / Partial / Full |
| Source | Tag | 80px | Lemon Cloud / Manual |
| Actions | Buttons | 100px | [Match PO] [Match PR] |

---

## 6. Entity Detail Drawer (shared pattern)

### Trigger
Click any entity number in list → Drawer from right (width: 800px)

### Layout (example: Purchase Order)
```
┌─ Header: PO-2026-0321-001 ── Status: Partially Linked ─────────┐
│                                                                  │
│ ┌─ Source Info (ProDescriptions) ─────────────────────────────┐ │
│ │ PO Number: PO-2026-0321-001  | Supplier: 深圳明达五金      │ │
│ │ Date: 2026-03-21             | Total: ¥45,800.00           │ │
│ │ Type: Standard               | Synced: 2026-04-21 15:00    │ │
│ │ Lingxing Status: Completed   | Custom #: CG-2026-0045      │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─ Line Items (if PO/DO) ────────────────────────────────────┐ │
│ │ SKU      | Product Name     | Qty  | Unit Price | Subtotal │ │
│ │ LX-A001  | 硅胶保护套       | 500  | ¥12.80     | ¥6,400   │ │
│ │ LX-A002  | 钢化玻璃膜       | 1000 | ¥3.94      | ¥3,940   │ │
│ │ ...                                                         │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─ Linked Records ───────────────────────────────────────────┐ │
│ │ ┌─ Linked Invoices ─────────────────────────────────────┐  │ │
│ │ │ Invoice #   | Date       | Amount   | Split Amt | [✕] │  │ │
│ │ │ FP-12345    | 2026-03-25 | ¥50,000  | ¥30,000   | [✕] │  │ │
│ │ │ FP-12346    | 2026-04-01 | ¥20,000  | ¥15,800   | [✕] │  │ │
│ │ │                                                        │  │ │
│ │ │ Linked Total: ¥45,800  /  PO Total: ¥45,800           │  │ │
│ │ │ Remaining: ¥0.00 ✅                                    │  │ │
│ │ └────────────────────────────────────────────────────────┘  │ │
│ │                                                             │ │
│ │ [+ Link Invoice]                                            │ │
│ │                                                             │ │
│ │ ┌─ Linked Payment Requests ─────────────────────────────┐  │ │
│ │ │ (same table pattern)                                   │  │ │
│ │ └────────────────────────────────────────────────────────┘  │ │
│ │ [+ Link Payment Request]                                    │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─ Sync Log ─────────────────────────────────────────────────┐ │
│ │ 2026-04-21 15:00 Full sync — no changes                    │ │
│ │ 2026-04-20 15:00 Updated: status changed to Completed      │ │
│ └─────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────┘
```

### Linked Records Section
- Shows all linked entities with **split amounts**
- [✕] button to remove a relation (confirm: "Remove link? This does not delete the invoice.")
- "Linked Total" vs "Entity Total" comparison with progress bar
- Remaining = Total - Linked; green ✅ if 0, red if >0

### [+ Link Invoice] → Linking Modal

---

## 7. Linking Modal (core interaction)

### Trigger
Click [Link Invoice] / [Match PO] / etc. from any entity detail.

### Layout
```
┌─ Modal: Link Invoice to PO-2026-0321-001 ───────────────────────┐
│                                                                    │
│ PO Total: ¥45,800.00  |  Already Linked: ¥30,000  |              │
│ Remaining: ¥15,800.00                                             │
│                                                                    │
│ ┌─ Recommended Matches ─────────────────────────────────────┐    │
│ │ 💡 System found 3 potential matches (same supplier,       │    │
│ │    date within 30 days, amount similar)                    │    │
│ │                                                            │    │
│ │ ☐ FP-12350 | 2026-04-05 | ¥18,000 | 深圳明达 | Score:95% │    │
│ │ ☐ FP-12355 | 2026-04-10 | ¥12,500 | 深圳明达 | Score:80% │    │
│ │ ☐ FP-12360 | 2026-04-15 | ¥8,200  | 深圳明达 | Score:60% │    │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌─ Search All Invoices ──────────────────────────────────────┐   │
│ │ [Search: invoice #, seller name, amount...]                 │   │
│ │                                                             │   │
│ │ (Full invoice list, filtered, paginated)                    │   │
│ │ ☐ FP-xxxxx | date | amount | seller | status               │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌─ Selected for Linking ─────────────────────────────────────┐   │
│ │ Invoice     | Invoice Amount | Split Amount (editable)     │   │
│ │ FP-12350    | ¥18,000        | [¥15,800_________]          │   │
│ │                                                             │   │
│ │ Total Split: ¥15,800  /  Remaining: ¥0.00 ✅               │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│                                            [Cancel] [Confirm Link] │
└────────────────────────────────────────────────────────────────────┘
```

### Interaction Flow
1. Modal opens showing PO info + remaining amount
2. **Recommended matches** shown at top (sorted by score)
3. User checks invoices to link (from recommendations or search)
4. Checked invoices appear in "Selected for Linking" section
5. **Split Amount** is editable per invoice:
   - Default: min(invoice unmatched amount, PO remaining)
   - Validation: split ≤ invoice unmatched amount, total splits ≤ PO remaining
6. [Confirm Link] → create relations → refresh detail → success toast

### Split Amount Rules
- One invoice can be split across multiple POs (N invoices → 1 PO, or 1 invoice → N POs)
- Split amount must be > 0
- Sum of all splits for one invoice ≤ invoice total (tax-inclusive)
- Sum of all splits for one PO ≤ PO total

---

## 8. Reconciliation Workspace `/reconciliation/workspace`

### Purpose
The core daily workflow page for reconciliation. Eliminates constant tab switching by showing **two entity lists side by side** for direct matching.

### Layout
```
┌─ PageHeader: "Reconciliation Workspace" ───────────────────────────┐
│                                                                    │
│ ┌─ Left Panel (50%): Source ──┬─ Right Panel (50%): Target ───┐ │
│ │                            │                                  │ │
│ │ Source Type:               │ Target Type:                    │ │
│ │ [PO ▾] [PR ▾] [DO ▾]       │ [Invoices ▾]                    │ │
│ │                            │                                  │ │
│ │ Filter: [Supplier] [Status]│ Filter: [Seller] [Status]       │ │
│ │         [Date] [Unlinked☑] │         [Date] [Unlinked☑]      │ │
│ │                            │                                  │ │
│ │ ┌─ Mini Table ──────────┐ │ ┌─ Mini Table ────────────┐ │ │
│ │ │ ● PO-001 ¥45,800  │ │ │ ○ FP-12350 ¥18,000   │ │ │
│ │ │   深圳明达       │ │ │   深圳明达五金      │ │ │
│ │ │   Unlinked:¥15.8k│ │ │   Unmatched:¥18k   │ │ │
│ │ │                  │ │ │                      │ │ │
│ │ │ ○ PO-002 ¥12,000 │ │ │ ○ FP-12355 ¥12,500   │ │ │
│ │ │   东莞华诚       │ │ │   东莞华诚科技      │ │ │
│ │ │   Fully linked ✅│ │ │   Unmatched:¥12.5k  │ │ │
│ │ │                  │ │ │                      │ │ │
│ │ │ ○ PO-003 ¥8,200  │ │ │ ○ FP-12360 ¥8,200    │ │ │
│ │ │   ...            │ │ │   ...                │ │ │
│ │ └──────────────────┘ │ └──────────────────────┘ │ │
│ │                            │                                  │ │
│ └────────────────────────────┴──────────────────────────────────┘ │
│                                                                    │
│ ┌─ Link Action Bar ───────────────────────────────────────────┐ │
│ │ Selected: PO-001 (¥15,800 remaining) ←→ FP-12350 (¥18,000)    │ │
│ │ Split Amount: [¥15,800______]                                 │ │
│ │                                              [Create Link]   │ │
│ └───────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘
```

### Interaction Flow
1. User selects **Source type** (PO / PR / DO) on the left
2. User selects **Target type** (Invoices) on the right — auto-defaults to Invoices
3. Both panels show filtered lists; **"Unlinked only" checked by default**
4. Click a row on left → highlights it as selected (radio, ●)
5. Click a row on right → highlights it
6. **Link Action Bar** appears at bottom showing selected pair + split amount input
7. Click [Create Link] → creates relation → both lists refresh → linked items update status
8. Repeat: select next pair

### Smart Filtering
- When a **source** row is selected (e.g. PO from 深圳明达), the **right panel automatically filters** to show invoices from the same supplier first (highlighted with 💡 icon)
- Supplier name fuzzy matching: "深圳明达五金" matches "深圳明达五金有限公司"

### Keyboard Shortcuts (Workspace-specific)
| Shortcut | Action |
|----------|--------|
| `↑` `↓` | Navigate rows in focused panel |
| `Tab` | Switch focus between left and right panel |
| `Enter` | Confirm link with current split amount |
| `Esc` | Deselect current selection |

### When to Use Workspace vs Individual Lists
- **Workspace**: daily reconciliation work (batch matching)
- **Individual lists** (PO/PR/DO/Invoice pages): viewing detail, complex queries, export, status review
- Overview sidebar includes shortcut: **[Start Matching →]** button → opens Workspace

---

## 9. Sync Job Monitor `/reconciliation/sync`

### Layout
```
┌─ PageHeader: "Sync Jobs" ────────────────────────────────────────┐
│                                                                    │
│ ┌─ Active Jobs ──────────────────────────────────────────────┐   │
│ │ Source          | Type     | Status    | Started    | Dur  │   │
│ │ Lingxing PO     | Hourly   | ✅ Done   | 15:00     | 12s  │   │
│ │ Lingxing PR     | Hourly   | ✅ Done   | 15:00     | 8s   │   │
│ │ Lingxing DO     | Hourly   | 🔄 Running| 15:01     | -    │   │
│ │ Lingxing Suppl. | Daily    | ✅ Done   | 00:00     | 25s  │   │
│ │ Lemon Invoice   | Daily    | ❌ Failed | 12:00     | 3s   │   │
│ │                                                             │   │
│ │ Each row: [Trigger Now] [View Logs]                         │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌─ Job History (ProTable) ───────────────────────────────────┐   │
│ │ (Paginated, filterable by source/status/date)               │   │
│ │ ID | Source | Started | Completed | Status | Records | Error│   │
│ │ 45 | LX PO  | 15:00  | 15:00:12  | ✅     | +5 △2   |     │   │
│ │ 44 | LM Inv | 12:00  | 12:00:03  | ❌     | -       | 401 │   │
│ │ ...                                                         │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ Click row → Log Drawer (raw request/response JSON)                │
└────────────────────────────────────────────────────────────────────┘
```

### Status Badges
- ✅ Done (green) — with record count: "+5 new, △2 updated"
- 🔄 Running (blue, animated)
- ❌ Failed (red) — with error summary
- ⏭️ Skipped (gray) — "No changes detected"

### Log Drawer
- Full sync log entries (timestamp, level, message)
- For failures: request URL, request body, response status, response body
- [Retry] button for failed jobs

---

## State Transitions

### Reconciliation Status (per entity)

```
         Synced from Lingxing/LemonCloud
                    │
                    ▼
              Not Linked ◄───── User removes all relations
                    │
         User links invoice(s)
                    │
          ┌─────────┴──────────┐
          ▼                    ▼
    Partially Linked      Fully Linked
    (linked < total)      (linked = total)
          │                    │
          │    User adds       │   User removes
          │    more links      │   some links
          └────────────────────┘
                    │
         User clicks "Do-not-remind"
                    │
                    ▼
             Do-not-remind
         (hidden from alerts,
          still visible in list)
```

### Voided Source Handling
```
       Active record ──── Lingxing sync detects deletion ──→ Voided
                                                               │
                                               Relations preserved
                                               but flagged with ⚠️
                                               "Source record voided"
```
