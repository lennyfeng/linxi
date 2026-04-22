import React, { useCallback, useEffect, useState } from 'react';
import { Card, Space, Spin, Table, Typography } from 'antd';
import { RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import dayjs from 'dayjs';
import apiClient from '@/api/client';

interface ProjectItem {
  name: string;
  income: number;
  expense: number;
  net: number;
  count: number;
}

const fmtAmt = (n: number) =>
  Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const ProjectListPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProjectItem[]>([]);

  const year = dayjs().year();

  const fetch = useCallback(() => {
    setLoading(true);
    apiClient.get('/ledger/reports/project-breakdown', { params: { startDate: `${year}-01-01`, endDate: `${year}-12-31` } })
      .then((r) => setData(r.data?.data ?? r.data ?? []))
      .finally(() => setLoading(false));
  }, [year]);

  useEffect(() => { fetch(); }, [fetch]);

  if (loading && !data.length) {
    return <div style={{ padding: 40, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  const totalIncome = data.reduce((s, d) => s + d.income, 0);
  const totalExpense = data.reduce((s, d) => s + d.expense, 0);

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<Typography.Title level={4} style={{ margin: 0 }}>Project Management</Typography.Title>}
        extra={<Typography.Text type="secondary">{year} | Income: ¥{fmtAmt(totalIncome)} | Expense: ¥{fmtAmt(totalExpense)}</Typography.Text>}
      >
        <Table
          dataSource={data}
          rowKey="name"
          size="middle"
          pagination={false}
          loading={loading}
          columns={[
            { title: 'Project', dataIndex: 'name', render: (v: string) => <Typography.Text strong>{v}</Typography.Text> },
            { title: 'Income', dataIndex: 'income', align: 'right' as const, render: (v: number) => <span style={{ color: '#FF8C42', fontFamily: 'DIN Alternate, monospace' }}>+¥{fmtAmt(v)}</span> },
            { title: 'Expense', dataIndex: 'expense', align: 'right' as const, render: (v: number) => <span style={{ color: '#52C41A', fontFamily: 'DIN Alternate, monospace' }}>-¥{fmtAmt(v)}</span> },
            { title: 'Net', dataIndex: 'net', align: 'right' as const, render: (v: number) => <span style={{ fontWeight: 600, fontFamily: 'DIN Alternate, monospace', color: v >= 0 ? '#FF8C42' : '#52C41A' }}>¥{fmtAmt(v)}</span> },
            { title: 'Count', dataIndex: 'count', width: 80, align: 'right' as const },
            {
              title: '',
              key: 'action',
              width: 130,
              render: (_: unknown, r: ProjectItem) => (
                <a onClick={() => navigate(`/ledger/transactions?project=${encodeURIComponent(r.name)}`)}>
                  <Space><RightOutlined />Transactions</Space>
                </a>
              ),
            },
          ]}
        />
      </Card>
    </div>
  );
};

export default ProjectListPage;
