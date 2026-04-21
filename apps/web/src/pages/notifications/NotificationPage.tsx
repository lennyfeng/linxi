import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Typography, Spin, message } from 'antd';
import { CheckOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/api/client';

interface Notification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  content: string | null;
  link: string | null;
  is_read: number;
  created_at: string;
}

const typeColor: Record<string, string> = {
  approval: 'orange', system: 'blue', sync_error: 'red',
};

const NotificationPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Notification[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);

  const load = async (p: number) => {
    setLoading(true);
    try {
      const res = await apiClient.get(`/notifications?page=${p}&pageSize=20`);
      setData(res.data?.data?.items ?? []);
      setTotal(res.data?.data?.total ?? 0);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(page); }, [page]);

  const handleMarkRead = async (id: number) => {
    try { await apiClient.put(`/notifications/${id}/read`); load(page); } catch { message.error('操作失败'); }
  };

  const handleReadAll = async () => {
    try { await apiClient.put('/notifications/read-all'); load(page); message.success('已全部标记为已读'); } catch { message.error('操作失败'); }
  };

  const handleDelete = async (id: number) => {
    try { await apiClient.delete(`/notifications/${id}`); load(page); } catch { message.error('操作失败'); }
  };

  const columns: ColumnsType<Notification> = [
    { title: '类型', dataIndex: 'type', key: 'type', width: 100,
      render: (v: string) => <Tag color={typeColor[v] || 'default'}>{v}</Tag> },
    { title: '标题', dataIndex: 'title', key: 'title',
      render: (v: string, r: Notification) => <span style={{ fontWeight: r.is_read ? 400 : 600 }}>{v}</span> },
    { title: '内容', dataIndex: 'content', key: 'content', ellipsis: true },
    { title: '时间', dataIndex: 'created_at', key: 'created_at', width: 180,
      render: (v: string) => v?.replace('T', ' ').slice(0, 19) ?? '-' },
    { title: '操作', key: 'actions', width: 120, render: (_: unknown, r: Notification) => (
      <Space>
        {!r.is_read && <Button size="small" type="text" icon={<CheckOutlined />} onClick={() => handleMarkRead(r.id)} />}
        <Button size="small" type="text" danger icon={<DeleteOutlined />} onClick={() => handleDelete(r.id)} />
      </Space>
    )},
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>通知列表</Typography.Title>
        <Button onClick={handleReadAll}>全部标记已读</Button>
      </div>
      {loading ? <Spin /> : (
        <Table dataSource={data} columns={columns} rowKey="id" size="small"
          pagination={{ current: page, total, pageSize: 20, onChange: setPage }} />
      )}
    </div>
  );
};

export default NotificationPage;
