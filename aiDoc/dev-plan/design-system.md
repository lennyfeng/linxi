# Design System — Internal Platform

> Style: 清新爽快 (Clean & Fresh)
> Reference: Feidee Cloud (随手记), modern SaaS dashboards
> Framework: Ant Design 5.x + ProComponents

---

## 1. Color Palette

### Primary
| Token | Value | Usage |
|-------|-------|-------|
| `colorPrimary` | `#00B894` | Buttons, active states, links, sidebar active |
| `colorPrimaryHover` | `#00D9A5` | Button hover |
| `colorPrimaryActive` | `#009B7D` | Button pressed |
| `colorPrimaryBg` | `#E8FBF5` | Light primary background (tags, badges) |

### Semantic
| Token | Value | Usage |
|-------|-------|-------|
| `colorSuccess` | `#52C41A` | Success states, "submitted" badge |
| `colorWarning` | `#FAAD14` | Warnings, "partial" status |
| `colorError` | `#FF4D4F` | Errors, "failed" status, expense amounts |
| `colorInfo` | `#1890FF` | Info, transfer type, links |

### Financial (key differentiator)
| Token | Value | Usage |
|-------|-------|-------|
| `incomeColor` | `#00B894` | Income amounts, income tags |
| `expenseColor` | `#FF6B6B` | Expense amounts, expense tags |
| `transferColor` | `#4ECDC4` | Transfer amounts, transfer tags |
| `refundColor` | `#FFA502` | Refund amounts, refund tags |
| `balancePositive` | `#00B894` | Positive balance |
| `balanceNegative` | `#FF6B6B` | Negative balance |

### Neutral
| Token | Value | Usage |
|-------|-------|-------|
| `colorBgLayout` | `#F5F7FA` | Page background |
| `colorBgContainer` | `#FFFFFF` | Card/table background |
| `colorBgElevated` | `#FFFFFF` | Drawer/modal background |
| `colorBorder` | `#E8ECF0` | Subtle borders |
| `colorBorderSecondary` | `#F0F2F5` | Dividers |
| `colorText` | `#1A2332` | Primary text |
| `colorTextSecondary` | `#6B7B8D` | Secondary text, labels |
| `colorTextTertiary` | `#A0AEC0` | Placeholder, disabled text |
| `colorTextQuaternary` | `#CBD5E0` | Weakest text |

### Sidebar
| Token | Value | Usage |
|-------|-------|-------|
| `siderBg` | `#FFFFFF` | Sidebar background (light theme) |
| `siderBorderRight` | `#F0F2F5` | Sidebar right border |
| `menuItemActiveBg` | `#E8FBF5` | Active menu item background |
| `menuItemActiveColor` | `#00B894` | Active menu item text + left border |

---

## 2. Typography

| Token | Value | Usage |
|-------|-------|-------|
| `fontFamily` | `-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif` | Global |
| `fontSize` | `14px` | Body text |
| `fontSizeSM` | `12px` | Table cells, secondary info |
| `fontSizeLG` | `16px` | Section titles |
| `fontSizeXL` | `20px` | Page titles |
| `fontSizeHeading2` | `24px` | Dashboard numbers |
| `fontSizeHeading1` | `30px` | Hero numbers (financial totals) |
| `fontWeightStrong` | `600` | Bold text |
| Amount font | `'DIN Alternate', 'Tabular Nums', monospace` | Financial amounts (tabular figures) |

### Amount Display Rules
- Income: `+¥12,500.00` in `#00B894`, font-weight 600
- Expense: `-¥8,200.00` in `#FF6B6B`, font-weight 600
- Transfer: `¥50,000.00` in `#4ECDC4`, font-weight 500
- Always right-aligned, thousand separator, 2 decimal places
- Currency symbol prefix: `¥` `$` `€` `£`

---

## 3. Spacing & Layout

| Token | Value | Usage |
|-------|-------|-------|
| `borderRadius` | `8px` | Cards, buttons, inputs |
| `borderRadiusLG` | `12px` | Large cards, modals |
| `borderRadiusSM` | `6px` | Tags, small elements |
| `paddingPage` | `24px` | Page padding |
| `paddingCard` | `20px` | Card internal padding |
| `marginSection` | `16px` | Between sections |
| `controlHeight` | `36px` | Input/button height |
| `controlHeightSM` | `28px` | Small inputs |
| `controlHeightLG` | `40px` | Large buttons |

### Grid
- Content max-width: none (fluid)
- Sidebar collapsed width: `64px`
- Sidebar expanded width: `240px`
- Stats cards: `Grid cols={4}` on ≥1440px, `cols={2}` on 1280-1439px

---

## 4. Shadows & Elevation

| Level | Value | Usage |
|-------|-------|-------|
| Level 0 | none | Flat elements inside cards |
| Level 1 | `0 1px 3px rgba(0,0,0,0.04)` | Cards, table header |
| Level 2 | `0 4px 12px rgba(0,0,0,0.08)` | Dropdown, popover |
| Level 3 | `0 8px 24px rgba(0,0,0,0.12)` | Drawer, modal |

