import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Input,
  Select,
  Space,
  Spin,
  Table,
  Tag,
  Tooltip,
  Empty,
  Dropdown,
} from 'antd';
import {
  PlusOutlined,
  SearchOutlined,
  FilterOutlined,
  DownloadOutlined,
  ReloadOutlined,
  UnorderedListOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { useNavigate, useSearchParams } from 'react-router-dom';
import apiClient from '@/api/client';
import MonthlyNavigator from './components/MonthlyNavigator';
import TransactionFormDrawer from './components/TransactionFormDrawer';
import TransactionDetailDrawer from './components/TransactionDetailDrawer';

/* ─── Types ─── */
interface Transaction {
  id: number;
  transactionNo: string;
  transactionType: string;
  transactionDate: string;
  accountId: number | null;
  amount: number;
  currency: string;
  exchangeRate: number | null;
  amountCny: number | null;
  paymentAccount: string | null;
  categoryId: number | null;
  counterpartyName: string | null;
  projectName: string | null;
  summary: string | null;
  reimbursementRequired: number;
  reimbursementStatus: string | null;
  invoiceRequired: number;
  status: string;
}

interface Account { id: number; accountName: string; accountType: string; currency: string; }
interface Category { id: number; categoryName: string; categoryType: string; parentId: number | null; }

/* ─── Helpers ─── */
const fmtAmt = (n: number) =>
  Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const typeColorMap: Record<string, { color: string; label: string }> = {
  income: { color: '#00B894', label: '收入' },
  expense: { color: '#FF6B6B', label: '支出' },
  transfer: { color: '#4ECDC4', label: '转账' },
  refund: { color: '#FFA502', label: '退款' },
};

/* ─── Component ─── */
const TransactionListPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const now = dayjs();
  const [activeYear, setActiveYear] = useState(now.year());
  const [activeMonth, setActiveMonth] = useState(now.month() + 1);
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const pageSize = 50;

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);

  const [keyword, setKeyword] = useState('');
  const [filterType, setFilterType] = useState<string | undefined>(searchParams.get('type') || undefined);
  const [filterAccount, setFilterAccount] = useState<number | undefined>(
    searchParams.get('account') ? Number(searchParams.get('account')) : undefined,
  );
  const [showFilters, setShowFilters] = useState(false);

  // Drawer state
  const [formDrawerOpen, setFormDrawerOpen] = useState(false);
  const [formEditId, setFormEditId] = useState<number | null>(null);
  const [detailDrawerOpen, setDetailDrawerOpen] = useState(false);
  const [detailTxId, setDetailTxId] = useState<number | null>(null);

  // Load reference data
  useEffect(() => {
    apiClient.get('/ledger/accounts?pageSize=200').then((r) => {
      setAccounts(r.data?.data?.list ?? []);
    });
    apiClient.get('/ledger/categories?pageSize=200').then((r) => {
      setCategories(r.data?.data?.list ?? []);
    });
  }, []);

  // Build filters
  const filters = useMemo(() => {
    const startDate = `${activeYear}-${String(activeMonth).padStart(2, '0')}-01`;
    const endDate = dayjs(startDate).endOf('month').format('YYYY-MM-DD');
    const params: Record<string, string | number> = { startDate, endDate, page, pageSize };
    if (keyword) params.keyword = keyword;
    if (filterType) params.transactionType = filterType;
    if (filterAccount) params.accountId = filterAccount;
    return params;
  }, [activeYear, activeMonth, page, keyword, filterType, filterAccount]);

  const fetchTransactions = useCallback(() => {
    setLoading(true);
    apiClient
      .get('/ledger/transactions', { params: filters })
      .then((r) => {
        const d = r.data?.data ?? r.data;
        setTransactions(d?.list ?? []);
        setTotal(d?.pagination?.total ?? 0);
      })
      .finally(() => setLoading(false));
  }, [filters]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  // Group transactions by date
  const grouped = useMemo(() => {
    const map = new Map<string, { items: Transaction[]; income: number; expense: number }>();
    for (const tx of transactions) {
      const date = tx.transactionDate;
      if (!map.has(date)) map.set(date, { items: [], income: 0, expense: 0 });
      const g = map.get(date)!;
      g.items.push(tx);
      if (tx.transactionType === 'income') g.income += tx.amount;
      if (tx.transactionType === 'expense') g.expense += tx.amount;
    }
    return Array.from(map.entries()).sort(([a], [b]) => b.localeCompare(a));
  }, [transactions]);

  // Stats
  const stats = useMemo(() => {
    let income = 0, expense = 0;
    for (const tx of transactions) {
      if (tx.transactionType === 'income') income += tx.amount;
      if (tx.transactionType === 'expense') expense += tx.amount;
    }
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const accountMap = useMemo(() => new Map(accounts.map((a) => [a.id, a.accountName])), [accounts]);
  const categoryMap = useMemo(() => new Map(categories.map((c) => [c.id, c.categoryName])), [categories]);

  const handleMonthSelect = (year: number, month: number) => {
    setActiveYear(year);
    setActiveMonth(month);
    setPage(1);
  };

  /* ─── Stats Bar ─── */
  const statsBar = (
    <div
      style={{
        display: 'flex',
        gap: 24,
        padding: '12px 20px',
        background: '#fff',
        borderBottom: '1px solid #F0F2F5',
      }}
    >
      <div>
        <span style={{ color: '#6B7B8D', fontSize: 12 }}>收入</span>
        <div style={{ color: '#00B894', fontWeight: 600, fontSize: 18, fontFamily: 'DIN Alternate, monospace' }}>
          +¥{fmtAmt(stats.income)}
        </div>
      </div>
      <div>
        <span style={{ color: '#6B7B8D', fontSize: 12 }}>支出</span>
        <div style={{ color: '#FF6B6B', fontWeight: 600, fontSize: 18, fontFamily: 'DIN Alternate, monospace' }}>
          -¥{fmtAmt(stats.expense)}
        </div>
      </div>
      <div>
        <span style={{ color: '#6B7B8D', fontSize: 12 }}>结余</span>
        <div
          style={{
            color: stats.balance >= 0 ? '#00B894' : '#FF6B6B',
            fontWeight: 600,
            fontSize: 18,
            fontFamily: 'DIN Alternate, monospace',
          }}
        >
          ¥{fmtAmt(stats.balance)}
        </div>
      </div>
      <div style={{ flex: 1 }} />
      <div style={{ alignSelf: 'center', color: '#A0AEC0', fontSize: 12 }}>
        共 {total} 条流水
      </div>
    </div>
  );

  /* ─── Toolbar ─── */
  const toolbar = (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '10px 20px',
        background: '#fff',
        borderBottom: '1px solid #F0F2F5',
      }}
    >
      <Button type="primary" icon={<PlusOutlined />} onClick={() => { setFormEditId(null); setFormDrawerOpen(true); }}>
        新建
      </Button>
      <Dropdown
        menu={{
          items: [
            { key: 'batch', label: '批量录入', icon: <UnorderedListOutlined /> },
            { key: 'import', label: '导入', icon: <DownloadOutlined /> },
          ],
          onClick: ({ key }) => {
            if (key === 'batch') navigate('/ledger/batch-entry');
            if (key === 'import') navigate('/ledger/import');
          },
        }}
      >
        <Button>更多</Button>
      </Dropdown>
      <div style={{ flex: 1 }} />
      <Input
        placeholder="搜索..."
        prefix={<SearchOutlined style={{ color: '#A0AEC0' }} />}
        value={keyword}
        onChange={(e) => { setKeyword(e.target.value); setPage(1); }}
        style={{ width: 220 }}
        allowClear
      />
      <Tooltip title="筛选">
        <Button
          icon={<FilterOutlined />}
          type={showFilters ? 'primary' : 'default'}
          onClick={() => setShowFilters(!showFilters)}
        />
      </Tooltip>
      <Tooltip title="刷新">
        <Button icon={<ReloadOutlined />} onClick={fetchTransactions} />
      </Tooltip>
    </div>
  );

  /* ─── Filter Bar ─── */
  const filterBar = showFilters ? (
    <div
      style={{
        display: 'flex',
        gap: 12,
        padding: '10px 20px',
        background: '#FAFBFC',
        borderBottom: '1px solid #F0F2F5',
        flexWrap: 'wrap',
      }}
    >
      <Select
        placeholder="类型"
        allowClear
        value={filterType}
        onChange={(v) => { setFilterType(v); setPage(1); }}
        style={{ width: 130 }}
        options={[
          { value: 'income', label: '收入' },
          { value: 'expense', label: '支出' },
          { value: 'transfer', label: '转账' },
          { value: 'refund', label: '退款' },
        ]}
      />
      <Select
        placeholder="账户"
        allowClear
        value={filterAccount}
        onChange={(v) => { setFilterAccount(v); setPage(1); }}
        style={{ width: 180 }}
        showSearch
        optionFilterProp="label"
        options={accounts.map((a) => ({ value: a.id, label: a.accountName }))}
      />
    </div>
  ) : null;

  /* ─── Date-grouped transaction list ─── */
  const columns = [
    {
      title: '类型',
      dataIndex: 'transactionType',
      width: 90,
      render: (t: string) => {
        const m = typeColorMap[t] ?? { color: '#999', label: t };
        return <Tag color={m.color} style={{ borderRadius: 4, fontWeight: 500 }}>{m.label}</Tag>;
      },
    },
    {
      title: '对方 / 摘要',
      dataIndex: 'counterpartyName',
      ellipsis: true,
      render: (_: unknown, row: Transaction) => (
        <div>
          <div style={{ fontWeight: 500 }}>{row.counterpartyName || '-'}</div>
          {row.summary && <div style={{ fontSize: 12, color: '#6B7B8D' }}>{row.summary}</div>}
        </div>
      ),
    },
    {
      title: '分类',
      dataIndex: 'categoryId',
      width: 120,
      render: (id: number | null) => categoryMap.get(id ?? 0) ?? '-',
    },
    {
      title: '账户',
      dataIndex: 'accountId',
      width: 120,
      render: (id: number | null) => accountMap.get(id ?? 0) ?? '-',
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 130,
      align: 'right' as const,
      render: (_: unknown, row: Transaction) => {
        const m = typeColorMap[row.transactionType];
        const prefix = row.transactionType === 'income' ? '+' : row.transactionType === 'expense' ? '-' : '';
        return (
          <span style={{ color: m?.color ?? '#333', fontWeight: 600, fontFamily: 'DIN Alternate, monospace' }}>
            {prefix}¥{fmtAmt(row.amount)}
          </span>
        );
      },
    },
    {
      title: '状态',
      dataIndex: 'status',
      width: 80,
      render: (s: string) => (
        <Tag color={s === 'submitted' ? 'green' : 'default'} style={{ borderRadius: 4 }}>
          {s === 'submitted' ? '已提交' : '草稿'}
        </Tag>
      ),
    },
  ];

  const transactionList = loading ? (
    <div style={{ padding: 40, textAlign: 'center' }}><Spin /></div>
  ) : transactions.length === 0 ? (
    <Empty description="暂无流水记录" style={{ marginTop: 60 }} />
  ) : (
    <div style={{ padding: '0 20px 20px', overflowY: 'auto', flex: 1 }}>
      {grouped.map(([date, group]) => (
        <div key={date} style={{ marginTop: 16 }}>
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '6px 0',
              borderBottom: '1px solid #F0F2F5',
              marginBottom: 4,
            }}
          >
            <span style={{ fontWeight: 600, fontSize: 13, color: '#1A2332' }}>
              {dayjs(date).format('ddd, MMM D')}
            </span>
            <Space size={16}>
              {group.income > 0 && (
                <span style={{ fontSize: 12, color: '#00B894' }}>+¥{fmtAmt(group.income)}</span>
              )}
              {group.expense > 0 && (
                <span style={{ fontSize: 12, color: '#FF6B6B' }}>-¥{fmtAmt(group.expense)}</span>
              )}
            </Space>
          </div>
          <Table
            dataSource={group.items}
            columns={columns}
            rowKey="id"
            size="small"
            pagination={false}
            showHeader={false}
            onRow={(record) => ({
              onClick: () => { setDetailTxId(record.id); setDetailDrawerOpen(true); },
              style: { cursor: 'pointer' },
            })}
          />
        </div>
      ))}
      {total > pageSize && (
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <Space>
            <Button disabled={page <= 1} onClick={() => setPage(page - 1)}>上一页</Button>
            <span style={{ color: '#6B7B8D', fontSize: 12 }}>第 {page} 页 / 共 {Math.ceil(total / pageSize)} 页</span>
            <Button disabled={page >= Math.ceil(total / pageSize)} onClick={() => setPage(page + 1)}>下一页</Button>
          </Space>
        </div>
      )}
    </div>
  );

  /* ─── Layout ─── */
  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 64px)', background: '#F5F7FA' }}>
      {/* Left: Monthly navigator */}
      <div style={{ width: 200, flexShrink: 0 }}>
        <MonthlyNavigator
          activeYear={activeYear}
          activeMonth={activeMonth}
          onMonthSelect={handleMonthSelect}
        />
      </div>

      {/* Right: Transaction panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {statsBar}
        {toolbar}
        {filterBar}
        {transactionList}
      </div>

      <TransactionFormDrawer
        open={formDrawerOpen}
        editId={formEditId}
        onClose={() => setFormDrawerOpen(false)}
        onSaved={fetchTransactions}
        accounts={accounts}
        categories={categories}
      />

      <TransactionDetailDrawer
        open={detailDrawerOpen}
        transactionId={detailTxId}
        onClose={() => setDetailDrawerOpen(false)}
        onEdit={(id) => { setDetailDrawerOpen(false); setFormEditId(id); setFormDrawerOpen(true); }}
        onDeleted={fetchTransactions}
        onNavigate={(dir) => {
          const flatIds = transactions.map((t) => t.id);
          const idx = flatIds.indexOf(detailTxId ?? -1);
          if (dir === 'prev' && idx > 0) setDetailTxId(flatIds[idx - 1] ?? null);
          if (dir === 'next' && idx < flatIds.length - 1) setDetailTxId(flatIds[idx + 1] ?? null);
        }}
        hasPrev={(() => { const idx = transactions.findIndex((t) => t.id === detailTxId); return idx > 0; })()}
        hasNext={(() => { const idx = transactions.findIndex((t) => t.id === detailTxId); return idx >= 0 && idx < transactions.length - 1; })()}
      />
    </div>
  );
};

export default TransactionListPage;
