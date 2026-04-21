# UI Spec — Module 1: Users & Permissions

> Per-page field definitions, interaction flows, and state transitions.
> Reference: `speckit-specify.md` Module 1 + Cross-Cutting (Login, Personal Center, Audit Log)

---

## Page Map

```
/login                    → Login Page
/                         → Dashboard (see separate spec)
/users                    → User List
/users/:id                → (no separate page — opens Drawer on list)
/departments              → Department Management
/roles                    → Role List + Permission Editor
/audit-logs               → Global Audit Log Viewer
/personal                 → Personal Center
/403                      → No Permission
/404                      → Not Found
/500                      → Server Error
```

---

## 1. Login Page `/login`

### Layout
Full-screen centered card (no sidebar/header). Company logo + system name on top.

### Fields

| Field | Type | Required | Validation | Notes |
|-------|------|----------|------------|-------|
| Username | Input | ✅ | 3-50 chars | Auto-focus on page load |
| Password | Input.Password | ✅ | 6-50 chars | Eye toggle to show/hide |
| Remember me | Checkbox | - | - | Extends refresh token to 30 days |

### Buttons
- **Login** (primary) — triggers auth; disabled until both fields non-empty
- **Forgot password** (link) — not functional Phase 1, shows "Please contact admin" tooltip

### Interaction Flow
1. User enters username + password → clicks Login (or Enter key)
2. Loading spinner on button
3. **Success**: redirect to `/` (Dashboard) or to original URL if redirected from 401
4. **Failure**: inline error message below form ("Username or password incorrect", "Account disabled, contact admin")
5. **First-login**: if `must_change_password` flag → modal overlay: "Please set a new password" with old/new/confirm fields, cannot dismiss until changed

### States
- Default: empty form
- Loading: button shows Spin
- Error: red Alert below fields
- First-login modal: blocks all other interaction

---

## 2. User List `/users`

### Layout
Standard List Page template:
```
┌─ PageHeader: "User Management" + Breadcrumb ──────────────────┐
│ ┌─ Filter Bar (collapsible) ────────────────────────────────┐  │
│ │ [Search input] [Status ▾] [Department ▾] [Role ▾] [Reset] │  │
│ └───────────────────────────────────────────────────────────┘  │
│ ┌─ Toolbar ─────────────────────────────────────────────────┐  │
│ │ [+ Create User] [Export ↓] [Sync Lingxing Users ↻]       │  │
│ │              Selected: N items [Enable] [Disable]          │  │
│ └───────────────────────────────────────────────────────────┘  │
│ ┌─ ProTable ────────────────────────────────────────────────┐  │
│ │ Columns: see below                                         │  │
│ └───────────────────────────────────────────────────────────┘  │
│ Pagination: 20/page default                                    │
└────────────────────────────────────────────────────────────────┘
```

### Table Columns

| Column | Type | Width | Sortable | Notes |
|--------|------|-------|----------|-------|
| Avatar + Name | Avatar + Text | 200px | ✅ | Click → open detail Drawer |
| Username | Text | 120px | ✅ | Unique identifier |
| Department | Tag | 150px | - | Department name |
| Role(s) | Tag[] | 200px | - | Multiple roles as colored tags |
| Phone | Text | 130px | - | Masked: 138****1234 |
| Email | Text | 180px | - | - |
| Status | Badge | 80px | ✅ | Green "Active" / Gray "Disabled" |
| Lingxing UID | Text | 100px | - | Show if linked; "-" if not |
| Last login | DateTime | 150px | ✅ | Relative time tooltip (e.g. "3 hours ago") |
| Actions | Buttons | 120px | - | [Edit] [Disable/Enable] |

### Filter Fields

| Filter | Component | Options |
|--------|-----------|---------|
| Keyword search | Input.Search | Searches name, username, phone, email |
| Status | Select | All / Active / Disabled |
| Department | TreeSelect | From department tree |
| Role | Select (multi) | From role list |

### Toolbar Buttons (permission-gated)

| Button | Permission | Action |
|--------|-----------|--------|
| + Create User | `users.create` | Opens Create User Drawer |
| Export | `users.export` | Downloads current filter as Excel |
| Sync Lingxing Users | `users.sync` | Triggers manual Lingxing user sync; shows loading toast |
| Enable (batch) | `users.update` | Visible when rows selected; confirm dialog |
| Disable (batch) | `users.update` | Visible when rows selected; confirm dialog ("Are you sure? Disabled users cannot log in.") |

### Row Actions