> Key principle: **minimal shadows**. Use subtle borders (`#E8ECF0`) + white backgrounds to create depth. Shadows only on floating elements.

---

## 5. Component Overrides (Ant Design Theme Config)

```typescript
const themeConfig: ThemeConfig = {
  token: {
    colorPrimary: '#00B894',
    colorSuccess: '#52C41A',
    colorWarning: '#FAAD14',
    colorError: '#FF4D4F',
    colorInfo: '#1890FF',
    colorBgLayout: '#F5F7FA',
    colorBgContainer: '#FFFFFF',
    colorBorder: '#E8ECF0',
    colorText: '#1A2332',
    colorTextSecondary: '#6B7B8D',
    borderRadius: 8,
    fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif",
    fontSize: 14,
    controlHeight: 36,
  },
  components: {
    Layout: {
      siderBg: '#FFFFFF',
      headerBg: '#FFFFFF',
      bodyBg: '#F5F7FA',
      headerHeight: 56,
      headerPadding: '0 24px',
    },
    Menu: {
      itemBg: 'transparent',
      itemSelectedBg: '#E8FBF5',
      itemSelectedColor: '#00B894',
      itemHoverBg: '#F5F7FA',
      itemActiveBg: '#E8FBF5',
      iconSize: 18,
      itemHeight: 44,
      itemMarginBlock: 2,
      itemMarginInline: 8,
      itemBorderRadius: 8,
    },
    Button: {
      borderRadius: 8,
      controlHeight: 36,
      primaryShadow: 'none',
    },
    Input: {
      borderRadius: 8,
      controlHeight: 36,
    },
    Select: {
      borderRadius: 8,
      controlHeight: 36,
    },
    Table: {
      headerBg: '#FAFBFC',
      headerColor: '#6B7B8D',
      headerSplitColor: 'transparent',
      rowHoverBg: '#F5F7FA',
      borderColor: '#F0F2F5',
      cellPaddingBlock: 12,
      cellPaddingInline: 16,
      headerBorderRadius: 0,
    },
    Card: {
      borderRadiusLG: 12,
      paddingLG: 20,
      boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
    },
    Drawer: {
      borderRadius: 0,
    },
    Tag: {
      borderRadiusSM: 6,
    },
    Badge: {
      dotSize: 8,
    },
    Tabs: {
      inkBarColor: '#00B894',
      itemSelectedColor: '#00B894',
      itemHoverColor: '#00D9A5',
    },
  },
};
```

---

## 6. Page Layout Templates

### Standard List Page
```
┌─ Header (56px, white, bottom border) ────────────────────────────┐
│ [≡] 霖淅   Home > Ledger > Transactions   [🔍 Search] 🔔(3) 👤 │
├─ Sidebar (240px, white) ─┬─ Content (fluid, #F5F7FA bg) ────────┤
│                           │ ┌─ Page Title + Actions ──────────┐  │
│  Dashboard                │ │ Transactions      [+ New] [▾]   │  │
│                           │ └──────────────────────────────────┘  │
│  👥 Users                 │ ┌─ Stats Cards (white, rounded) ──┐  │
│     User Management       │ │ ¥128K    ¥95K    ¥33K    3      │  │
│     Departments           │ └──────────────────────────────────┘  │
│     Roles                 │ ┌─ Filter Bar (white card) ───────┐  │
│                           │ │ [Date] [Type] [Account] [Reset] │  │
│  💰 Ledger                │ └──────────────────────────────────┘  │
│     Transactions  ←active │ ┌─ Table (white card, no border) ─┐  │
│     Accounts              │ │ Date | Type | Summary | Amount  │  │
│     Categories            │ │ ...                              │  │
│     Import                │ │ ...                              │  │
│     Reports               │ └──────────────────────────────────┘  │
│                           │                                       │
│  🔗 Reconciliation        │ Pagination                            │
│  🚀 Product Dev           │                                       │
│  ⚙️ Settings              │                                       │
└───────────────────────────┴───────────────────────────────────────┘
```

- **Active menu**: left green border (3px) + green text + light green bg
- **Content area**: 24px padding, cards with 12px border-radius
- **Cards**: white bg, subtle shadow, 20px padding
- **Between cards**: 16px gap

### Drawer Form
```
┌─ Drawer Header (white, bottom border) ────────────────┐
│ New Transaction                                    [✕] │
├─ Type Tabs ───────────────────────────────────────────┤
│ [Income] [Expense●] [Transfer] [Refund]               │
├─ Form Body (scroll) ─────────────────────────────────┤
│                                                        │
│  Date         [2026-04-21        📅]                   │
│                                                        │
│  Account      [招商银行           ▾]                   │
│                                                        │
│  Amount       [¥ 12,500.00         ]                   │
│                                                        │
│  Category     [运营费用 > 广告费   ▾]                  │
│                                                        │
│  Counterparty [Amazon Ads          ]                   │
│                                                        │
│  Summary      [Q2 广告充值         ]                   │
│                                                        │
│  Attachments  [📎 Drop files here     ]                │
│                                                        │
├─ Footer (white, top border) ─────────────────────────┤
│ ☐ Continuous entry    [Save as Draft ▾] [Save]        │
└────────────────────────────────────────────────────────┘
```

