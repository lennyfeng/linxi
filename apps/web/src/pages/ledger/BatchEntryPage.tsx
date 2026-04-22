import React, { useEffect, useState } from 'react';
import {
  Button,
  Card,
  DatePicker,
  Input,
  InputNumber,
  message,
  Select,
  Space,
  Table,
  Typography,
} from 'antd';
import { PlusOutlined, DeleteOutlined, SaveOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '@/api/client';

interface RowData {
  key: string;
  transactionType: string;
  transactionDate: string;
  accountId?: number;
  categoryId?: number;
  amount: number;
  counterpartyName: string;
  summary: string;
}

interface RefOption { value: number; label: string; }

const newRow = (): RowData => ({
  key: `r-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
  transactionType: 'expense',
  transactionDate: dayjs().format('YYYY-MM-DD'),
  amount: 0,
  counterpartyName: '',
  summary: '',
});

const BatchEntryPage: React.FC = () => {
  const [rows, setRows] = useState<RowData[]>([newRow(), newRow(), newRow()]);
  const [accounts, setAccounts] = useState<RefOption[]>([]);
  const [categories, setCategories] = useState<RefOption[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    apiClient.get('/ledger/accounts?pageSize=100').then((r) => {
      setAccounts((r.data?.data?.list ?? []).map((a: any) => ({ value: a.id, label: a.accountName })));
    });
    apiClient.get('/ledger/categories?pageSize=100').then((r) => {
      setCategories((r.data?.data?.list ?? []).map((c: any) => ({ value: c.id, label: c.categoryName })));
    });
  }, []);

  const updateRow = (key: string, field: string, value: unknown) => {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, [field]: value } : r)));
  };

  const addRow = () => setRows((prev) => [...prev, newRow()]);
  const removeRow = (key: string) => setRows((prev) => prev.filter((r) => r.key !== key));

  const handleSave = async () => {
    const valid = rows.filter((r) => r.amount > 0);
    if (!valid.length) { message.warning('没有有效行可保存'); return; }
    setSaving(true);
    try {
      const res = await apiClient.post('/ledger/transactions/batch', { transactions: valid });
      const d = res.data?.data ?? res.data;
      message.success(`已保存 ${d?.success ?? valid.length} 条流水`);
      setRows([newRow(), newRow(), newRow()]);
    } catch {
      message.error('保存失败');
    } finally {
      setSaving(false);
    }
  };

  const columns = [
    {
      title: '类型',
      dataIndex: 'transactionType',
      width: 110,
      render: (_: unknown, row: RowData) => (
        <Select
          size="small"
          value={row.transactionType}
          onChange={(v) => updateRow(row.key, 'transactionType', v)}
          style={{ width: '100%' }}
          options={[
            { value: 'expense', label: '支出' },
            { value: 'income', label: '收入' },
            { value: 'transfer', label: '转账' },
          ]}
        />
      ),
    },
    {
      title: '日期',
      dataIndex: 'transactionDate',
      width: 140,
      render: (_: unknown, row: RowData) => (
        <DatePicker
          size="small"
          value={dayjs(row.transactionDate)}
          onChange={(d) => updateRow(row.key, 'transactionDate', d?.format('YYYY-MM-DD') ?? '')}
          style={{ width: '100%' }}
        />
      ),
    },
    {
      title: '账户',
      dataIndex: 'accountId',
      width: 150,
      render: (_: unknown, row: RowData) => (
        <Select
          size="small"
          value={row.accountId}
          onChange={(v) => updateRow(row.key, 'accountId', v)}
          style={{ width: '100%' }}
          showSearch
          optionFilterProp="label"
          options={accounts}
          allowClear
          placeholder="请选择..."
        />
      ),
    },
    {
      title: '分类',
      dataIndex: 'categoryId',
      width: 150,
      render: (_: unknown, row: RowData) => (
        <Select
          size="small"
          value={row.categoryId}
          onChange={(v) => updateRow(row.key, 'categoryId', v)}
          style={{ width: '100%' }}
          showSearch
          optionFilterProp="label"
          options={categories}
          allowClear
          placeholder="请选择..."
        />
      ),
    },
    {
      title: '金额',
      dataIndex: 'amount',
      width: 120,
      render: (_: unknown, row: RowData) => (
        <InputNumber
          size="small"
          value={row.amount}
          onChange={(v) => updateRow(row.key, 'amount', v ?? 0)}
          style={{ width: '100%' }}
          min={0}
          precision={2}
        />
      ),
    },
    {
      title: '对方',
      dataIndex: 'counterpartyName',
      width: 160,
      render: (_: unknown, row: RowData) => (
        <Input
          size="small"
          value={row.counterpartyName}
          onChange={(e) => updateRow(row.key, 'counterpartyName', e.target.value)}
        />
      ),
    },
    {
      title: '摘要',
      dataIndex: 'summary',
      render: (_: unknown, row: RowData) => (
        <Input
          size="small"
          value={row.summary}
          onChange={(e) => updateRow(row.key, 'summary', e.target.value)}
        />
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: unknown, row: RowData) => (
        <Button
          type="text"
          danger
          icon={<DeleteOutlined />}
          onClick={() => removeRow(row.key)}
          disabled={rows.length <= 1}
        />
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<Typography.Title level={4} style={{ margin: 0 }}>批量录入</Typography.Title>}
        extra={
          <Space>
            <Button icon={<PlusOutlined />} onClick={addRow}>添加行</Button>
            <Button type="primary" icon={<SaveOutlined />} onClick={handleSave} loading={saving}>
              保存全部 ({rows.filter((r) => r.amount > 0).length})
            </Button>
          </Space>
        }
      >
        <Table
          dataSource={rows}
          columns={columns}
          rowKey="key"
          pagination={false}
          size="small"
          scroll={{ x: 900 }}
        />
      </Card>
    </div>
  );
};

export default BatchEntryPage;
