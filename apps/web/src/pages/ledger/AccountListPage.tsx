import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Drawer,
  Form,
  Input,
  message,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Typography,
} from 'antd';
import { PlusOutlined, EditOutlined, RightOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
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
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [form] = Form.useForm();

  const fetch = useCallback(() => {
    setLoading(true);
    apiClient
      .get('/ledger/accounts?pageSize=100')
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
      width: 140,
      render: (_: unknown, record: Account) => (
        <Space>
          <Button type="link" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Button type="link" icon={<RightOutlined />} onClick={() => navigate(`/ledger/transactions?account=${record.id}`)}>Transactions</Button>
        </Space>
      ),
    },
  ];

  const totals = useMemo(() => {
    let assets = 0, liabilities = 0;
    for (const a of accounts) {
      if (a.status !== 'active') continue;
      if (a.accountType === 'credit_card') {
        liabilities += a.currentBalance;
      } else {
        assets += a.currentBalance;
      }
    }
    return { assets, liabilities, netWorth: assets - liabilities };
  }, [accounts]);

  const grouped = useMemo(() => {
    const map = new Map<string, Account[]>();
    for (const a of accounts) {
      const key = a.accountType || 'other';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(a);
    }
    return Array.from(map.entries());
  }, [accounts]);

  return (
    <div style={{ padding: 24 }}>
      {/* Stats Header */}
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card><Statistic title="Total Assets" value={totals.assets} precision={2} prefix="¥" valueStyle={{ color: '#FF8C42', fontWeight: 600, fontFamily: 'DIN Alternate, monospace' }} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Total Liabilities" value={totals.liabilities} precision={2} prefix="¥" valueStyle={{ color: '#52C41A', fontWeight: 600, fontFamily: 'DIN Alternate, monospace' }} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="Net Worth" value={totals.netWorth} precision={2} prefix="¥" valueStyle={{ color: totals.netWorth >= 0 ? '#FF8C42' : '#52C41A', fontWeight: 600, fontFamily: 'DIN Alternate, monospace' }} /></Card>
        </Col>
      </Row>

      <Card
        title={<Typography.Title level={4} style={{ margin: 0 }}>Account Management</Typography.Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
            New Account
          </Button>
        }
      >
        {grouped.map(([type, list]) => (
          <div key={type} style={{ marginBottom: 24 }}>
            <Typography.Text strong style={{ fontSize: 14, color: '#6B7B8D', marginBottom: 8, display: 'block' }}>
              {accountTypes.find((t) => t.value === type)?.label ?? type}
            </Typography.Text>
            <Table
              dataSource={list}
              columns={columns}
              rowKey="id"
              loading={loading}
              pagination={false}
              size="middle"
              showHeader={list === grouped[0]?.[1]}
            />
          </div>
        ))}
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