| Action | Permission | Behavior |
|--------|-----------|----------|
| Edit | `users.update` | Opens Edit User Drawer |
| Disable/Enable | `users.update` | Confirm dialog → toggle status |
| Reset Password | `users.update` | Confirm dialog → reset to default; user must change on next login |

---

## 3. User Create/Edit Drawer

### Layout
Drawer from right (width: 600px). Title: "Create User" or "Edit User — {name}".

### Form Fields

| Field | Component | Required | Validation | Create | Edit |
|-------|-----------|----------|------------|--------|------|
| Username | Input | ✅ | 3-50 chars, alphanumeric + underscore, unique | ✅ | Readonly |
| Display Name | Input | ✅ | 2-30 chars | ✅ | ✅ |
| Password | Input.Password | ✅ (create) | 8-50 chars, must include letter + number | ✅ | Hidden (use Reset Password) |
| Phone | Input | - | 11 digits (CN) or international format | ✅ | ✅ |
| Email | Input | - | Valid email format | ✅ | ✅ |
| Department | TreeSelect | ✅ | From department tree | ✅ | ✅ |
| Role(s) | Select (multi) | ✅ | At least 1 role | ✅ | ✅ |
| Lingxing UID | Select | - | From synced Lingxing users (uid + realname dropdown) | ✅ | ✅ |
| Status | Radio | ✅ | Active / Disabled | Hidden (default Active) | ✅ |

### Footer
- [Cancel] — closes Drawer, discard changes (confirm if dirty)
- [Save] (primary) — validate → POST/PUT → close Drawer → refresh table → success toast

### Interaction
- Create: all fields empty, Username auto-focus
- Edit: prefilled from current data; Username readonly
- On save failure: keep Drawer open, show inline error (e.g. "Username already exists")

---

## 4. User Detail Drawer

### Trigger
Click user name/avatar in table → Drawer from right (width: 700px)

### Layout
```
┌─ Header: Avatar (large) + Name + Status Badge ─────────────────┐
│                                                                  │
│ ┌─ ProDescriptions (2-column) ────────────────────────────────┐ │
│ │ Username: admin     | Department: Operations                 │ │
│ │ Phone: 138****1234  | Email: xxx@company.com                 │ │
│ │ Roles: [Admin] [Finance] | Lingxing: 张三 (uid:5)           │ │
│ │ Created: 2026-01-15 | Last Login: 2026-04-21 16:30           │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─ Tabs ──────────────────────────────────────────────────────┐ │
│ │ [Login History] [Permission Changes] [Status Changes]        │ │
│ │                                                              │ │
│ │ (Mini ProTable per tab, 10 rows/page)                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ Footer: [Edit] [Reset Password] [Disable/Enable]               │
└──────────────────────────────────────────────────────────────────┘
```

### Tab: Login History
| Column | Content |
|--------|---------|
| Time | Login datetime |
| IP | Client IP |
| Result | Success / Failed (with reason) |

### Tab: Permission Changes
| Column | Content |
|--------|---------|
| Time | Change datetime |
| Operator | Who made the change |
| Change | "Role added: Finance" / "Department changed: Ops → Sales" |

### Tab: Status Changes
| Column | Content |
|--------|---------|
| Time | Change datetime |
| Operator | Who made the change |
| Change | "Disabled" / "Enabled" / "Password reset" |

---

## 5. Department Management `/departments`

### Layout
Two-panel:
```
┌─ Left Panel (40%) ──────────┬─ Right Panel (60%) ─────────────────┐
│                              │                                      │
│  Department Tree             │  Selected Department Detail          │
│  (antd Tree, draggable)     │  - Name (editable inline)            │
│                              │  - Parent department                  │
│  + Add Department button     │  - Member count                      │
│  at bottom                   │  - Member list (mini table)          │
│                              │  - [Rename] [Move] [Delete]          │
│                              │                                      │
└──────────────────────────────┴──────────────────────────────────────┘
```

### Tree Interactions
- **Click node** → show detail in right panel
- **Right-click node** → context menu: Rename / Add Child / Move / Delete
- **Drag node** → reorder or reparent (confirm dialog)
- **+ Add Department** → inline input at bottom of tree; Enter to confirm, Esc to cancel

### Right Panel Fields
| Field | Component | Notes |
|-------|-----------|-------|
| Department Name | Inline editable text | Click to edit, Enter to save |
| Parent | Breadcrumb path | Read-only, use tree drag to change |
| Members | Mini ProTable | Name, Role, Status; click name → User Detail Drawer |

### Delete Validation
- If department has active members → block with error: "Cannot delete: {N} active members. Move or disable them first."
- If department has children → block: "Cannot delete: has sub-departments."
- Empty department → confirm dialog → soft delete

