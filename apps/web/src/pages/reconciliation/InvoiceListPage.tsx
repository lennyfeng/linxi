import React, { useEffect, useState } from 'react';
import { Table, Tag, Input, Button, Space, Typography, Spin } from 'antd';
import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/api/client';

interface Invoice {
  id: number;
  invoiceNo: string;
  invoiceType: string | null;
  supplierName: string;
  amount: number;
  invoiceDate: string | null;
  matchStatus: string | null;
}

const statusColor: Record<string, string> = {
  matched: 'green', partial: 'orange', pending: 'default', not_matched: 'red', verified: 'blue',
};

const InvoiceListPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Invoice[]>([]);
  const [keyword, setKeyword] = useState('');
  const [syncing, setSyncing] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/reconciliation/invoices');
      setData(res.data?.data ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleSync = async () => {
    setSyncing(true);
    try {
      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - 3, 1).toISOString().split('T')[0]!;
      const endDate = now.toISOString().split('T')[0]!;
      await apiClient.post('/reconciliation/sync/invoices', { startDate, endDate });
      await load();
    } catch { /* ignore */ }
    setSyncing(false);
  };

  const filtered = keyword
    ? data.filter((r) => r.invoiceNo?.toLowerCase().includes(keyword.toLowerCase()) || r.supplierName?.toLowerCase().includes(keyword.toLowerCase()))
    : data;

  const columns: ColumnsType<Invoice> = [
    { title: '发票号', dataIndex: 'invoiceNo', key: 'invoiceNo', width: 180 },
    { title: '供应商', dataIndex: 'supplierName', key: 'supplierName' },
    { title: '金额', dataIndex: 'amount', key: 'amount', width: 140, align: 'right',
      render: (v: number) => `¥${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
    { title: '日期', dataIndex: 'invoiceDate', key: 'invoiceDate', width: 120, render: (v: string) => v || '-' },
    { title: '状态', dataIndex: 'matchStatus', key: 'matchStatus', width: 130,
      render: (v: string) => <Tag color={statusColor[v] || 'default'}>{v || 'pending'}</Tag> },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>发票</Typography.Title>
        <Space>
          <Input placeholder="搜索..." prefix={<SearchOutlined />} value={keyword} onChange={(e) => setKeyword(e.target.value)} allowClear style={{ width: 220 }} />
          <Button icon={<SyncOutlined spin={syncing} />} onClick={handleSync} loading={syncing}>同步</Button>
        </Space>
      </div>
      {loading ? <Spin /> : (
        <Table dataSource={filtered} columns={columns} rowKey="id" size="small" pagination={{ pageSize: 50, showSizeChanger: false }} />
      )}
    </div>
  );
};

export default InvoiceListPage;
