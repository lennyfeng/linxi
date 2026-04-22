# Reconciliation & Ledger Gap Analysis Report

> Date: 2026-04-22
> Scope: User-reported issues vs current implementation

---

## User-Reported Issues Summary

| # | Issue | Status |
|---|-------|--------|
| 1 | Supplier data fetched from Lingxing not displayed | **Confirmed: Critical** |
| 2 | Cannot group/categorize/annotate records | **Confirmed: Missing feature** |
| 3 | Project field missing | **Partial: DB has field, frontend missing** |
| 4 | Remark field missing | **Partial: DB+form has it, but form only** |
| 5 | Cannot add images when creating records | **Confirmed: Missing feature** |

---

## Issue 1: Supplier/Lingxing Data Not Displayed

### Root Cause
The system has **two sets of tables**:
- `lx_*` tables (Lingxing-synced data): `lx_purchase_orders`(119), `lx_payment_requests`(279), `lx_delivery_orders`(800), `lx_suppliers`(45)
- App business tables: `purchase_orders`(0), `payment_requests`(0), `delivery_orders`(0), `invoice_records`(0)

**The API queries the empty `purchase_orders` table**, not the `lx_purchase_orders` table. Same problem for all entity types.

### Affected Code
- `reconciliation.repository.ts` → `listPurchaseOrders()` queries `purchase_orders` (empty table)
- `lx_purchase_orders` stores `supplier_id` FK to `lx_suppliers`, but the app `purchase_orders` table has flat `supplier_name` column
- All 4 list pages (PO, PR, DO, Invoice) are querying empty tables

### Fix Required
Option A: **Modify repository to query `lx_*` tables directly**, joining with `lx_suppliers` for supplier names  
Option B: **Create a sync pipeline** from `lx_*` → app tables (adds complexity, delays fix)

**Recommendation: Option A** — query `lx_*` tables directly, they already have the data.

### Database Mapping

| App Query Column | lx_purchase_orders Column | Notes |
|---|---|---|
| `order_no` | `po_number` | |
| `supplier_name` | `lx_suppliers.name` via `supplier_id` FK | JOIN required |
| `amount` | `total_amount` | |
| `invoice_status` | Not in lx table | Need to compute from recon_relations |
| `source_updated_at` | `synced_at` | |
| `status` | `status` | Integer code in lx, needs mapping |

---

## Issue 2: Cannot Group/Categorize/Annotate Records

### Current State
- PO/PR/DO/Invoice list pages are **read-only** views with basic columns
- No user-editable fields like tags, groups, notes, or custom annotations
- The UI spec requires:
  - **Status** management (Not linked / Partial / Full / Do-not-remind)
  - **[Do-not-remind]** action button per row
  - **Detail Drawer** with linked records section
  - **Linking Modal** for matching invoices to POs

### What's Missing
- No detail drawer for any entity
- No linking modal / matching workflow
- No "Do-not-remind" functionality
- No user annotations or grouping
- Workspace page exists but is a placeholder

### Fix Required
This is a significant feature gap requiring multiple new components:
1. Entity Detail Drawer (shared pattern)
2. Linking Modal with split amount
3. Status management (computed from relations)
4. User annotation fields (optional, could add `user_note` column to lx tables or relation table)

---

## Issue 3: Project Field Missing in Frontend

### Current State
- **DB**: `transactions.project_name` column **EXISTS** (varchar 200)
- **API**: Not exposed in create/update handlers (need to verify)
- **Frontend form** (`TransactionFormDrawer.tsx`): **NO `project_name` field** in the form
- **Frontend list** (`TransactionListPage.tsx`): Not shown in columns

### Fix Required
1. Add `project_name` field to `TransactionFormDrawer.tsx`
2. Include `project_name` in API create/update payload handling
3. Show in transaction detail drawer and list page

---

## Issue 4: Remark Field Partially Implemented

### Current State
- **DB**: `transactions.remark` column **EXISTS** (text)
- **Frontend form**: `remark` field **EXISTS** in `TransactionFormDrawer.tsx` (line 277-279) as TextArea
- **API save**: `remark` IS included in payload (line 119)
- **Transaction list**: remark is NOT shown in list view
- **Transaction detail drawer**: Need to verify

### Status
The remark field exists in the form. If user reports it missing, it may be:
- Not visible enough (only at bottom of form)
- Not shown in list/detail views
- The API might not be saving/returning it correctly

### Fix Required
1. Verify API returns `remark` in GET response
2. Show remark in transaction detail drawer
3. Consider showing remark preview in list (tooltip or expandable row)

---

## Issue 5: Cannot Add Images/Attachments

### Current State
- **DB**: `transaction_attachments` table **EXISTS** with columns: `id, transaction_id, file_key, file_url, file_name, file_size, mime_type, created_at`
- **API**: `/ledger/transactions/:id/attachments` endpoint exists (GET only from functional test)
- **Frontend form**: **NO file upload component** in `TransactionFormDrawer.tsx`
- **UI Spec requirement**: "Attachments: Upload (drag-drop), max 5 files, 20MB each, image/pdf"

### What's Missing
1. File upload API endpoint (POST /ledger/transactions/:id/attachments)
2. File storage backend (local disk or S3/OSS)
3. Upload component in TransactionFormDrawer
4. Attachment preview in TransactionDetailDrawer

### Fix Required
1. Add file upload endpoint to API
2. Configure file storage (local `/uploads` directory as starting point)
3. Add `Upload` component from Ant Design to form
4. Add attachment preview in detail drawer

---

## Priority Ranking

| Priority | Issue | Effort | Impact |
|----------|-------|--------|--------|
| **P0** | #1 Lingxing data not displayed | Medium (2-3h) | Blocking — core feature unusable |
| **P1** | #3 Project field in frontend | Small (30min) | Form field gap |
| **P1** | #5 Image/attachment upload | Medium (2-3h) | Feature gap, spec requires it |
| **P2** | #4 Remark visibility | Small (30min) | UX improvement |
| **P2** | #2 Grouping/categorization | Large (1-2d) | Feature gap, needs design decisions |

---

## Recommended Fix Order

1. **Fix P0**: Rewrite reconciliation repository to query `lx_*` tables, join suppliers
2. **Fix P1-Project**: Add `project_name` to TransactionFormDrawer
3. **Fix P1-Attachments**: Implement file upload API + frontend component
4. **Fix P2-Remark**: Improve remark visibility in list/detail
5. **Fix P2-Grouping**: Design and implement annotation/grouping (needs requirements discussion)
