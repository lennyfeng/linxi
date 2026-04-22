import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Button, Card, Drawer, Form, Input, message, Popconfirm, Select, Space, Spin, Table, Tag, TreeSelect, Typography } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';

interface ProjectItem {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  depth: number;
  sortOrder: number;
  status: string;
  stats?: { income: number; expense: number; count: number };
  children?: ProjectItem[];
}

const fmtAmt = (n: number) =>
  Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

function buildTree(items: ProjectItem[]): ProjectItem[] {
  const map = new Map<number, ProjectItem>();
  items.forEach((i) => map.set(i.id, { ...i, children: [] }));
  const roots: ProjectItem[] = [];
  map.forEach((item) => {
    if (item.parentId && map.has(item.parentId)) {
      map.get(item.parentId)!.children!.push(item);
    } else {
      roots.push(item);
    }
  });
  return roots;
}

const ProjectListPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<ProjectItem[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editItem, setEditItem] = useState<ProjectItem | null>(null);
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const fetchData = useCallback(() => {
    setLoading(true);
    apiClient.get('/ledger/projects')
      .then((r) => {
        const list = r.data?.data ?? r.data ?? [];
        setData(Array.isArray(list) ? list : []);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const treeData = useMemo(() => buildTree(data), [data]);
  const totalIncome = data.reduce((s, d) => s + (d.stats?.income ?? 0), 0);
  const totalExpense = data.reduce((s, d) => s + (d.stats?.expense ?? 0), 0);

  const openNew = (parentId: number | null = null) => {
    setEditItem(null);
    form.resetFields();
    form.setFieldsValue({ parentId, status: 'active' });
    setDrawerOpen(true);
  };

  const openEdit = (item: ProjectItem) => {
    setEditItem(item);
    form.setFieldsValue({ name: item.name, description: item.description, parentId: item.parentId, status: item.status });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      if (editItem) {
        await apiClient.put(`/ledger/projects/${editItem.id}`, values);
        message.success('已更新');
      } else {
        await apiClient.post('/ledger/projects', values);
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
      await apiClient.delete(`/ledger/projects/${id}`);
      message.success('已删除');
      fetchData();
    } catch {
      message.error('删除失败');
    }
  };

  // Build TreeSelect options (only depth <= 2 can be parent)
  const parentTreeOptions = useMemo(() => {
    const roots = data.filter((d) => !d.parentId);
    return roots.map((r) => ({
      value: r.id,
      title: r.name,
      children: data.filter((d) => d.parentId === r.id).map((c) => ({
        value: c.id,
        title: c.name,
        disabled: true, // depth 2 items cannot be parent of depth 3+
      })),
    }));
  }, [data]);

  const columns = [
    {
      title: '项目名称',
      dataIndex: 'name',
      render: (v: string, r: ProjectItem) => (
        <span>
          <Typography.Text strong>{v}</Typography.Text>
          {r.status === 'archived' && <Tag color="default" style={{ marginLeft: 8 }}>已归档</Tag>}
        </span>
      ),
    },
    {
      title: '收入',
      key: 'income',
      width: 130,
      align: 'right' as const,
      render: (_: unknown, r: ProjectItem) => (
        <span style={{ color: '#00B894', fontFamily: 'DIN Alternate, monospace' }}>+¥{fmtAmt(r.stats?.income ?? 0)}</span>
      ),
    },
    {
      title: '支出',
      key: 'expense',
      width: 130,
      align: 'right' as const,
      render: (_: unknown, r: ProjectItem) => (
        <span style={{ color: '#FF6B6B', fontFamily: 'DIN Alternate, monospace' }}>-¥{fmtAmt(r.stats?.expense ?? 0)}</span>
      ),
    },
    {
      title: '净额',
      key: 'net',
      width: 130,
      align: 'right' as const,
      render: (_: unknown, r: ProjectItem) => {
        const net = (r.stats?.income ?? 0) - (r.stats?.expense ?? 0);
        return <span style={{ fontWeight: 600, fontFamily: 'DIN Alternate, monospace', color: net >= 0 ? '#00B894' : '#FF6B6B' }}>¥{fmtAmt(net)}</span>;
      },
    },
    { title: '笔数', key: 'count', width: 80, align: 'right' as const, render: (_: unknown, r: ProjectItem) => r.stats?.count ?? 0 },
    {
      title: '操作',
      key: 'actions',
      width: 220,
      render: (_: unknown, r: ProjectItem) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(r)}>编辑</Button>
          {r.depth < 3 && (
            <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => openNew(r.id)}>添加子项</Button>
          )}
          <Button type="link" size="small" icon={<RightOutlined />} onClick={() => navigate(`/ledger/transactions?project=${encodeURIComponent(r.name)}`)}>流水</Button>
          <Popconfirm
            title={r.children?.length ? `该项目下有 ${r.children.length} 个子项目，将一并删除` : '确认删除此项目？'}
            onConfirm={() => handleDelete(r.id)}
            okText="确认"
            cancelText="取消"
          >
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
        title={<Typography.Title level={4} style={{ margin: 0 }}>项目管理</Typography.Title>}
        extra={
          <Space>
            <Typography.Text type="secondary">收入: ¥{fmtAmt(totalIncome)} | 支出: ¥{fmtAmt(totalExpense)}</Typography.Text>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => openNew()}>新建项目</Button>
          </Space>
        }
      >
        <Table
          dataSource={treeData}
          rowKey="id"
          size="middle"
          pagination={false}
          loading={loading}
          columns={columns}
          expandable={{ defaultExpandAllRows: true, childrenColumnName: 'children' }}
        />
      </Card>

      <Drawer
        title={editItem ? '编辑项目' : '新建项目'}
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
          <Form.Item name="name" label="项目名称" rules={[{ required: true, message: '请输入项目名称' }]}>
            <Input placeholder="项目名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={3} placeholder="项目描述（可选）" />
          </Form.Item>
          <Form.Item name="parentId" label="上级项目">
            <TreeSelect
              treeData={parentTreeOptions}
              allowClear
              placeholder="无（顶级项目）"
              treeDefaultExpandAll
            />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={[{ value: 'active', label: '活跃' }, { value: 'archived', label: '已归档' }]} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default ProjectListPage;
