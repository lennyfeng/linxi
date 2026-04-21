import React, { useEffect, useMemo, useState } from 'react';
import {
  Card,
  Col,
  Row,
  Statistic,
  Table,
  Tabs,
  Typography,
} from 'antd';
import apiClient from '@/api/client';

interface MonthlySummary {
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
}

interface Account {
  id: number;
  accountName: string;
  currency: string;
  openingBalance: number;
  currentBalance: number;
}

const fmtAmt = (n: number) =>
  Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ReportsPage: React.FC = () => {
  const [summary, setSummary] = useState<MonthlySummary[]>([]);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      apiClient.get('/ledger/monthly-summary'),
      apiClient.get('/ledger/accounts?pageSize=200'),
    ])
      .then(([sumRes, accRes]) => {
        setSummary(sumRes.data?.data ?? []);
        setAccounts(accRes.data?.data?.list ?? []);
      })
      .finally(() => setLoading(false));
  }, []);

  const sortedSummary = useMemo(
    () => [...summary].sort((a, b) => a.year === b.year ? a.month - b.month : a.year - b.year),
    [summary],
  );

  const totals = useMemo(() => {
    let income = 0, expense = 0;
    for (const s of summary) { income += s.income; expense += s.expense; }
    return { income, expense, balance: income - expense };
  }, [summary]);

  const incomeExpenseTab = (
    <div>
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="总收入"
              value={totals.income}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#00B894', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="总支出"
              value={totals.expense}
              precision={2}
              prefix="¥"
              valueStyle={{ color: '#FF6B6B', fontWeight: 600 }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="净结余"
              value={totals.balance}
              precision={2}
              prefix="¥"
              valueStyle={{ color: totals.balance >= 0 ? '#00B894' : '#FF6B6B', fontWeight: 600 }}
            />
          </Card>
        </Col>
      </Row>

      <Table
        dataSource={sortedSummary}
        rowKey={(r) => `${r.year}-${r.month}`}
        size="middle"
        pagination={false}
        loading={loading}
        columns={[
          {
            title: '月份',
            render: (_, r) => `${r.year}-${String(r.month).padStart(2, '0')}`,
            width: 100,
          },
          {
            title: '收入',
            dataIndex: 'income',
            align: 'right',
            render: (v: number) => <span style={{ color: '#00B894', fontWeight: 600 }}>+¥{fmtAmt(v)}</span>,
          },
          {
            title: '支出',
            dataIndex: 'expense',
            align: 'right',
            render: (v: number) => <span style={{ color: '#FF6B6B', fontWeight: 600 }}>-¥{fmtAmt(v)}</span>,
          },
          {
            title: '净额',
            dataIndex: 'balance',
            align: 'right',
            render: (v: number) => (
              <span style={{ color: v >= 0 ? '#00B894' : '#FF6B6B', fontWeight: 600 }}>
                ¥{fmtAmt(v)}
              </span>
            ),
          },
        ]}
      />
    </div>
  );

  const accountBalancesTab = (
    <div>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        {accounts.map((a) => (
          <Col key={a.id} xs={12} sm={8} md={6} style={{ marginBottom: 16 }}>
            <Card size="small">
              <div style={{ fontSize: 12, color: '#6B7B8D' }}>{a.accountName}</div>
              <div
                style={{
                  fontSize: 20,
                  fontWeight: 600,
                  fontFamily: 'DIN Alternate, monospace',
                  color: a.currentBalance >= 0 ? '#00B894' : '#FF6B6B',
                  marginTop: 4,
                }}
              >
                {a.currency === 'USD' ? '$' : '¥'}{fmtAmt(a.currentBalance)}
              </div>
            </Card>
          </Col>
        ))}
      </Row>
      <Table
        dataSource={accounts}
        rowKey="id"
        size="middle"
        pagination={false}
        loading={loading}
        columns={[
          { title: '账户', dataIndex: 'accountName' },
          { title: '币种', dataIndex: 'currency', width: 80 },
          {
            title: '期初余额',
            dataIndex: 'openingBalance',
            align: 'right',
            render: (v: number) => `¥${fmtAmt(v)}`,
          },
          {
            title: '当前余额',
            dataIndex: 'currentBalance',
            align: 'right',
            render: (v: number) => (
              <span style={{ fontWeight: 600, color: v >= 0 ? '#00B894' : '#FF6B6B' }}>
                ¥{fmtAmt(v)}
              </span>
            ),
          },
        ]}
      />
    </div>
  );

  return (
    <div style={{ padding: 24 }}>
      <Card title={<Typography.Title level={4} style={{ margin: 0 }}>财务报表</Typography.Title>}>
        <Tabs
          items={[
            { key: 'income-expense', label: '收支汇总', children: incomeExpenseTab },
            { key: 'account-balances', label: '账户余额', children: accountBalancesTab },
          ]}
        />
      </Card>
    </div>
  );
};

export default ReportsPage;