---

## 6. Role Management `/roles`

### Layout
```
┌─ PageHeader: "Role Management" ──────────────────────────────────┐
│ ┌─ Toolbar ──────────────────────────────────────────────────┐   │
│ │ [+ Create Role]                                             │   │
│ └─────────────────────────────────────────────────────────────┘   │
│                                                                    │
│ ┌─ Role List (left 30%) ──┬─ Permission Editor (right 70%) ───┐  │
│ │                          │                                    │  │
│ │ ○ Super Admin (system)  │  Module: Users & Permissions        │  │
│ │ ● Finance               │  ┌─ Checkbox Tree ───────────────┐ │  │
│ │ ○ Employee              │  │ ☑ Menu: User Management        │ │  │
│ │ ○ Read-only             │  │   ☑ View user list             │ │  │
│ │                          │  │   ☐ Create user                │ │  │
│ │ [+ Create Role]         │  │   ☐ Edit user                  │ │  │
│ │                          │  │   ☑ Export user list           │ │  │
│ │                          │  │ ☑ Menu: Department Mgmt        │ │  │
│ │                          │  │   ...                          │ │  │
│ │                          │  │                                │ │  │
│ │                          │  │ Module: Ledger                 │ │  │
│ │                          │  │ ☑ Menu: Transactions           │ │  │
│ │                          │  │   ☑ View transactions          │ │  │
│ │                          │  │   ☑ Create transaction         │ │  │
│ │                          │  │   ...                          │ │  │
│ │                          │  └────────────────────────────────┘ │  │
│ │                          │                                    │  │
│ │                          │  Data Scope: ○ Self ○ Dept ● All  │  │
│ │                          │                                    │  │
│ │                          │  [Save Changes] [Delete Role]      │  │
│ └──────────────────────────┴────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

### Role List
- Click role → load permission tree for that role
- System roles (Super Admin) cannot be edited or deleted
- Active role highlighted with blue background

### Permission Tree Structure
```
Module: Users & Permissions
├── Menu: User Management
│   ├── ☐ View user list
│   ├── ☐ Create user
│   ├── ☐ Edit user
│   ├── ☐ Disable/Enable user
│   ├── ☐ Reset password
│   ├── ☐ Export user list
│   └── ☐ Sync Lingxing users
├── Menu: Department Management
│   ├── ☐ View departments
│   ├── ☐ Create/Edit department
│   └── ☐ Delete department
├── Menu: Role Management
│   ├── ☐ View roles
│   ├── ☐ Create/Edit role
│   └── ☐ Delete role
└── Menu: Audit Logs
    └── ☐ View audit logs

Module: Ledger
├── Menu: Transactions
│   ├── ☐ View transactions
│   ├── ☐ Create transaction
│   ├── ☐ Edit transaction
│   ├── ☐ Delete draft
│   ├── ☐ Submit draft
│   └── ☐ Export transactions
├── Menu: Import
│   ├── ☐ Upload Airwallex PDF
│   └── ☐ Sync Lemon Cloud
├── Menu: Accounts
│   ├── ☐ View accounts
│   └── ☐ Manage accounts
├── Menu: Categories
│   ├── ☐ View categories
│   └── ☐ Manage categories
└── Menu: Reports
    └── ☐ View reports

Module: Reconciliation
├── Menu: Overview
│   └── ☐ View overview
├── Menu: Purchase Orders / Payment Requests / Delivery Orders / Invoices
│   ├── ☐ View list
│   ├── ☐ Create/Edit relations
│   └── ☐ Export list
├── Menu: Sync
│   └── ☐ Trigger manual sync
└── Menu: Reports
    └── ☐ View reports

Module: Product Development
├── Menu: Projects
│   ├── ☐ View project list
│   ├── ☐ Create project
│   ├── ☐ Edit project
│   ├── ☐ Delete project
│   └── ☐ Export projects
├── Menu: Kanban
│   └── ☐ View/Drag kanban
├── Menu: Approvals
│   └── ☐ Approve/Reject
├── Menu: Lingxing Sync
│   └── ☐ Trigger sync to Lingxing
└── Menu: Profit Calculator
    └── ☐ Use calculator

