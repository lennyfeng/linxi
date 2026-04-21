# Development Clarification Questions

Before producing a proper development plan, the following questions MUST be answered.

---

## 1. External API Access (BLOCKING — cannot proceed without)

### 1.1 Lingxing (领星) API

Used in: Reconciliation (采购单/请款单/发货单同步) + Product Dev (同步产品到领星)

Questions:
- [ ] Lingxing API base URL?
- [ ] Lingxing API authentication method? (API Key / OAuth / Token?)
- [ ] Lingxing API credentials (key/secret)?
- [ ] Lingxing API documentation link?
- [ ] Which specific endpoints for: purchase orders, payment requests, delivery orders, suppliers?
- [ ] Which specific endpoints for: create product (SPU/SKU), update product, supplier quotes?
- [ ] Rate limits or request constraints?
- [ ] Is there a sandbox/test environment?

### 1.2 Lemon Cloud (柠檬云) API

Used in: Reconciliation (发票同步)

Questions:
- [ ] Lemon Cloud REST API base URL?
- [ ] Authentication method and credentials?
- [ ] API documentation link?
- [ ] Which endpoint for fetching invoices?
- [ ] Invoice data fields available from API?
- [ ] Is there a sandbox/test environment?

### 1.3 Feishu (飞书) API

Used in: Auth (login/user sync/org sync) + Ledger (reimbursement approval) + Notifications

Questions:
- [ ] Feishu App ID and App Secret?
- [ ] Feishu app type: self-built app or third-party?
- [ ] Which Feishu capabilities are already authorized? (login/contacts/approval/messaging)
- [ ] Feishu approval template ID for reimbursement workflow?
- [ ] Is there a test Feishu organization?
- [ ] Do you have admin access to Feishu developer console?

### 1.4 Bank Statement Import

Used in: Ledger (银行流水导入)

Questions:
- [ ] Bank name(s) used?
- [ ] Bank statement file format? (CSV / Excel / OFX / PDF?)
- [ ] Can you provide a sample bank statement file (desensitized)?
- [ ] Column mapping: which columns map to amount, date, counterparty, reference?

### 1.5 Airwallex (空中云汇) Import

Used in: Ledger (空中云汇流水导入)

Questions:
- [ ] Airwallex statement export format? (CSV / Excel / API?)
- [ ] Can you provide a sample statement file?
- [ ] Is there an Airwallex API for direct sync, or always file upload?

---

## 2. Business Logic Clarification

### 2.1 Profit Calculation (利润试算)

- [ ] Can you share the existing profit calculation Excel/spreadsheet template?
- [ ] Amazon fee parameters: FBA fee schedule, referral fee %, storage fee formula?
- [ ] Shipping cost calculation formula for express/air/sea?
- [ ] Where does exchange rate data come from? (fixed/manual input/API?)

### 2.2 Reimbursement → Feishu Approval

- [ ] What data fields go into the Feishu approval form?
- [ ] Is the approval result callback automatic (Feishu webhook) or manual check?
- [ ] Can one approval contain multiple expense transactions?

### 2.3 SuiShouJi (随手记) Migration

- [ ] Data export format from SuiShouJi? (CSV / Excel / API export?)
- [ ] Can you provide a sample export file?
- [ ] Approximate data volume? (transaction count, time range)

---

## 3. Technical Decisions

### 3.1 Frontend Framework

Current: Vanilla HTML/JS prototype (5 files, ~15% coverage)

Options:
- **A) React + Ant Design** — mature ecosystem, good for admin panels
- **B) Vue 3 + Element Plus** — lighter, Chinese community support
- **C) Next.js + shadcn/ui** — modern React, SSR optional

- [ ] Which framework do you prefer?
- [ ] Any existing frontend conventions or preferences?

### 3.2 Deployment Target

- [ ] Test server only (192.168.1.251) or also production?
- [ ] Domain name for production?
- [ ] HTTPS certificate?

### 3.3 File Storage

- [ ] Attachments/images stored where? (local disk / S3 / OSS?)
- [ ] Max file size?

---

## 4. Priority Order

Based on requirements, suggested development order:

| Phase | Module | Key Deliverable |
|-------|--------|-----------------|
| Phase 1 | Auth + Users | Feishu login, user/org sync, RBAC |
| Phase 2 | Ledger Core | Full CRUD, accounts, categories, reports |
| Phase 3 | Ledger Import | Bank/Airwallex import, confirm, match |
| Phase 4 | Reconciliation | Lingxing/Lemon Cloud sync, relations |
| Phase 5 | Product Dev | Full workflow, profit calc, Lingxing sync |
| Phase 6 | Cross-module | Dashboard, notifications, reimbursement |

- [ ] Do you agree with this order?
- [ ] Any module should be prioritized higher?

---

## Summary

**Total external integrations needed: 5**
1. Lingxing API (read + write)
2. Lemon Cloud API (read)
3. Feishu API (login + contacts + approval + messaging)
4. Bank statement parser (file format)
5. Airwallex statement parser (file format or API)

**Without answers to Section 1, I cannot implement the real business logic.**
The current codebase has basic CRUD shells but is missing ALL external integrations.
