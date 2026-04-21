# UI Spec — Module 4: Product Development

> Per-page field definitions, interaction flows, and state transitions.

---

## Page Map

```
/product-dev/projects              → Project List
/product-dev/projects/new          → New Project Form (multi-step)
/product-dev/projects/:id          → Project Detail (tabbed)
/product-dev/projects/:id/edit     → Edit Project Form
/product-dev/kanban                → Kanban Board
/product-dev/profit-calc           → Standalone Profit Calculator
```

---

## 1. Project List `/product-dev/projects`

### Layout
Standard List Page.

### Table Columns

| Column | Type | Width | Sortable | Notes |
|--------|------|-------|----------|-------|
| Image | Thumbnail | 60px | - | First product image; click to preview |
| Project Name | Text | 200px | ✅ | Click → navigate to Project Detail |
| SKU | Text | 120px | ✅ | Temp code shown if formal SKU not assigned |
| Stage | Tag | 140px | ✅ | Colored by stage group (see below) |
| Developer | Avatar+Name | 130px | ✅ | - |
| Owner | Avatar+Name | 130px | ✅ | - |
| Platform | Tag | 80px | - | Amazon / TikTok / etc. |
| Market | Tag | 60px | - | US / UK / DE / etc. |
| Expected Cost | Amount | 100px | ✅ | RMB |
| Target Price | Amount | 100px | ✅ | USD |
| Days in Stage | Number | 80px | ✅ | Auto-calculated |
| Created | Date | 100px | ✅ | - |
| Updated | Date | 100px | ✅ | - |
| Actions | Buttons | 80px | - | [Edit] |

### Stage Colors
| Stage Group | Stages | Color |
|-------------|--------|-------|
| Research | Pending Research, Researching | Blue |
| Sampling | Sampling Approval, Sampling, Sampling Rejected | Cyan |
| Quoting | Pending Quote | Purple |
| Approval | Pending Project Approval, Project Confirmed, Project Rejected | Orange |
| Finalization | Pending Finalization, Pending Online | Gold |
| Completed | Synced to Lingxing, First Order Placed | Green |

### Filters
| Filter | Component |
|--------|-----------|
| Keyword | Input.Search (project name, SKU) |
| Stage | Select (multi) |
| Developer | Select |
| Owner | Select |
| Platform | Select |
| Market | Select |
| Created date | DateRangePicker |

### Toolbar
- [+ New Project] → navigate to `/product-dev/projects/new`
- [Kanban View] → navigate to `/product-dev/kanban`
- [Export] → Excel
- Batch: [Delete Draft Projects]

---

## 2. Kanban Board `/product-dev/kanban`

### Layout
```
┌─ PageHeader: "Product Development Kanban" ──── [List View] ──────┐
│ ┌─ Filter Bar ───────────────────────────────────────────────┐   │
│ │ [Developer ▾] [Owner ▾] [Platform ▾] [Search...]           │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌─ Columns (horizontal scroll) ──────────────────────────────┐   │
│ │ ┌──────────┐┌──────────┐┌──────────┐┌──────────┐ ...       │   │
│ │ │ Pending  ││Researching││ Sampling ││ Pending  │           │   │
│ │ │ Research ││          ││ Approval ││ Quote    │           │   │
│ │ │ (3)      ││ (5)      ││ (2)      ││ (4)     │           │   │
│ │ │──────────││──────────││──────────││──────────│           │   │
│ │ │┌────────┐││┌────────┐││┌────────┐││┌────────┐│           │   │
│ │ ││ Card   │││ Card   │││ Card   │││ Card   ││           │   │
│ │ │└────────┘││└────────┘││└────────┘││└────────┘│           │   │
│ │ │┌────────┐││┌────────┐││          ││┌────────┐│           │   │
│ │ ││ Card   │││ Card   ││└──────────┘││ Card   ││           │   │
│ │ │└────────┘││└────────┘│            │└────────┘│           │   │
│ │ └──────────┘└──────────┘            └──────────┘           │   │
│ └─────────────────────────────────────────────────────────────┘   │
└────────────────────────────────────────────────────────────────────┘
```

