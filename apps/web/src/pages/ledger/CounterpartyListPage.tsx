import React, { useCallback, useEffect, useState } from 'react';
import { Button, Card, Drawer, Form, Input, message, Popconfirm, Space, Spin, Table, Tag, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';

interface CounterpartyItem {
  id: number;
  name: string;
  description: string | null;
  contact: string | null;
  phone: string | null;
  remark: string | null;
  sortOrder: number;
  status: string;
  stats?: { income: number; expense: number; count: number };
}

const fmtAmt = (n: number) =>
  Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const CounterpartyListPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CounterpartyItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState<CounterpartyItem | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    apiClient.get('/ledger/counterparties/managed')
      .then((r) => {
        const list = r.data?.data ?? r.data ?? [];
        setData(Array.isArray(list) ? list : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const totalIncome = data.reduce((s, d) => s + (d.stats?.income ?? 0), 0);
  const totalExpense = data.reduce((s, d) => s + (d.stats?.expense ?? 0), 0);

  const openNew = () => {
    setEditItem(null);
    form.resetFields();
    setDrawerOpen(true);
  };

  const openEdit = (item: CounterpartyItem) => {
    setEditItem(item);
    form.setFieldsValue({ name: item.name, description: item.description, contact: item.contact, phone: item.phone, remark: item.remark });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editItem) {
        await apiClient.put(`/ledger/counterparties/managed/${editItem.id}`, values);
        message.success('已更新');
      } else {
        await apiClient.post('/ledger/counterparties/managed', values);
        message.success('已创建');
      }
      setDrawerOpen(false);
      fetchData();
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/ledger/counterparties/managed/${id}`);
      message.success('已删除');
      fetchData();
    } catch {
      message.error('删除失败');
    }
  };

  const handleDrop = async (targetId: number) => {
    if (!draggingId || draggingId === targetId) return;
    const current = [...data];
    const fromIndex = current.findIndex((item) => item.id === draggingId);
    const toIndex = current.findIndex((item) => item.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const [moved] = current.splice(fromIndex, 1);
    if (!moved) return;
    current.splice(toIndex, 0, moved);
    const reordered = current.map((item, index) => ({ ...item, sortOrder: (index + 1) * 10 }));
    setData(reordered);
    setDraggingId(null);
    try {
      await apiClient.put('/ledger/counterparties/managed/sort', reordered.map((item) => ({ id: item.id, sortOrder: item.sortOrder })));
      message.success('排序已更新');
    } catch {
      message.error('排序保存失败');
      fetchData();
    }
  };

  const columns = [
    {
      title: '商家名称',
      dataIndex: 'name',
      render: (v: string, r: CounterpartyItem) => (
        <span>
          <Typography.Text strong>{v}</Typography.Text>
          {r.status === 'archived' && <Tag color="default" style={{ marginLeft: 8 }}>已归档</Tag>}
        </span>
      ),
    },
    { title: '描述', dataIndex: 'description', ellipsis: true, render: (v: string | null) => v || '-' },
    {
      title: '收入',
      key: 'income',
      width: 130,
      align: 'right' as const,
      render: (_: unknown, r: CounterpartyItem) => (
        <span style={{ color: '#00B894', fontFamily: 'DIN Alternate, monospace' }}>+¥{fmtAmt(r.stats?.income ?? 0)}</span>
      ),
    },
    {
      title: '支出',
      key: 'expense',
      width: 130,
      align: 'right' as const,
      render: (_: unknown, r: CounterpartyItem) => (
        <span style={{ color: '#FF6B6B', fontFamily: 'DIN Alternate, monospace' }}>-¥{fmtAmt(r.stats?.expense ?? 0)}</span>
      ),
    },
    {
      title: '净额',
      key: 'net',
      width: 130,
      align: 'right' as const,
      render: (_: unknown, r: CounterpartyItem) => {
        const net = (r.stats?.income ?? 0) - (r.stats?.expense ?? 0);
        return <span style={{ color: net >= 0 ? '#00B894' : '#FF6B6B', fontWeight: 600, fontFamily: 'DIN Alternate, monospace' }}>¥{fmtAmt(net)}</span>;
      },
    },
    { title: '笔数', key: 'count', width: 80, align: 'right' as const, render: (_: unknown, r: CounterpartyItem) => r.stats?.count ?? 0 },
    { title: '联系人', dataIndex: 'contact', width: 120, render: (v: string | null) => v || '-' },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: unknown, r: CounterpartyItem) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          <Button type="link" size="small" icon={<RightOutlined />} onClick={() => navigate(`/ledger/transactions?counterparty=${encodeURIComponent(r.name)}`)}>流水</Button>
          <Popconfirm title="确认删除此商家？" onConfirm={() => handleDelete(r.id)} okText="确认" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  if (loading && !data.length) {
    return <div style={{ padding: 40, textAlign: 'center' }}><Spin size="large" /></div>;
  }

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<Typography.Title level={4} style={{ margin: 0 }}>商家管理</Typography.Title>}
        extra={
          <Space>
            <Typography.Text type="secondary">收入: ¥{fmtAmt(totalIncome)} | 支出: ¥{fmtAmt(totalExpense)}</Typography.Text>
            <Button type="primary" icon={<PlusOutlined />} onClick={openNew}>新建商家</Button>
          </Space>
        }
      >
        <Table
          dataSource={data}
          rowKey="id"
          size="middle"
          pagination={false}
          loading={loading}
          columns={columns}
          onRow={(record) => ({
            draggable: true,
            onDragStart: () => setDraggingId(record.id),
            onDragOver: (event) => event.preventDefault(),
            onDrop: () => void handleDrop(record.id),
            style: { cursor: 'move' },
          })}
        />
      </Card>

      <Drawer
        title={editItem ? '编辑商家' : '新建商家'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={480}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>保存</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="商家名称" rules={[{ required: true, message: '请输入商家名称' }]}>
            <Input placeholder="商家名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="商家描述（可选）" />
          </Form.Item>
          <Form.Item name="contact" label="联系人">
            <Input placeholder="联系人（可选）" />
          </Form.Item>
          <Form.Item name="phone" label="电话">
            <Input placeholder="电话（可选）" />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} placeholder="备注（可选）" />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default CounterpartyListPage;
