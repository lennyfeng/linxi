import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Drawer,
  Form,
  Input,
  message,
  Select,
  Space,
  Table,
  Tag,
  Typography,
} from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import apiClient from '@/api/client';

interface Account {
  id: number;
  accountName: string;
  accountType: string;
  accountSourceType: string | null;
  currency: string;
  openingBalance: number;
  currentBalance: number;
  status: string;
  remark?: string | null;
}

const fmtAmt = (n: number) =>
  Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const accountTypes = [
  { value: 'bank', label: '银行' },
  { value: 'cash', label: '现金' },
  { value: 'alipay', label: '支付宝' },
  { value: 'wechat', label: '微信' },
  { value: 'credit_card', label: '信用卡' },
  { value: 'other', label: '其他' },
];

const AccountListPage: React.FC = () => {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form] = Form.useForm();

  const fetch = useCallback(() => {
    setLoading(true);
    apiClient
      .get('/ledger/accounts?pageSize=200')
      .then((r) => setAccounts(r.data?.data?.list ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({ currency: 'CNY', accountType: 'bank', status: 'active', openingBalance: 0 });
    setDrawerOpen(true);
  };

  const openEdit = (record: Account) => {
    setEditing(record);
    form.setFieldsValue(record);
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    if (editing) {
      await apiClient.put(`/ledger/accounts/${editing.id}`, values);
      message.success('账户已更新');
    } else {
      await apiClient.post('/ledger/accounts', { ...values, currentBalance: values.openingBalance });
      message.success('账户已创建');
    }
    setDrawerOpen(false);
    fetch();
  };

  const columns = [
    { title: '名称', dataIndex: 'accountName', key: 'name' },
    {
      title: '类型',
      dataIndex: 'accountType',
      key: 'type',
      width: 120,
      render: (t: string) => <Tag>{t}</Tag>,
    },
    { title: '币种', dataIndex: 'currency', key: 'currency', width: 80 },
    {
      title: '期初余额',
      dataIndex: 'openingBalance',
      key: 'opening',
      width: 140,
      align: 'right' as const,
      render: (v: number) => <span style={{ fontFamily: 'DIN Alternate, monospace' }}>¥{fmtAmt(v)}</span>,
    },
    {
      title: '当前余额',
      dataIndex: 'currentBalance',
      key: 'current',
      width: 140,
      align: 'right' as const,
      render: (v: number) => (
        <span
          style={{
            fontFamily: 'DIN Alternate, monospace',
            fontWeight: 600,
            color: v >= 0 ? '#00B894' : '#FF6B6B',
          }}
        >
          ¥{fmtAmt(v)}
        </span>
      ),
    },
    {
      title: '状态',
      dataIndex: 'status',
      key: 'status',
      width: 90,
      render: (s: string) => (
        <Tag color={s === 'active' ? 'green' : 'default'}>{s === 'active' ? '活跃' : '已禁用'}</Tag>
      ),
    },
    {
      title: '',
      key: 'actions',
      width: 60,
      render: (_: unknown, record: Account) => (
        <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)} />
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card
        title={<Typography.Title level={4} style={{ margin: 0 }}>账户管理</Typography.Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            新建账户
          </Button>
        }
      >
        <Table
          dataSource={accounts}
          columns={columns}
          rowKey="id"
          loading={loading}
          pagination={false}
          size="middle"
        />
      </Card>

      <Drawer
        title={editing ? '编辑账户' : '新建账户'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={420}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSave}>保存</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="accountName" label="名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="accountType" label="类型" rules={[{ required: true }]}>
            <Select options={accountTypes} />
          </Form.Item>
          <Form.Item name="currency" label="币种">
            <Select options={[{ value: 'CNY' }, { value: 'USD' }, { value: 'EUR' }, { value: 'GBP' }]} />
          </Form.Item>
          <Form.Item name="openingBalance" label="期初余额">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={[{ value: 'active', label: '活跃' }, { value: 'disabled', label: '已禁用' }]} />
          </Form.Item>
          <Form.Item name="remark" label="备注">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Drawer>
    </div>
  );
};

export default AccountListPage;
