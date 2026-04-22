import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Progress,
  Row,
  Space,
  Spin,
  Statistic,
  Table,
  Tabs,
  Typography,
} from 'antd';
import { LeftOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import apiClient from '@/api/client';

const { Text } = Typography;

const fmtAmt = (n: number) =>
  Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

type BreakdownItem = { id?: number; name: string; amount?: number; income: number; expense: number; net?: number; count: number; percentage?: number; parentId?: number | null; currentBalance?: number; accountType?: string };

const ReportsPage: React.FC = () => {
  const navigate = useNavigate();
  const [year, setYear] = useState(dayjs().year());
  const [loading, setLoading] = useState(false);

  // Data
  const [monthlyTrend, setMonthlyTrend] = useState<{ month: number; income: number; expense: number }[]>([]);
  const [categoryData, setCategoryData] = useState<{ total: number; items: BreakdownItem[] }>({ total: 0, items: [] });
  const [categoryType, setCategoryType] = useState<'expense' | 'income'>('expense');
  const [accountData, setAccountData] = useState<BreakdownItem[]>([]);
  const [projectData, setProjectData] = useState<BreakdownItem[]>([]);
  const [counterpartyData, setCounterpartyData] = useState<BreakdownItem[]>([]);
  const [memberData, setMemberData] = useState<BreakdownItem[]>([]);

  const yearRange = { start: `${year}-01-01`, end: `${year}-12-31` };

  const fetchAll = useCallback(() => {
    setLoading(true);
    Promise.all([
      apiClient.get('/ledger/reports/monthly-trend', { params: { year } }),
      apiClient.get('/ledger/reports/category-breakdown', { params: { startDate: yearRange.start, endDate: yearRange.end, type: categoryType } }),
      apiClient.get('/ledger/reports/account-breakdown', { params: { startDate: yearRange.start, endDate: yearRange.end } }),
      apiClient.get('/ledger/reports/project-breakdown', { params: { startDate: yearRange.start, endDate: yearRange.end } }),
      apiClient.get('/ledger/reports/counterparty-breakdown', { params: { startDate: yearRange.start, endDate: yearRange.end } }),
      apiClient.get('/ledger/reports/member-breakdown', { params: { startDate: yearRange.start, endDate: yearRange.end } }),
    ]).then(([trendR, catR, accR, projR, cpR, memR]) => {
      setMonthlyTrend(trendR.data?.data ?? trendR.data ?? []);
      setCategoryData(catR.data?.data ?? catR.data ?? { total: 0, items: [] });
      setAccountData(accR.data?.data ?? accR.data ?? []);
      setProjectData(projR.data?.data ?? projR.data ?? []);
      setCounterpartyData(cpR.data?.data ?? cpR.data ?? []);
      setMemberData(memR.data?.data ?? memR.data ?? []);
    }).finally(() => setLoading(false));
  }, [year, categoryType]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  // Refetch category on type change
  const fetchCategory = useCallback((type: 'expense' | 'income') => {
    apiClient.get('/ledger/reports/category-breakdown', { params: { startDate: yearRange.start, endDate: yearRange.end, type } })
      .then((r) => setCategoryData(r.data?.data ?? r.data ?? { total: 0, items: [] }));
  }, [year]);

  const yearSelector = (
    <Space>
      <Button icon={<LeftOutlined />} size="small" onClick={() => setYear(year - 1)} />
      <Text strong style={{ fontSize: 16 }}>{year}</Text>
      <Button icon={<RightOutlined />} size="small" onClick={() => setYear(year + 1)} disabled={year >= dayjs().year()} />
    </Space>
  );

  // ── Tab: 月报 ──
  const monthlyTab = (
    <div>
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card><Statistic title="总收入" value={monthlyTrend.reduce((s, m) => s + m.income, 0)} precision={2} prefix="¥" valueStyle={{ color: '#FF8C42' }} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="总支出" value={monthlyTrend.reduce((s, m) => s + m.expense, 0)} precision={2} prefix="¥" valueStyle={{ color: '#52C41A' }} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="净额" value={monthlyTrend.reduce((s, m) => s + m.income - m.expense, 0)} precision={2} prefix="¥" valueStyle={{ color: '#1890ff' }} /></Card>
        </Col>
      </Row>
      <Table
        dataSource={monthlyTrend}
        rowKey="month"
        size="middle"
        pagination={false}
        loading={loading}
        columns={[
          { title: '月份', dataIndex: 'month', width: 100, render: (m: number) => `${year}-${String(m).padStart(2, '0')}` },
          { title: '收入', dataIndex: 'income', align: 'right' as const, render: (v: number) => <span style={{ color: '#FF8C42', fontWeight: 600 }}>+¥{fmtAmt(v)}</span> },
          { title: '支出', dataIndex: 'expense', align: 'right' as const, render: (v: number) => <span style={{ color: '#52C41A', fontWeight: 600 }}>-¥{fmtAmt(v)}</span> },
          { title: '净额', key: 'net', align: 'right' as const, render: (_: unknown, r: any) => { const n = r.income - r.expense; return <span style={{ color: n >= 0 ? '#FF8C42' : '#52C41A', fontWeight: 600 }}>¥{fmtAmt(n)}</span>; } },
        ]}
      />
    </div>
  );

  // ── Tab: 分类 ──
  const categoryTab = (
    <div>
      <Space style={{ marginBottom: 16 }}>
        <Button type={categoryType === 'expense' ? 'primary' : 'default'} onClick={() => { setCategoryType('expense'); fetchCategory('expense'); }}>支出</Button>
        <Button type={categoryType === 'income' ? 'primary' : 'default'} onClick={() => { setCategoryType('income'); fetchCategory('income'); }}>收入</Button>
      </Space>
      <div style={{ marginBottom: 16 }}>
        <Text type="secondary">合计: ¥{fmtAmt(categoryData.total)} | {categoryData.items.reduce((s, i) => s + (i.count || 0), 0)} 笔</Text>
      </div>
      {categoryData.items.map((item, idx) => (
        <div key={item.id || item.name} style={{ marginBottom: 12 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <Space>
              <span style={{ width: 20, textAlign: 'center', fontWeight: 600, color: idx < 3 ? '#FF8C42' : '#999', display: 'inline-block' }}>{idx + 1}</span>
              <Text>{item.name}</Text>
            </Space>
            <Space>
              <Text type="secondary" style={{ fontSize: 12 }}>{item.percentage ?? 0}%</Text>
              <Text strong style={{ fontFamily: 'DIN Alternate, monospace' }}>¥{fmtAmt(item.amount ?? 0)}</Text>
            </Space>
          </div>
          <Progress percent={item.percentage ?? 0} showInfo={false} strokeColor={idx === 0 ? '#FF8C42' : idx === 1 ? '#FF6B35' : idx === 2 ? '#FFA502' : '#D9D9D9'} size="small" />
        </div>
      ))}
    </div>
  );

  // ── Tab: 账户 ──
  const accountTab = (
    <Table
      dataSource={accountData}
      rowKey="id"
      size="middle"
      pagination={false}
      loading={loading}
      columns={[
        { title: '账户', dataIndex: 'name' },
        { title: '类型', dataIndex: 'accountType', width: 100 },
        { title: '余额', dataIndex: 'currentBalance', align: 'right' as const, render: (v: number) => <span style={{ fontWeight: 600, fontFamily: 'DIN Alternate, monospace' }}>¥{fmtAmt(v ?? 0)}</span> },
        { title: '收入', dataIndex: 'income', align: 'right' as const, render: (v: number) => <span style={{ color: '#FF8C42' }}>+¥{fmtAmt(v)}</span> },
        { title: '支出', dataIndex: 'expense', align: 'right' as const, render: (v: number) => <span style={{ color: '#52C41A' }}>-¥{fmtAmt(v)}</span> },
        { title: '笔数', dataIndex: 'count', width: 80, align: 'right' as const },
        { title: '', key: 'action', width: 100, render: (_: unknown, r: BreakdownItem) => <a onClick={() => navigate(`/ledger/transactions?account=${r.id}`)}>查看流水</a> },
      ]}
    />
  );

  // ── Tab: 项目 ──
  const projectTab = (
    <Table
      dataSource={projectData}
      rowKey="name"
      size="middle"
      pagination={false}
      loading={loading}
      columns={[
        { title: '项目', dataIndex: 'name' },
        { title: '收入', dataIndex: 'income', align: 'right' as const, render: (v: number) => <span style={{ color: '#FF8C42' }}>+¥{fmtAmt(v)}</span> },
        { title: '支出', dataIndex: 'expense', align: 'right' as const, render: (v: number) => <span style={{ color: '#52C41A' }}>-¥{fmtAmt(v)}</span> },
        { title: '净额', dataIndex: 'net', align: 'right' as const, render: (v: number) => <span style={{ fontWeight: 600 }}>¥{fmtAmt(v ?? 0)}</span> },
        { title: '笔数', dataIndex: 'count', width: 80, align: 'right' as const },
        { title: '', key: 'action', width: 100, render: (_: unknown, r: BreakdownItem) => <a onClick={() => navigate(`/ledger/transactions?project=${encodeURIComponent(r.name)}`)}>查看流水</a> },
      ]}
    />
  );

  // ── Tab: 商家 ──
  const counterpartyTab = (
    <Table
      dataSource={counterpartyData}
      rowKey="name"
      size="middle"
      pagination={false}
      loading={loading}
      columns={[
        { title: '商家', dataIndex: 'name' },
        { title: '收入', dataIndex: 'income', align: 'right' as const, render: (v: number) => <span style={{ color: '#FF8C42' }}>+¥{fmtAmt(v)}</span> },
        { title: '支出', dataIndex: 'expense', align: 'right' as const, render: (v: number) => <span style={{ color: '#52C41A' }}>-¥{fmtAmt(v)}</span> },
        { title: '净额', dataIndex: 'net', align: 'right' as const, render: (v: number) => <span style={{ fontWeight: 600 }}>¥{fmtAmt(v ?? 0)}</span> },
        { title: '笔数', dataIndex: 'count', width: 80, align: 'right' as const },
        { title: '', key: 'action', width: 100, render: (_: unknown, r: BreakdownItem) => <a onClick={() => navigate(`/ledger/transactions?counterparty=${encodeURIComponent(r.name)}`)}>查看流水</a> },
      ]}
    />
  );

  // ── Tab: 成员 ──
  const memberTab = (
    <Table
      dataSource={memberData}
      rowKey={(r) => r.name || 'unknown'}
      size="middle"
      pagination={false}
      loading={loading}
      columns={[
        { title: '成员', dataIndex: 'name', render: (_: unknown, r: BreakdownItem) => (r as any).userName || r.name || '未知' },
        { title: '收入', dataIndex: 'income', align: 'right' as const, render: (v: number) => <span style={{ color: '#FF8C42' }}>+¥{fmtAmt(v)}</span> },
        { title: '支出', dataIndex: 'expense', align: 'right' as const, render: (v: number) => <span style={{ color: '#52C41A' }}>-¥{fmtAmt(v)}</span> },
        { title: '笔数', dataIndex: 'count', width: 80, align: 'right' as const },
      ]}
    />
  );

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<Space><Typography.Title level={4} style={{ margin: 0 }}>报表</Typography.Title>{yearSelector}</Space>}
      >
        {loading && !monthlyTrend.length ? (
          <div style={{ textAlign: 'center', padding: 60 }}><Spin size="large" /></div>
        ) : (
          <Tabs
            items={[
              { key: 'monthly', label: '月报', children: monthlyTab },
              { key: 'category', label: '分类', children: categoryTab },
              { key: 'account', label: '账户', children: accountTab },
              { key: 'project', label: '项目', children: projectTab },
              { key: 'counterparty', label: '商家', children: counterpartyTab },
              { key: 'member', label: '成员', children: memberTab },
            ]}
          />
        )}
      </Card>
    </div>
  );
};

export default ReportsPage;
