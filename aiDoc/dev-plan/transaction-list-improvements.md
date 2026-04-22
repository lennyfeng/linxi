# 流水页（TransactionListPage）改进需求

> 创建日期: 2026-04-22
> 状态: **已合并至正式 Spec**
> 优先级: 高
> **正式 Spec**: `.specify/specs/ledger-transaction-page-v2.md` （包含 9 项 FR，覆盖本文档 + 用户第二轮反馈）

---

## 现状分析

### 当前文件
- 主页面: `apps/web/src/pages/ledger/TransactionListPage.tsx` (528行)
- 左侧导航: `apps/web/src/pages/ledger/components/MonthlyNavigator.tsx` (114行)
- 筛选抽屉: `apps/web/src/pages/ledger/components/FilterDrawer.tsx`

### 当前问题（对照参考截图）
1. 左侧面板只有 **按年→月** 的固定分组（Collapse 组件），功能单一
2. 表格 header 跟随内容滚动，每个日期分组重复渲染 `<Table>` 组件
3. 单行流水缺少操作按钮（编辑、复制、删除）

---

## 修改点 1: 左侧面板 — "汇总" 多维度分组选择器

### 目标
将左侧的 `MonthlyNavigator` 替换为"汇总"面板，支持多维度分组浏览，参考截图中的下拉菜单设计。

### UI 设计
- 面板顶部：显示 `汇总:` 标签 + 当前选中维度（如"月"、"一级分类"、"账户"），点击弹出级联下拉菜单
- 下拉菜单分组（二级级联）：

| 一级选项 | 二级选项 | 说明 |
|---------|---------|------|
| 时间 | 年、季、月、周、天 | 按时间粒度汇总 |
| 分类 | 一级分类、二级分类 | 按 category 层级汇总 |
| 账户 | （无二级） | 按 account 汇总 |
| 项目 | （无二级） | 按 project_name 汇总 |
| 其它 | 成员、商家、记账人 | 按人员/商家汇总 |

- 选中某个维度后，左侧面板列表显示对应维度的汇总项
- 每个汇总项显示：
  - **名称**（如"4月"、"电商费用"、"招行账户"等）
  - **结余** = 收入 - 支出
  - **收入金额**（绿色）
  - **支出金额**（红色）
- 选中（高亮）某个汇总项时，右侧流水列表按该维度筛选

### 后端需求
需要新增或扩展 API 以支持各维度汇总查询：
- `GET /ledger/summary?groupBy=month` — 按月汇总（现有 `/ledger/monthly-summary` 已支持）
- `GET /ledger/summary?groupBy=year` — 按年汇总
- `GET /ledger/summary?groupBy=quarter` — 按季度汇总
- `GET /ledger/summary?groupBy=week` — 按周汇总
- `GET /ledger/summary?groupBy=day` — 按天汇总
- `GET /ledger/summary?groupBy=category_l1` — 按一级分类汇总
- `GET /ledger/summary?groupBy=category_l2` — 按二级分类汇总
- `GET /ledger/summary?groupBy=account` — 按账户汇总
- `GET /ledger/summary?groupBy=project` — 按项目汇总
- `GET /ledger/summary?groupBy=member` — 按成员汇总
- `GET /ledger/summary?groupBy=counterparty` — 按商家汇总
- `GET /ledger/summary?groupBy=creator` — 按记账人汇总

返回格式统一：
```json
{
  "data": [
    {
      "key": "2026-04",          // 分组 key（月份、分类名、账户名等）
      "label": "4月",            // 显示名称
      "parentLabel": "2026年",   // 可选，父级名称（如二级分类的父分类）
      "income": 512228.86,
      "expense": 501169.31,
      "balance": 11059.55
    }
  ]
}
```

### 前端改造
- **新增组件** `SummaryNavigator.tsx` 替代 `MonthlyNavigator.tsx`
- 组件 props:
  - `groupBy`: 当前分组维度
  - `onGroupByChange(groupBy)`: 切换维度
  - `activeKey`: 当前选中的汇总项 key
  - `onSelect(key)`: 选中汇总项
- `TransactionListPage` 需改造：
  - 移除 `activeYear` / `activeMonth` state
  - 新增 `groupBy` / `activeGroupKey` state
  - 根据 `groupBy` + `activeGroupKey` 构建流水列表的筛选参数