Module: Settings (Admin Only)
├── ☐ Manage credentials
├── ☐ Manage sync schedules
├── ☐ Manage profit defaults
├── ☐ Manage accounts
└── ☐ Manage categories
```

### Data Scope (per role)
- **Self only**: user sees only records they created / own
- **Department**: user sees records from their department
- **All**: user sees all records

### Create Role
- Click "+ Create Role" → inline new item in role list with name input
- Enter name → create with empty permissions → then edit permissions

### Delete Role
- Confirm dialog: "Delete role {name}? {N} users currently assigned."
- If users assigned: "Reassign users to another role first."
- Only if 0 users → allow delete

---

## 7. Global Audit Log `/audit-logs`

### Layout
Standard List Page. Admin only.

### Table Columns
| Column | Type | Width | Notes |
|--------|------|-------|-------|
| Time | DateTime | 160px | Sortable, default desc |
| User | Avatar + Name | 150px | Click → User Detail Drawer |
| IP | Text | 120px | - |
| Module | Tag | 100px | Users / Ledger / Reconciliation / Product Dev / Settings |
| Entity | Text | 120px | e.g. "User", "Transaction", "Project" |
| Entity ID | Text | 80px | Clickable → navigate to entity |
| Action | Tag | 100px | Create (green) / Update (blue) / Delete (red) / Login (gray) |
| Summary | Text | 300px | Human-readable: "Changed status from Active to Disabled" |

### Expandable Row
Click row → expand to show JSON diff:
```
Before: { "status": "active", "role": ["Employee"] }
After:  { "status": "disabled", "role": ["Employee"] }
```

### Filters
| Filter | Component |
|--------|-----------|
| Time range | DateRangePicker |
| User | Select (searchable) |
| Module | Select |
| Action | Select |
| Keyword | Input.Search (searches summary) |

---

## 8. Personal Center `/personal`

### Layout
```
┌─ PageHeader: "Personal Center" ──────────────────────────────────┐
│                                                                    │
│ ┌─ Card: Profile ──────────────────────────────────────────────┐  │
│ │ [Avatar upload]  Display Name: ____                           │  │
│ │                  Phone: ____                                  │  │
│ │                  Email: ____                                  │  │
│ │                  Department: Operations (readonly)             │  │
│ │                  Role(s): [Finance] [Admin] (readonly)        │  │
│ │                  [Save Profile]                               │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ┌─ Card: Change Password ──────────────────────────────────────┐  │
│ │ Current Password: ____                                        │  │
│ │ New Password: ____                                            │  │
│ │ Confirm Password: ____                                        │  │
│ │ [Change Password]                                             │  │
│ └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│ ┌─ Card: My Notifications ─────────────────────────────────────┐  │
│ │ (Mini table: time, type, message, read/unread, link)          │  │
│ │ [Mark All Read]                                               │  │
│ └──────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

### Profile Fields
| Field | Editable | Validation |
|-------|----------|------------|
| Avatar | ✅ | Upload image, max 2MB, jpg/png |
| Display Name | ✅ | 2-30 chars |
| Phone | ✅ | 11 digits (CN) or international |
| Email | ✅ | Valid email format |
| Department | ❌ | Readonly |
| Roles | ❌ | Readonly |

### Change Password
| Field | Validation |
|-------|------------|
| Current Password | Must match current |
| New Password | 8-50 chars, letter + number |
| Confirm Password | Must match new password |

On success: toast "Password changed successfully" + auto-logout after 3 seconds.

---

## 9. Error Pages

### 401 — Unauthorized
- Auto-redirect to `/login` after 2 seconds
- Message: "Session expired, redirecting to login..."

### 403 — No Permission
- Illustration (lock icon)
- Title: "Access Denied"
- Description: "You don't have permission to access this page."
- Button: [Back to Dashboard]

### 404 — Not Found
- Illustration (empty box)
- Title: "Page Not Found"
- Description: "The page you are looking for does not exist."
- Button: [Back to Dashboard]

### 500 — Server Error
- Illustration (warning icon)
- Title: "Server Error"
- Description: "Something went wrong. Please try again later."
- Button: [Refresh] [Back to Dashboard]
- Display request ID for support reference

---

## State Transitions

### User Status
```
                    Admin creates
                        │
                        ▼
    ┌──────────────  Active  ◄──────────────┐
    │                   │                    │
    │ Admin disables    │                    │ Admin enables
    │                   ▼                    │
    └──────────────► Disabled ───────────────┘
```
- Disabled users: cannot login, not shown in assignee dropdowns, data preserved
- No physical delete

### Login Flow
```
Enter credentials
       │
       ├── Invalid → Show error, stay on login
       │
       ├── Account disabled → Show "Account disabled" error
       │
       ├── Valid + must_change_password → Show change password modal
       │      │
       │      └── Changed → Redirect to Dashboard
       │
       └── Valid → Redirect to Dashboard (or original URL)
```