### Card Layout
```
┌─ Card ─────────────────────┐
│ [image]  Project Name   🔴 │  ← Status dot: 🔴 Blocked / 🟡 Waiting / 🟢 On track
│          SKU: LX-A001      │
│                             │
│ 👤 Developer  👤 Owner      │
│ 📅 3 days in stage          │
│ 💰 Target: $29.99           │
│                             │
│ ● Amazon US          (2)💬 │  ← Unread activity badge
└─────────────────────────────┘
```

### Status Dot Logic
| Dot | Condition |
|-----|----------|
| 🔴 Blocked | Approval rejected, or stuck >7 days without stage change |
| 🟡 Waiting | Pending approval, or waiting for sampling result |
| 🟢 On track | Normal progress |

### Card Hover Preview
Hovering a card for 500ms shows a **tooltip/popover** with extra detail (no click needed):
```
┌─ Hover Preview ────────────────────────┐
│ Expected Cost: ¥12.80                  │
│ Target Price:  $29.99                  │
│ Best Margin:   Sea 43.9%               │
│ Preferred Supplier: 深圳明达              │
│ Sampling: Round 2 ✅ Confirmed          │
│ Last Activity: 张三 updated quote (2h ago)│
└──────────────────────────────────────┘
```

### Card Interactions
- **Click card** → Drawer with project summary + [Open Detail] button
- **Drag card** → move between columns
  - **Allowed transitions**: only valid stage transitions (see state diagram below)
  - **Blocked transitions**: some require approval (e.g. can't drag to "Project Confirmed" — needs approval flow)
  - **Visual feedback**: valid drop zones highlighted green, invalid grayed out
  - On drop to valid column → confirm dialog: "Move {project} to {stage}?"
  - On drop to approval-required column → dialog: "This stage requires approval. Submit for approval?"

### Column Header
- Stage name + count
- Column count badge updates live after drag

---

## 3. New Project Form `/product-dev/projects/new`

### Quick Create (alternative entry)
From Project List toolbar or Kanban, **[+ Quick Create]** opens a **mini modal** (not the full multi-step form):

| Field | Required | Notes |
|-------|----------|-------|
| Project Name | ✅ | - |
| SKU (temp) | Auto | Auto-generated |
| Developer | ✅ | - |
| Owner | ✅ | - |
| Platform | ✅ | - |
| Market | ✅ | - |

On save → creates project in "Pending Research" stage with minimal data.
User can fill in remaining details later via Edit.

Use **[+ Full Create]** for the multi-step form below.

### Layout
ProForm with StepsForm (multi-step).

### Step 1: Basic Info

| Field | Component | Required | Validation | Notes |
|-------|-----------|----------|------------|-------|
| Project Name | Input | ✅ | 2-100 chars | - |
| Product Type | Select | ✅ | Standard / Combo / Accessory | - |
| Temp SKU | Input | ✅ | Auto-generated, editable | Format: TMP-YYYYMMDD-NNN |
| Formal SKU | Input | - | Unique check vs Lingxing | Can be set later |
| Material | Input | - | - | e.g. "Silicone + PC" |
| Tags | Select (multi, creatable) | - | - | Free-form tags |
| Developer | Select | ✅ | From user list (filtered by role) | - |
| Owner | Select | ✅ | From user list | - |
| Target Platform | Select (multi) | ✅ | Amazon / TikTok / Shopee / Independent | - |
| Target Market | Select (multi) | ✅ | US / UK / DE / JP / CA / AU / etc. | - |
| Expected Cost (RMB) | InputNumber | - | ≥ 0 | - |
| Target Price (USD) | InputNumber | - | ≥ 0 | - |
| Target Margin | InputNumber | - | 0-100% | - |
| Description | TextArea | - | Max 2000 chars | - |

### Step 2: Research Info

| Field | Component | Required | Notes |
|-------|-----------|----------|-------|
| Competitor Links | Input.TextArea (multi-line) | - | One URL per line; show preview thumbnails |
| Research Notes | TextArea | - | Market analysis, trends, etc. |
| Research Files | Upload (multi) | - | PDF/DOC/XLS/images, max 10 files |
| Product Images | Upload (image gallery) | - | Drag to reorder; max 20 images |
| Packaging Requirements | TextArea | - | - |
| Certification Requirements | Select (multi) | - | CE / FCC / CPSC / ROHS / FDA / etc. |

### Step 3: Review & Create
Summary of all entered data. [Create Project] button.

- On create → project enters "Pending Research" stage
- Redirect to project detail page

### Save Behavior
- Each step auto-saves to draft on Next
- Can go back to previous steps
- [Save Draft] available at any step → creates project in draft state

---

## 4. Project Detail `/product-dev/projects/:id`

### Layout
Full page with tabs.

```
┌─ PageHeader ─────────────────────────────────────────────────────┐
│ [← Back to List]                                                  │
│                                                                    │
│ ┌─ Hero Section ─────────────────────────────────────────────┐   │
│ │ [Image Gallery]  Project: iPhone 16 硅胶保护套              │   │
│ │ (thumbnails,     SKU: LX-A001 (formal) / TMP-20260401-001 │   │
│ │  click to        Stage: [Pending Quote] (orange badge)      │   │
│ │  enlarge)        Developer: 张三  |  Owner: 李四            │   │
│ │                  Platform: Amazon  |  Market: US, UK        │   │
│ │                  Days in stage: 5  |  Created: 2026-03-15   │   │
│ │                                                             │   │
│ │  [Edit Project] [Advance Stage ▾] [Sync to Lingxing]       │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌─ Tabs ─────────────────────────────────────────────────────┐   │
│ │ [Overview] [Sampling] [Quoting] [Profit Calc] [Approvals]  │   │
│ │ [Lingxing Sync] [History]                                   │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ (Tab content below)                                                │
└────────────────────────────────────────────────────────────────────┘
```

### [Advance Stage ▾] Dropdown
Shows only **valid next stages** based on current stage:
- Some transitions are direct (e.g. Researching → Sampling Approval)
- Some require approval submission (e.g. → Pending Project Approval)
- Clicking → confirm dialog or approval submission form

### [Sync to Lingxing] Button
- Only visible after "Pending Online" stage approval
- See Section 9 for sync interaction

---

## 5. Tab: Overview
Displays all project master data in ProDescriptions format.

```
┌─ Basic Info ─────────────────────────────────────────────────────┐
│ Project Name: iPhone 16 硅胶保护套  | Type: Standard             │
│ Material: 硅胶 + PC                 | Tags: [手机壳] [热销]      │
│ Description: ...                                                  │
├─ Market Info ────────────────────────────────────────────────────┤
│ Platform: Amazon         | Market: US, UK                        │
│ Expected Cost: ¥12.80    | Target Price: $29.99                  │
│ Target Margin: 35%       | Certifications: [CE] [FCC]            │
├─ Research ───────────────────────────────────────────────────────┤
│ Competitor Links: (clickable URL list)                            │
│ Research Notes: ...                                               │
│ Research Files: [file1.pdf] [file2.xlsx]                          │
│ Packaging Requirements: ...                                       │
├─ Product Images ─────────────────────────────────────────────────┤
│ (Image gallery grid, click to enlarge)                            │
└──────────────────────────────────────────────────────────────────┘
```

---

## 6. Tab: Sampling

### Layout
```
┌─ Sampling Rounds ────────────────────────────────────────────────┐
│ [+ Add Sampling Round]                                            │
│                                                                    │
│ ┌─ Round 1 (card, collapsible) ──────────────────────────────┐   │
│ │ Supplier: 深圳明达五金  |  Cost: ¥8.50  |  Lead: 7 days    │   │
│ │ Timeline: 2026-03-20 ~ 2026-03-27                          │   │
│ │ Status: ✅ Confirmed                                        │   │
│ │                                                             │   │
│ │ Images: [sample1.jpg] [sample2.jpg] (click to preview)     │   │
│ │ Review: Approved — "Quality meets requirements"             │   │
│ │                                                             │   │
│ │ [Edit] [Delete]                                             │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌─ Round 2 (card) ───────────────────────────────────────────┐   │
│ │ Supplier: 东莞华诚  |  Cost: ¥9.20  |  Lead: 10 days       │   │
│ │ Status: ❌ Rejected                                         │   │
│ │ Rejection Reason: "Color mismatch, rough edges"             │   │
│ │ Improvement Notes: "Need matte finish, smooth edges"        │   │
│ │                                                             │   │
│ │ [Edit] [Delete]                                             │   │
│ └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Add/Edit Sampling Round Modal

| Field | Component | Required | Notes |
|-------|-----------|----------|-------|
| Round # | Auto | - | Auto-increment |
| Supplier | Select (searchable) | ✅ | From Lingxing supplier list |
| Sample Cost | InputNumber | - | Per unit |
| Sample Qty | InputNumber | - | - |
| Lead Time (days) | InputNumber | - | - |
| Expected Date Range | DateRangePicker | - | - |
| Sample Images | Upload (multi) | - | Max 10 images |
| Review Result | Radio | - | Pending / Approved / Rejected |
| Review Notes | TextArea | - | - |
| Rejection Reason | TextArea | Conditional | Required if Rejected |
| Improvement Notes | TextArea | - | What to fix for next round |
| Confirmed | Checkbox | - | "This is the final confirmed sample" (only 1 per project) |

---

## 7. Tab: Quoting

### Layout
Multi-supplier comparison table.

```
┌─ Supplier Quotes ────────────────────────────────────────────────┐
│ [+ Add Supplier Quote]                                            │
│                                                                    │
│ ┌─ ProTable ─────────────────────────────────────────────────┐   │
│ │ Supplier      | Preferred | MOQ  | Lead | Currency | Tax   │   │
│ │ 深圳明达五金  | ⭐        | 500  | 7d   | CNY      | 13%   │   │
│ │ 东莞华诚      |           | 1000 | 10d  | CNY      | 13%   │   │
│ │ Yiwu Trading  |           | 200  | 15d  | USD      | 0%    │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ Click row to expand → Tiered Pricing:                             │
│ ┌─ Expanded Row ─────────────────────────────────────────────┐   │
│ │ Purchase Links: [alibaba.com/...] [1688.com/...]            │   │
│ │ Quote Notes: "Includes packaging, excluding shipping"       │   │
│ │                                                             │   │
│ │ Tiered Pricing:                                             │   │
│ │ ┌─ Tiers Table ────────────────────────────────────────┐   │   │
│ │ │ Min Qty | Max Qty | Unit Price                        │   │   │
│ │ │ 500     | 999     | ¥12.80                            │   │   │
│ │ │ 1000    | 4999    | ¥11.50                            │   │   │
│ │ │ 5000    | -       | ¥10.20                            │   │   │
│ │ └──────────────────────────────────────────────────────┘   │   │
│ │                                                             │   │
│ │ [Edit] [Delete] [Set as Preferred]                          │   │
│ └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Add/Edit Quote Drawer

| Field | Component | Required | Notes |
|-------|-----------|----------|-------|
| Supplier | Select (searchable) | ✅ | From Lingxing suppliers |
| Lingxing Supplier ID | Auto-fill | - | Filled from supplier selection |
| Purchase Links | Input (dynamic add) | - | Multiple URLs |
| Quote Notes | TextArea | - | - |
| Lead Time (days) | InputNumber | ✅ | - |
| Preferred | Switch | - | Only 1 preferred per project |
| Currency | Select | ✅ | CNY / USD |
| Tax Included | Switch | ✅ | - |
| Tax Rate | InputNumber | Conditional | If tax included; default 13% |
| MOQ | InputNumber | ✅ | - |
| Tiered Pricing | Dynamic Table | ✅ | [+ Add Tier] — min_qty, max_qty, unit_price |

---

## 8. Tab: Profit Calc

### Layout
Side-by-side: inputs left, results right.

```
┌─ Profit Calculator ──────────────────────────────────────────────┐
│                                                                    │
│ ┌─ Inputs (left 50%) ────────┬─ Results (right 50%) ──────────┐ │
│ │                              │                                │ │
│ │ Product Name: auto-fill     │ ┌─ Express Scenario ─────────┐ │ │
│ │ Product Image: auto-fill    │ │ Shipping: $2.45             │ │ │
│ │                              │ │ Total Cost: $18.32          │ │ │
│ │ ── Dimensions ──             │ │ Profit: $11.67              │ │ │
│ │ Length: [__] cm              │ │ Margin: 38.9% ✅            │ │ │
│ │ Width:  [__] cm              │ └────────────────────────────┘ │ │
│ │ Height: [__] cm              │                                │ │
│ │ Vol. Weight: auto-calc kg    │ ┌─ Air Scenario ────────────┐ │ │
│ │ Actual Weight: [__] kg       │ │ Shipping: $1.80             │ │ │
│ │                              │ │ Total Cost: $17.67          │ │ │
│ │ ── Costs ──                  │ │ Profit: $12.32              │ │ │
│ │ Product Cost: [__] RMB       │ │ Margin: 41.1% ✅            │ │ │
│ │ Accessories: [__] RMB        │ └────────────────────────────┘ │ │
│ │                              │                                │ │
│ │ ── Pricing ──                │ ┌─ Sea Scenario ────────────┐ │ │
│ │ Selling Price: [__] USD      │ │ Shipping: $0.95             │ │ │
│ │ Exchange Rate: [auto] ¥/＄   │ │ Total Cost: $16.82          │ │ │
│ │                              │ │ Profit: $13.17              │ │ │
│ │ ── Shipping Rates ──         │ │ Margin: 43.9% ⭐ Best      │ │ │
│ │ Express: [__] /kg            │ └────────────────────────────┘ │ │
│ │ Air:     [__] /kg            │                                │ │
│ │ Sea:     [__] /kg            │ ┌─ Cost Breakdown ──────────┐ │ │
│ │                              │ │ (Horizontal stacked bar)   │ │ │
│ │ ── Platform Fees ──          │ │ Cost | Ship | FBA | Ad |   │ │ │
│ │ FBA Fee: [__] USD            │ │ Comm | Storage | Return    │ │ │
│ │ Commission: [15]%  (edit)    │ └────────────────────────────┘ │ │
│ │ Storage: [2]%  (edit)        │                                │ │
│ │ Advertising: [13]%  (edit)   │                                │ │
│ │ Return: [3]%  (edit)         │                                │ │
│ │                              │                                │ │
│ └──────────────────────────────┴────────────────────────────────┘ │
│                                                                    │
│ [Save to Project] [Export as Image]                                │
└────────────────────────────────────────────────────────────────────┘
```

### Auto-fill Behavior
- **Product info**: auto-fill from project data (name, image)
- **Exchange rate**: auto-fill from Lingxing monthly rate (current month); editable
- **Shipping rates**: auto-fill from Settings defaults; editable
- **Platform fee %**: auto-fill from Settings defaults; editable per calc
- **Product cost**: auto-fill from preferred supplier quote (lowest tier)

### Live Calculation
- All results update in **real-time** as inputs change (no submit button)
- Debounce 300ms on input changes

### Results Panel
- 3 scenario cards: Express / Air / Sea
- Each shows: shipping cost, total cost, profit amount, margin %
- **Highlight best scenario** with ⭐ badge
- If margin < target margin → show warning icon + red text
- Cost breakdown chart: stacked horizontal bar showing proportion

### Save to Project
- Stores current calculation snapshot (all inputs + results)
- Linked to project; visible in project history

---

## 9. Tab: Approvals

### Layout
```
┌─ Approval History ───────────────────────────────────────────────┐
│                                                                    │
│ ┌─ Timeline (vertical) ─────────────────────────────────────┐   │
│ │                                                             │   │
│ │ ● Sampling Approval — 2026-03-25                            │   │
│ │   Approver: 李四 (Product Owner)                            │   │
│ │   Result: ✅ Approved                                       │   │
│ │   Opinion: "Sample quality meets standard"                  │   │
│ │                                                             │   │
│ │ ● Project Approval — 2026-04-05                             │   │
│ │   Approvers: 李四 ✅, 王五 ✅, 赵六 ⏳ (pending)            │   │
│ │   Submitted by: 张三 at 2026-04-05 10:00                    │   │
│ │   Profit Calc: Express 38.9% / Air 41.1% / Sea 43.9%       │   │
│ │   [View Full Calc →]                                        │   │
│ │                                                             │   │
│ │ ○ Finalization Approval — not started                       │   │
│ │ ○ Online Approval — not started                             │   │
│ │                                                             │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ [Submit for Approval] (visible if current stage is approval-ready)│
└──────────────────────────────────────────────────────────────────┘
```

### Submit for Approval Modal

| Field | Component | Required | Notes |
|-------|-----------|----------|-------|
| Approval Type | Auto-detect | - | Based on current stage |
| Approvers | Display | - | Pre-defined per approval type |
| Notes | TextArea | - | Submitter's notes |
| Attached Profit Calc | Display | Conditional | Required for Project Approval |

### Approver Action (from notification or approval tab)
When user is an approver:
```
┌─ Approval Action Bar ────────────────────────────────────────────┐
│ You are an approver for this {approval type}.                     │
│                                                                    │
│ [Approve ✅]  [Reject ❌]                                         │
│                                                                    │
│ Opinion / Rejection Reason: [________________]  (required if reject)│
└──────────────────────────────────────────────────────────────────┘
```

- Approve → advance to next stage (if all approvers approved)
- Reject → move to rejected stage + notify submitter

---

## 10. Tab: Lingxing Sync

### Layout
```
┌─ Lingxing Product Sync ─────────────────────────────────────────┐
│                                                                    │
│ ┌─ Sync Status ──────────────────────────────────────────────┐   │
│ │ Status: Not synced / Synced ✅ / Failed ❌                  │   │
│ │ Last attempt: 2026-04-20 14:30 — Failed (SKU conflict)     │   │
│ │ Lingxing Product ID: - (will be filled after sync)          │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌─ Pre-sync Check ──────────────────────────────────────────┐    │
│ │ [Run Pre-check] → checks:                                  │    │
│ │ ✅ SKU not in Lingxing                                      │    │
│ │ ✅ All required fields filled                                │    │
│ │ ✅ Supplier quote linked to Lingxing supplier                │    │
│ │ ❌ Product images missing (at least 1 required)             │    │
│ │                                                             │    │
│ │ Fix issues before syncing.                                  │    │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌─ Field Mapping Preview ────────────────────────────────────┐   │
│ │ Local Field       → Lingxing Field    | Value              │   │
│ │ SKU               → sku               | LX-A001            │   │
│ │ Product Name      → product_name      | iPhone 16 硅胶...  │   │
│ │ Developer         → product_developer | 张三 (uid:5)       │   │
│ │ ...               → ...               | ...                │   │
│ │ (scrollable, ~30 field mappings)                            │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ [Sync to Lingxing] (primary, enabled only if all checks pass)     │
│                                                                    │
│ ┌─ Sync History ─────────────────────────────────────────────┐   │
│ │ Time            | Operator | Result | Details               │   │
│ │ 2026-04-20 14:30| 张三     | ❌     | SKU conflict: LX-A.. │   │
│ │ 2026-04-21 10:00| 张三     | ✅     | Created SKU + SPU    │   │
│ └─────────────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────────────┘
```

### Sync Interaction Flow
1. User clicks [Run Pre-check]
2. System queries Lingxing `productList` for SKU conflict
3. System validates all required fields
4. Show check results (green ✅ / red ❌)
5. If all pass → [Sync to Lingxing] enabled
6. Click Sync → confirm dialog: "This will create SKU {sku} and SPU {spu} in Lingxing. Proceed?"
7. Progress indicator (loading)
8. **Success**: show green result, Lingxing Product ID filled, stage advances to "Synced to Lingxing"
9. **Failure**: show error details, [Retry] button

### SKU Conflict
If pre-check finds existing SKU in Lingxing:
```
❌ SKU conflict: LX-A001 already exists in Lingxing
   Existing product: "iPhone 15 硅胶保护套" (ID: 12345)
   
   Options:
   ○ Change SKU code → [Edit SKU field]
   ○ Link to existing Lingxing product (skip creation)
```

---

## 11. Tab: History

Timeline of all project changes:
```
│ 2026-04-21 10:00 张三 — Synced to Lingxing (SKU: LX-A001)
│ 2026-04-20 15:00 李四 — Approved: Project Approval
│ 2026-04-20 14:00 王五 — Approved: Project Approval
│ 2026-04-15 10:00 张三 — Submitted for Project Approval
│ 2026-04-10 16:00 张三 — Added supplier quote: 深圳明达五金
│ 2026-04-05 11:00 张三 — Saved profit calculation (margin: 41.1%)
│ 2026-03-25 14:00 李四 — Approved: Sampling Approval
│ 2026-03-20 10:00 张三 — Added sampling round 1
│ 2026-03-15 09:00 张三 — Created project
```

---

## State Transitions — Project Lifecycle

```
                    Create project
                         │
                         ▼
                ┌─ Pending Research ──┐
                │        │            │
                │   Start research    │
                │        │            │
                │        ▼            │
                │   Researching       │
                │        │            │
                │  Submit sampling    │
                │   approval          │
                │        │            │
                │        ▼            │
                │  Sampling Approval ─┤
                │   │           │     │
                │ Approve    Reject   │
                │   │           │     │
                │   ▼           ▼     │
                │ Sampling   Sampling │
                │   │        Rejected │
                │   │           │     │
                │  Done     Fix & ────┘
                │   │      resubmit
                │   ▼
                │  Pending Quote
                │        │
                │  Submit project
                │   approval
                │        │
                │        ▼
                │  Pending Project ────┐
                │  Approval            │
                │   │           │      │
                │ All approve  Reject  │
                │   │           │      │
                │   ▼           ▼      │
                │  Project    Project   │
                │  Confirmed  Rejected ─┘
                │        │     (fix & resubmit)
                │  Submit finalization
                │        │
                │        ▼
                │  Pending Finalization
                │        │
                │  Approve finalization
                │        │
                │        ▼
                │  Pending Online
                │        │
                │  Approve online
                │        │
                │        ▼
                │  (Sync to Lingxing)
                │        │
                │   User triggers sync
                │        │
                │        ▼
                │  Synced to Lingxing
                │        │
                │  First PO created
                │        │
                │        ▼
                └─ First Order Placed (end)
```

### Drag Permissions on Kanban
| From → To | Drag Allowed? | Notes |
|-----------|---------------|-------|
| Pending Research → Researching | ✅ Direct | No approval needed |
| Researching → Sampling Approval | ✅ Direct | Submits for approval |
| Sampling Approval → Sampling | ❌ | Requires approver action |
| Sampling Approval → Sampling Rejected | ❌ | Requires approver action |
| Sampling Rejected → Sampling Approval | ✅ Direct | Re-submit |
| Sampling → Pending Quote | ✅ Direct | After confirming sample |
| Pending Quote → Pending Project Approval | ✅ Direct | Requires profit calc |
| Pending Project Approval → Confirmed/Rejected | ❌ | Requires approver action |
| Project Rejected → Pending Project Approval | ✅ Direct | Re-submit |
| Project Confirmed → Pending Finalization | ✅ Direct | - |
| Pending Finalization → Pending Online | ✅ Direct | After finalization approval |
| Pending Online → Synced to Lingxing | ❌ | Requires sync action |
| Synced → First Order | ✅ Direct | Manual mark |