- Form fields: vertical layout, label above input
- Labels: `#6B7B8D`, 12px
- Inputs: 36px height, 8px radius, `#E8ECF0` border
- Field spacing: 20px between fields
- Primary button: `#00B894` filled
- Secondary button: white with border

---

## 7. Icon System

Use **Lucide React** icons (clean line style, matches 清新 aesthetic).

| Context | Icon | Notes |
|---------|------|-------|
| Dashboard | `LayoutDashboard` | - |
| Users | `Users` | - |
| Ledger | `Wallet` | - |
| Reconciliation | `Link` | - |
| Product Dev | `Rocket` | - |
| Settings | `Settings` | - |
| Income | `TrendingUp` | Green |
| Expense | `TrendingDown` | Red |
| Transfer | `ArrowLeftRight` | Teal |
| Refund | `RotateCcw` | Orange |
| Add | `Plus` | - |
| Search | `Search` | - |
| Notification | `Bell` | - |
| Export | `Download` | - |
| Sync | `RefreshCw` | - |
| Attachment | `Paperclip` | - |
| Calendar | `Calendar` | - |
| Filter | `SlidersHorizontal` | - |

---

## 8. Animation & Transitions

| Element | Transition | Duration |
|---------|-----------|----------|
| Page route change | Fade in | 200ms |
| Drawer open/close | Slide from right | 300ms (Ant Design default) |
| Modal open/close | Scale + fade | 200ms |
| Menu expand/collapse | Height transition | 200ms |
| Sidebar collapse | Width transition | 200ms |
| Table row hover | Background color | 150ms |
| Button hover | Background color | 150ms |
| Stats number change | Count-up animation | 800ms |
| New row highlight | Yellow flash → fade | 2000ms |
| Toast notification | Slide down + fade | 300ms |
| Status badge change | Scale pulse | 300ms |

---

## 9. Key Visual Patterns

### Stats Cards (Dashboard & List Headers)
```
┌──────────────────────────────────────────────────────────────┐
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  ┌────┐ │
│  │ ↑ Income     │  │ ↓ Expense   │  │ ≈ Balance    │  │ 📝 │ │
│  │ ¥128,350    │  │ ¥95,200     │  │ ¥33,150     │  │ 3  │ │
│  │ +12% vs last│  │ -5% vs last │  │              │  │draft│ │
│  │ month  ▲    │  │ month  ▼    │  │              │  │    │ │
│  └─────────────┘  └─────────────┘  └─────────────┘  └────┘ │
└──────────────────────────────────────────────────────────────┘
```
- White card, 12px radius, subtle shadow
- Icon top-left (colored circle bg: green/red/blue/gray)
- Main number: 24px, bold
- Trend: 12px, green ▲ / red ▼

### Transaction Type Tags
```
  ┌───────────┐  ┌───────────┐  ┌───────────┐  ┌───────────┐
  │ ● Income  │  │ ● Expense │  │ ● Transfer│  │ ● Refund  │
  │  #00B894  │  │  #FF6B6B  │  │  #4ECDC4  │  │  #FFA502  │
  └───────────┘  └───────────┘  └───────────┘  └───────────┘
```
- Soft colored background (10% opacity) + colored dot + text
- 6px border-radius, 4px 8px padding

### Status Badges
```
  [● Draft]     → gray dot + gray text + #F5F7FA bg
  [● Submitted] → green dot + green text + #E8FBF5 bg
  [● Running]   → blue dot (animated pulse) + blue text
  [● Failed]    → red dot + red text + #FFF1F0 bg
  [● Linked]    → green dot + green text
  [● Partial]   → orange dot + orange text
```

### Empty States
- Centered illustration (simple line art, teal accent)
- Title: 16px, `#1A2332`
- Description: 14px, `#6B7B8D`
- Action button: primary outlined

### Kanban Cards
```
┌──────────────────────────────┐
│ ┌──┐                     🟢 │
│ │📷│ iPhone 16 保护套        │
│ └──┘ SKU: LX-A001           │
│                              │
│ 👤 张三    👤 李四            │
│ 📅 3 days  💰 $29.99        │
│                              │
│ ● Amazon US          (2)💬  │
└──────────────────────────────┘
```
- White card, 8px radius, 1px `#E8ECF0` border
- Hover: slight lift (`translateY(-2px)`) + shadow level 2
- Drag: shadow level 3 + slight scale (1.02)
- Status dot: top-right corner
