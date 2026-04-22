import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Input,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';

interface Category {
  id: number;
  categoryName: string;
  categoryType: 'expense' | 'income';
  parentId: number | null;
  sortNo: number;
  status: string;
}

interface CategoryAmount {
  id: number;
  name: string;
  amount: number;
  count: number;
  percentage: number;
}

interface CategoryRow extends Category {
  key: number;
  amount: number;
  count: number;
  percentage: number;
  children?: CategoryRow[];
}

const fmtAmt = (n: number) =>
  Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const panelMeta = {
  expense: { title: '支出分类', color: '#FF6B6B' },
  income: { title: '收入分类', color: '#00B894' },
} as const;

const CategoryPageV2: React.FC = () => {
  const navigate = useNavigate();
  const [form] = Form.useForm();
  const [categories, setCategories] = useState<Category[]>([]);
  const [expenseAmounts, setExpenseAmounts] = useState<CategoryAmount[]>([]);
  const [incomeAmounts, setIncomeAmounts] = useState<CategoryAmount[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Category | null>(null);
  const [currentType, setCurrentType] = useState<'expense' | 'income'>('expense');
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const currentYear = new Date().getFullYear();
      const [categoryRes, expenseRes, incomeRes] = await Promise.all([
        apiClient.get('/ledger/categories?pageSize=100'),
        apiClient.get('/ledger/reports/category-breakdown', { params: { startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, type: 'expense' } }),
        apiClient.get('/ledger/reports/category-breakdown', { params: { startDate: `${currentYear}-01-01`, endDate: `${currentYear}-12-31`, type: 'income' } }),
      ]);
      setCategories(categoryRes.data?.data?.list ?? []);
      setExpenseAmounts((expenseRes.data?.data ?? expenseRes.data)?.items ?? []);
      setIncomeAmounts((incomeRes.data?.data ?? incomeRes.data)?.items ?? []);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const aggregatedStats = useMemo(() => {
    const buildMap = (type: 'expense' | 'income', rawList: CategoryAmount[]) => {
      const typedCategories = categories.filter((item) => item.categoryType === type);
      const byParent = new Map<number | null, Category[]>();
      typedCategories.forEach((item) => {
        const key = item.parentId ?? null;
        if (!byParent.has(key)) byParent.set(key, []);
        byParent.get(key)!.push(item);
      });
      const rawMap = new Map<number, CategoryAmount>(rawList.map((item) => [item.id, item]));
      const result = new Map<number, CategoryAmount>();
      const walk = (item: Category) => {
        const raw = rawMap.get(item.id);
        let amount = raw?.amount ?? 0;
        let count = raw?.count ?? 0;
        for (const child of byParent.get(item.id) || []) {
          const childStats = walk(child);
          amount += childStats.amount;
          count += childStats.count;
        }
        const stats = { id: item.id, name: item.categoryName, amount, count, percentage: 0 };
        result.set(item.id, stats);
        return stats;
      };
      const roots = (byParent.get(null) || []).sort((a, b) => a.sortNo - b.sortNo);
      roots.forEach(walk);
      const total = roots.reduce((sum, item) => sum + (result.get(item.id)?.amount ?? 0), 0);
      result.forEach((value) => {
        value.percentage = total ? (value.amount / total) * 100 : 0;
      });
      return result;
    };

    return {
      expense: buildMap('expense', expenseAmounts),
      income: buildMap('income', incomeAmounts),
    };
  }, [categories, expenseAmounts, incomeAmounts]);

  const buildRows = useCallback((type: 'expense' | 'income') => {
    const typedCategories = categories.filter((item) => item.categoryType === type).sort((a, b) => a.sortNo - b.sortNo || a.id - b.id);
    const byParent = new Map<number | null, Category[]>();
    typedCategories.forEach((item) => {
      const key = item.parentId ?? null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(item);
    });
    const statsMap = aggregatedStats[type];
    const buildTree = (parentId: number | null): CategoryRow[] => {
      return (byParent.get(parentId) || []).map((item) => {
        const children = buildTree(item.id);
        const stats = statsMap.get(item.id);
        return {
          ...item,
          key: item.id,
          amount: stats?.amount ?? 0,
          count: stats?.count ?? 0,
          percentage: stats?.percentage ?? 0,
          children: children.length ? children : undefined,
        };
      });
    };
    return buildTree(null);
  }, [aggregatedStats, categories]);

  const rootOptions = useMemo(() => {
    return {
      expense: categories
        .filter((item) => item.categoryType === 'expense' && item.parentId == null && item.id !== editingItem?.id)
        .map((item) => ({ value: item.id, label: item.categoryName })),
      income: categories
        .filter((item) => item.categoryType === 'income' && item.parentId == null && item.id !== editingItem?.id)
        .map((item) => ({ value: item.id, label: item.categoryName })),
    };
  }, [categories, editingItem?.id]);

  const openCreateRoot = (type: 'expense' | 'income') => {
    setEditingItem(null);
    setCurrentType(type);
    form.resetFields();
    form.setFieldsValue({ categoryType: type, parentId: null, status: 'active' });
    setDrawerOpen(true);
  };

  const openCreateChild = (type: 'expense' | 'income', parent: CategoryRow) => {
    setEditingItem(null);
    setCurrentType(type);
    form.resetFields();
    form.setFieldsValue({ categoryType: type, parentId: parent.id, status: 'active' });
    setDrawerOpen(true);
  };

  const openEdit = (item: Category) => {
    setEditingItem(item);
    setCurrentType(item.categoryType);
    form.setFieldsValue({
      categoryName: item.categoryName,
      categoryType: item.categoryType,
      parentId: item.parentId,
      status: item.status,
    });
    setDrawerOpen(true);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/ledger/categories/${id}`);
      message.success('已删除');
      fetchData();
    } catch {
      message.error('删除失败');
    }
  };

  const handleDrop = async (target: CategoryRow) => {
    if (!draggingId || draggingId === target.id) return;
    const dragged = categories.find((item) => item.id === draggingId);
    if (!dragged) return;
    if (dragged.categoryType !== target.categoryType || (dragged.parentId ?? null) !== (target.parentId ?? null)) {
      message.warning('仅支持同级分类拖拽排序');
      setDraggingId(null);
      return;
    }
    const siblings = categories
      .filter((item) => item.categoryType === target.categoryType && (item.parentId ?? null) === (target.parentId ?? null))
      .sort((a, b) => a.sortNo - b.sortNo || a.id - b.id);
    const fromIndex = siblings.findIndex((item) => item.id === draggingId);
    const toIndex = siblings.findIndex((item) => item.id === target.id);
    if (fromIndex < 0 || toIndex < 0) return;
    const reorderedSiblings = [...siblings];
    const [moved] = reorderedSiblings.splice(fromIndex, 1);
    if (!moved) return;
    reorderedSiblings.splice(toIndex, 0, moved);
    const reorderedWithSort = reorderedSiblings.map((item, index) => ({ ...item, sortNo: (index + 1) * 10 }));
    const sortMap = new Map(reorderedWithSort.map((item) => [item.id, item.sortNo]));
    setCategories((prev) => prev.map((item) => sortMap.has(item.id) ? { ...item, sortNo: sortMap.get(item.id)! } : item));
    setDraggingId(null);
    try {
      await apiClient.put('/ledger/categories/sort', { items: reorderedWithSort.map((item) => ({ id: item.id, sortOrder: item.sortNo })) });
      message.success('排序已更新');
    } catch {
      message.error('排序保存失败');
      fetchData();
    }
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload = {
        categoryName: values.categoryName,
        categoryType: values.categoryType,
        parentId: values.parentId ?? null,
        sortNo: editingItem?.sortNo ?? 0,
        status: values.status || 'active',
      };
      if (editingItem) {
        await apiClient.put(`/ledger/categories/${editingItem.id}`, payload);
        message.success('分类已更新');
      } else {
        await apiClient.post('/ledger/categories', payload);
        message.success('分类已创建');
      }
      setDrawerOpen(false);
      fetchData();
    } finally {
      setSaving(false);
    }
  };

  const renderTable = (type: 'expense' | 'income') => {
    const rows = buildRows(type);
    const columns = [
      {
        title: '分类名称',
        dataIndex: 'categoryName',
        key: 'categoryName',
        render: (value: string, record: CategoryRow) => (
          <Space size={8}>
            <Typography.Text strong>{value}</Typography.Text>
            {record.status !== 'active' && <Tag>已停用</Tag>}
          </Space>
        ),
      },
      {
        title: '金额',
        dataIndex: 'amount',
        key: 'amount',
        width: 120,
        align: 'right' as const,
        render: (value: number) => <span style={{ fontFamily: 'DIN Alternate, monospace' }}>¥{fmtAmt(value)}</span>,
      },
      {
        title: '笔数',
        dataIndex: 'count',
        key: 'count',
        width: 80,
        align: 'right' as const,
      },
      {
        title: '占比',
        dataIndex: 'percentage',
        key: 'percentage',
        width: 100,
        align: 'right' as const,
        render: (value: number) => `${value.toFixed(1)}%`,
      },
      {
        title: '操作',
        key: 'actions',
        width: 220,
        render: (_: unknown, record: CategoryRow) => (
          <Space size={0}>
            <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
            <Button type="link" size="small" icon={<RightOutlined />} onClick={() => navigate(`/ledger/transactions?category=${record.id}`)}>查看流水</Button>
            {!record.parentId && <Button type="link" size="small" icon={<PlusOutlined />} onClick={() => openCreateChild(type, record)}>子分类</Button>}
            <Popconfirm title={record.parentId ? '确认删除此分类？' : '确认删除此父分类及其全部子分类？'} okText="确认" cancelText="取消" onConfirm={() => handleDelete(record.id)}>
              <Button type="link" size="small" danger icon={<DeleteOutlined />}>删除</Button>
            </Popconfirm>
          </Space>
        ),
      },
    ];

    return (
      <Card
        title={<Typography.Text style={{ color: panelMeta[type].color, fontWeight: 600, fontSize: 16 }}>{panelMeta[type].title}</Typography.Text>}
        extra={<Button type="primary" ghost onClick={() => openCreateRoot(type)}>添加父分类</Button>}
        bodyStyle={{ paddingTop: 12 }}
      >
        <Table
          dataSource={rows}
          columns={columns}
          loading={loading}
          pagination={false}
          size="middle"
          expandable={{ defaultExpandAllRows: true }}
          onRow={(record) => ({
            draggable: true,
            onDragStart: () => setDraggingId(record.id),
            onDragOver: (event) => event.preventDefault(),
            onDrop: () => void handleDrop(record),
            style: { cursor: 'move' },
          })}
        />
      </Card>
    );
  };

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>分类管理</Typography.Title>
      <Row gutter={24}>
        <Col span={12}>{renderTable('expense')}</Col>
        <Col span={12}>{renderTable('income')}</Col>
      </Row>

      <Drawer
        title={editingItem ? '编辑分类' : '新建分类'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" loading={saving} onClick={handleSave}>保存</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="categoryType" label="分类类型" rules={[{ required: true, message: '请选择分类类型' }]}>
            <Select
              disabled={!!editingItem}
              options={[
                { value: 'expense', label: '支出' },
                { value: 'income', label: '收入' },
              ]}
              onChange={(value) => setCurrentType(value)}
            />
          </Form.Item>
          <Form.Item name="parentId" label="父分类">
            <Select allowClear placeholder="不选则为父分类" options={rootOptions[currentType]} />
          </Form.Item>
          <Form.Item name="categoryName" label="分类名称" rules={[{ required: true, message: '请输入分类名称' }]}>
            <Input placeholder="请输入分类名称" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={[{ value: 'active', label: '活跃' }, { value: 'disabled', label: '已停用' }]} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default CategoryPageV2;
