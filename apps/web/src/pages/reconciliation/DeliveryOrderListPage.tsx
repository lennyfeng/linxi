import React, { useEffect, useState } from 'react';
import { Table, Tag, Input, Button, Space, Typography, Spin } from 'antd';
import { SearchOutlined, SyncOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/api/client';

interface DO { id: number; orderNo: string; supplierName: string; amount: number; invoiceStatus: string | null; sourceUpdatedAt: string | null; }

const statusColor: Record<string, string> = { matched: 'green', partial: 'orange', pending: 'default', not_linked: 'red' };

const DeliveryOrderListPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DO[]>([]);
  const [keyword, setKeyword] = useState('');
  const [syncing, setSyncing] = useState(false);

  const load = async () => { setLoading(true); try { const res = await apiClient.get('/reconciliation/delivery-orders'); setData(res.data?.data ?? []); } catch {} setLoading(false); };
  useEffect(() => { load(); }, []);

  const handleSync = async () => { setSyncing(true); try { await apiClient.post('/reconciliation/sync/delivery-orders', {}); await load(); } catch {} setSyncing(false); };

  const filtered = keyword ? data.filter((r) => r.orderNo?.toLowerCase().includes(keyword.toLowerCase()) || r.supplierName?.toLowerCase().includes(keyword.toLowerCase())) : data;

  const columns: ColumnsType<DO> = [
    { title: '发货单号', dataIndex: 'orderNo', key: 'orderNo', width: 180 },
    { title: '供应商', dataIndex: 'supplierName', key: 'supplierName' },
    { title: '金额', dataIndex: 'amount', key: 'amount', width: 140, align: 'right', render: (v: number) => `¥${Number(v || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}` },
    { title: '发票状态', dataIndex: 'invoiceStatus', key: 'invoiceStatus', width: 140, render: (v: string) => <Tag color={statusColor[v] || 'default'}>{v || 'pending'}</Tag> },
    { title: '最近同步', dataIndex: 'sourceUpdatedAt', key: 'sourceUpdatedAt', width: 180, render: (v: string) => v || '-' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>发货单</Typography.Title>
        <Space>
          <Input placeholder="搜索..." prefix={<SearchOutlined />} value={keyword} onChange={(e) => setKeyword(e.target.value)} allowClear style={{ width: 220 }} />
          <Button icon={<SyncOutlined spin={syncing} />} onClick={handleSync} loading={syncing}>同步</Button>
        </Space>
      </div>
      {loading ? <Spin /> : <Table dataSource={filtered} columns={columns} rowKey="id" size="small" pagination={{ pageSize: 50, showSizeChanger: false }} />}
    </div>
  );
};

export default DeliveryOrderListPage;