---

## 修改点 2: 表头固定（Sticky Header）

### 目标
流水列表的表头（类型、对方/摘要、分类、账户、金额、项目、备注、状态、操作）在页面横向位置固定，内容区域垂直滚动时表头不动。

### 现状问题
当前每个日期分组都有自己的 `<Table>` 组件，每个 Table 都有独立的表头。当内容超出屏幕时，表头随内容滚动消失。

### 改造方案
**方案 A — 单 Table + 日期分组行**（推荐）
- 将所有流水放进一个 `<Table>` 中
- 日期分组作为 "分组标题行" 插入（可用 `Table` 的 `groupBy` 或自定义渲染）
- 利用 Ant Design Table 的 `sticky` 属性固定表头：
  ```tsx
  <Table sticky={{ offsetHeader: 0 }} ... />
  ```

**方案 B — 独立固定 Header + 虚拟列表**
- 独立渲染固定 `<thead>` 区域
- 下方滚动区域只渲染行内容
- 复杂度较高，但适合大数据量虚拟滚动

### 建议
采用方案 A。具体改造：
1. 将 `grouped` 数据展平为一维数组，插入日期分组标记行
2. 使用单个 `<Table sticky>` 渲染
3. 日期分组行通过 `onCell` 合并列或自定义 row render 显示日期 + 当日收支

---

## 修改点 3: 单行操作按钮（编辑、复制、删除）

### 目标
每行流水末尾增加操作列，包含：编辑、复制、删除三个操作按钮。

### UI 设计
- 在现有 columns 最后追加一列 `操作`
- 默认隐藏，鼠标 hover 行时显示（或始终显示为图标按钮）
- 按钮样式：
  - **编辑** `<EditOutlined />` — 打开编辑抽屉（已有 `TransactionFormDrawer`）
  - **复制** `<CopyOutlined />` — 复制当前流水数据新建一笔（预填表单）
  - **删除** `<DeleteOutlined />` — 弹出确认对话框后删除

### 前端改造
```tsx
// 新增列定义
{
  title: '操作',
  key: 'actions',
  width: 120,
  fixed: 'right',
  render: (_, record: Transaction) => (
    <Space size={4}>
      <Button type="link" size="small" icon={<EditOutlined />}
        onClick={(e) => { e.stopPropagation(); openEdit(record.id); }} />
      <Button type="link" size="small" icon={<CopyOutlined />}
        onClick={(e) => { e.stopPropagation(); openCopy(record); }} />
      <Popconfirm title="确认删除?" onConfirm={() => handleDelete(record.id)}>
        <Button type="link" size="small" danger icon={<DeleteOutlined />}
          onClick={(e) => e.stopPropagation()} />
      </Popconfirm>
    </Space>
  ),
}
```

### 后端需求
- 删除 API: `DELETE /ledger/transactions/:id` — 需确认是否已存在
- 复制功能为纯前端：读取当前记录数据 → 打开新建表单（预填除 id/transactionNo 以外的字段）

---

## 涉及文件清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `apps/web/src/pages/ledger/components/MonthlyNavigator.tsx` | **替换** | 改为 `SummaryNavigator.tsx` |
| `apps/web/src/pages/ledger/components/SummaryNavigator.tsx` | **新增** | 多维度汇总选择器 |
| `apps/web/src/pages/ledger/TransactionListPage.tsx` | **改造** | 集成新导航、sticky table、操作按钮 |
| `apps/api/src/modules/ledger/index.ts` | **修改** | 新增 `/ledger/summary` 路由 |
| `apps/api/src/modules/ledger/service/ledger-reports.service.ts` | **修改** | 新增多维度汇总查询 |
| `apps/api/src/modules/ledger/repository/ledger.repository.ts` | **修改** | 新增汇总 SQL |

---

## 开发顺序建议

1. **后端**: 实现 `/ledger/summary?groupBy=xxx` 统一汇总 API
2. **前端**: 新建 `SummaryNavigator` 组件（左侧面板）
3. **前端**: 改造 `TransactionListPage` — 集成 SummaryNavigator + 替换筛选逻辑
4. **前端**: 改造表格为单 Table + sticky header + 日期分组行
5. **前端**: 添加操作列（编辑/复制/删除）
6. **联调测试**
