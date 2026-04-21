import React, { useEffect, useState } from 'react';
import { Table, Tag, Tabs, Button, Space, Typography, Spin, message } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/api/client';

interface Approval {
  id: number;
  user_id: number;
  title: string;
  content: string | null;
  link: string | null;
  is_read: number;
  created_at: string;
}

const ApprovalCenterPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Approval[]>([]);
  const [tab, setTab] = useState<string>('pending');

  const load = async (status: string) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/approvals?status=${status}`);
      setData(res.data?.data?.items ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(tab); }, [tab]);

  const handleApprove = async (id: number) => {
    try { await apiClient.post(`/approvals/${id}/approve`); message.success('已通过'); load(tab); } catch { message.error('操作失败'); }
  };

  const handleReject = async (id: number) => {
    try { await apiClient.post(`/approvals/${id}/reject`, { reason: '' }); message.success('已拒绝'); load(tab); } catch { message.error('操作失败'); }
  };

  const columns: ColumnsType<Approval> = [
    { title: '标题', dataIndex: 'title', key: 'title' },
    { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
    { title: '状态', key: 'status', width: 100, render: (_: unknown, r: Approval) => (
      <Tag color={r.is_read ? 'default' : 'orange'}>{r.is_read ? '已处理' : '待处理'}</Tag>
    )},
    { title: '创建时间', dataIndex: 'created_at', key: 'created_at', width: 180,
      render: (v: string) => v?.replace('T', ' ').slice(0, 19) ?? '-' },
    { title: '操作', key: 'actions', width: 160, render: (_: unknown, r: Approval) => r.is_read ? '-' : (
      <Space>
        <Button size="small" type="primary" icon={<CheckOutlined />} onClick={() => handleApprove(r.id)}>通过</Button>
        <Button size="small" danger icon={<CloseOutlined />} onClick={() => handleReject(r.id)}>拒绝</Button>
      </Space>
    )},
  ];

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>审批中心</Typography.Title>
      <Tabs activeKey={tab} onChange={setTab} items={[
        { key: 'pending', label: '待处理' },
        { key: 'processed', label: '已处理' },
        { key: 'all', label: '全部' },
      ]} />
      {loading ? <Spin /> : (
        <Table dataSource={data} columns={columns} rowKey="id" size="small" pagination={{ pageSize: 20 }} />
      )}
    </div>
  );
};

export default ApprovalCenterPage;
