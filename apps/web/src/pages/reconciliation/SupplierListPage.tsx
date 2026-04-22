import React, { useCallback, useEffect, useState } from 'react';
import { Card, Input, Space, Spin, Table, Tag, Typography } from 'antd';
import { SearchOutlined, ReloadOutlined } from '@ant-design/icons';
import apiClient from '@/api/client';

interface Supplier {
  id: number;
  name: string;
  contact: string | null;
  phone: string | null;
  address: string | null;
  remark: string | null;
  status: string | null;
  syncedAt: string | null;
}

const SupplierListPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [keyword, setKeyword] = useState('');

  const fetch = useCallback(() => {
    setLoading(true);
    apiClient.get('/reconciliation/suppliers')
      .then((r) => setSuppliers(r.data?.data ?? r.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const filtered = keyword
    ? suppliers.filter((s) => s.name?.toLowerCase().includes(keyword.toLowerCase()) || s.contact?.toLowerCase().includes(keyword.toLowerCase()))
    : suppliers;

  if (loading && !suppliers.length) {
    return <div style={{ padding: 40, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<Typography.Title level={4} style={{ margin: 0 }}>供应商管理（领星）</Typography.Title>}
        extra={
          <Space>
            <Input
              placeholder="搜索..."
              prefix={<SearchOutlined style={{ color: '#A0AEC0' }} />}
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              style={{ width: 220 }}
              allowClear
            />
            <a onClick={fetch}><ReloadOutlined /></a>
          </Space>
        }
      >
        <Typography.Text type="secondary" style={{ display: 'block', marginBottom: 16 }}>
          已同步 {filtered.length} 个供应商（来自领星ERP）
        </Typography.Text>
        <Table
          dataSource={filtered}
          rowKey="id"
          size="middle"
          pagination={{ pageSize: 50 }}
          loading={loading}
          columns={[
            { title: '编号', dataIndex: 'id', width: 70 },
            { title: '名称', dataIndex: 'name', render: (v: string) => <Typography.Text strong>{v}</Typography.Text> },
            { title: '联系人', dataIndex: 'contact', width: 120, render: (v: string | null) => v || '-' },
            { title: '电话', dataIndex: 'phone', width: 140, render: (v: string | null) => v || '-' },
            { title: '地址', dataIndex: 'address', ellipsis: true, render: (v: string | null) => v || '-' },
            { title: '状态', dataIndex: 'status', width: 90, render: (v: string | null) => <Tag color={v === 'active' ? 'green' : 'default'}>{v || 'unknown'}</Tag> },
            { title: '同步时间', dataIndex: 'syncedAt', width: 160, render: (v: string | null) => v || '-' },
          ]}
        />
      </Card>
    </div>
  );
};

export default SupplierListPage;
