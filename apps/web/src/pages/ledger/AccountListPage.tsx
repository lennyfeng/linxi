import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Checkbox,
  Collapse,
  Drawer,
  Form,
  Input,
  message,
  Popconfirm,
  Row,
  Select,
  Space,
  Statistic,
  Table,
  Tag,
  Tabs,
  Typography,
} from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined, RightOutlined } from '@ant-design/icons';
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
  sortOrder?: number;
  status: string;
  remark?: string | null;
  accountGroup?: string | null;
  includeInAssets?: number;
  bankName?: string | null;
  accountNumber?: string | null;
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

const groupByTypeMap: Record<string, string> = {
  bank: '储蓄账户',
  cash: '现金账户',
  alipay: '虚拟账户',
  wechat: '虚拟账户',
  credit_card: '信用卡账户',
  other: '其他账户',
};

const liabilityTypes = new Set(['credit_card']);

const AccountListPage: React.FC = () => {
  const navigate = useNavigate();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [draggingId, setDraggingId] = useState<number | null>(null);
  const [showDisabled, setShowDisabled] = useState(false);
  const [activeTab, setActiveTab] = useState('asset');
  const [rateMap, setRateMap] = useState<Record<string, number>>({});
  const [form] = Form.useForm();

  const fetch = useCallback(() => {
    setLoading(true);
    apiClient
      .get('/ledger/accounts?pageSize=100')
      .then((r) => setAccounts(r.data?.data?.list ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  useEffect(() => {
    const currencies = Array.from(new Set(accounts.map((item) => item.currency).filter((item) => item && item !== 'CNY')));
    if (!currencies.length) {
      setRateMap({});
      return;
    }
    Promise.all(
      currencies.map(async (currency) => {
        try {
          const res = await apiClient.get('/ledger/exchange-rate', { params: { sourceCurrency: currency, targetCurrency: 'CNY' } });
          return [currency, Number(res.data?.data?.rate ?? res.data?.rate ?? 1)] as const;
        } catch {
          return [currency, 1] as const;
        }
      }),
    ).then((entries) => setRateMap(Object.fromEntries(entries)));
  }, [accounts]);

  const convertToCny = useCallback((account: Account) => {
    if (account.currency === 'CNY') return Number(account.currentBalance || 0);
    return Number(account.currentBalance || 0) * (rateMap[account.currency] || 1);
  }, [rateMap]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    form.setFieldsValue({
      currency: 'CNY',
      accountType: 'bank',
      accountGroup: groupByTypeMap.bank,
      includeInAssets: true,
      status: 'active',
      openingBalance: 0,
    });
    setDrawerOpen(true);
  };

  const openEdit = (record: Account) => {
    setEditing(record);
    form.setFieldsValue({ ...record, includeInAssets: record.includeInAssets !== 0 });
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    const payload = {
      ...values,
      openingBalance: Number(values.openingBalance || 0),
      includeInAssets: values.includeInAssets ? 1 : 0,
      accountGroup: values.accountGroup || groupByTypeMap[values.accountType] || '其他账户',
    };
    if (editing) {
      await apiClient.put(`/ledger/accounts/${editing.id}`, payload);
      message.success('账户已更新');
    } else {
      await apiClient.post('/ledger/accounts', { ...payload, currentBalance: payload.openingBalance });
      message.success('账户已创建');
    }
    setDrawerOpen(false);
    fetch();
  };

  const columns = [
    {
      title: '账户名称',
      dataIndex: 'accountName',
      key: 'accountName',
      render: (value: string, record: Account) => (
        <div>
          <Space size={8}>
            <Typography.Text strong>{value}</Typography.Text>
            {record.status === 'disabled' && <Tag>已隐藏</Tag>}
          </Space>
          {record.bankName && <div style={{ fontSize: 12, color: '#8C8C8C', marginTop: 2 }}>{record.bankName}</div>}
        </div>
      ),
    },
    {
      title: '资产',
      dataIndex: 'currentBalance',
      key: 'currentBalance',
      width: 180,
      align: 'right' as const,
      render: (_: number, record: Account) => (
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontFamily: 'DIN Alternate, monospace', fontWeight: 600, color: record.currentBalance >= 0 ? '#00B894' : '#FF6B6B' }}>
            {record.currency === 'CNY' ? '¥' : `${record.currency} `}{fmtAmt(record.currentBalance || 0)}
          </div>
          {record.currency !== 'CNY' && <div style={{ fontSize: 12, color: '#8C8C8C' }}>折算 CNY ¥{fmtAmt(convertToCny(record))}</div>}
        </div>
      ),
    },
    { title: '币种', dataIndex: 'currency', key: 'currency', width: 90 },
    {
      title: '计入资产',
      dataIndex: 'includeInAssets',
      key: 'includeInAssets',
      width: 100,
      render: (value: number | undefined) => <Tag color={value === 0 ? 'default' : 'green'}>{value === 0 ? '否' : '是'}</Tag>,
    },
    {
      title: '备注',
      dataIndex: 'remark',
      key: 'remark',
      ellipsis: true,
      render: (value: string | null | undefined) => value || '-',
    },
    {
      title: '操作',
      key: 'actions',
      width: 200,
      render: (_: unknown, record: Account) => (
        <Space size={4}>
          <Button type="link" size="small" icon={<EditOutlined />} onClick={() => openEdit(record)}>编辑</Button>
          <Button type="link" size="small" icon={<RightOutlined />} onClick={() => navigate(`/ledger/transactions?account=${record.id}`)}>流水</Button>
          <Popconfirm title="确认停用此账户？" onConfirm={async () => { await apiClient.delete(`/ledger/accounts/${record.id}`); message.success('已停用'); fetch(); }} okText="确认" cancelText="取消">
            <Button type="link" size="small" danger icon={<DeleteOutlined />}>停用</Button>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  const totals = useMemo(() => {
    let assets = 0;
    let liabilities = 0;
    for (const account of accounts) {
      if (account.status !== 'active') continue;
      if (liabilityTypes.has(account.accountType)) {
        liabilities += Math.abs(convertToCny(account));
      } else if (account.includeInAssets !== 0) {
        assets += convertToCny(account);
      }
    }
    return { assets, liabilities, netWorth: assets - liabilities };
  }, [accounts, convertToCny]);

  const filteredAccounts = useMemo(() => {
    return accounts.filter((account) => {
      if (!showDisabled && account.status !== 'active') return false;
      if (activeTab === 'asset') return !liabilityTypes.has(account.accountType);
      return liabilityTypes.has(account.accountType);
    });
  }, [accounts, activeTab, showDisabled]);

  const grouped = useMemo(() => {
    const map = new Map<string, Account[]>();
    for (const account of filteredAccounts) {
      const key = account.accountGroup || groupByTypeMap[account.accountType] || '其他账户';
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(account);
    }
    return Array.from(map.entries());
  }, [filteredAccounts]);

  const handleDrop = async (groupName: string, targetId: number) => {
    if (!draggingId || draggingId === targetId) return;
    const siblings = accounts
      .filter((item) => (item.accountGroup || groupByTypeMap[item.accountType] || '其他账户') === groupName)
      .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.id - b.id);
    const fromIndex = siblings.findIndex((item) => item.id === draggingId);
    const toIndex = siblings.findIndex((item) => item.id === targetId);
    if (fromIndex < 0 || toIndex < 0) return;
    const reorderedSiblings = [...siblings];
    const [moved] = reorderedSiblings.splice(fromIndex, 1);
    if (!moved) return;
    reorderedSiblings.splice(toIndex, 0, moved);
    const reorderedWithSort = reorderedSiblings.map((item, index) => ({ ...item, sortOrder: (index + 1) * 10 }));
    const sortMap = new Map(reorderedWithSort.map((item) => [item.id, item.sortOrder ?? 0]));
    setAccounts((prev) => prev.map((item) => sortMap.has(item.id) ? { ...item, sortOrder: sortMap.get(item.id) } : item));
    setDraggingId(null);
    try {
      await apiClient.put('/ledger/accounts/sort', { items: reorderedWithSort.map((item) => ({ id: item.id, sortOrder: item.sortOrder ?? 0 })) });
      message.success('排序已更新');
    } catch {
      message.error('排序保存失败');
      fetch();
    }
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Stats Header */}
      <Row gutter={24} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card><Statistic title="总资产" value={totals.assets} precision={2} prefix="¥" valueStyle={{ color: '#FF8C42', fontWeight: 600, fontFamily: 'DIN Alternate, monospace' }} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="总负债" value={totals.liabilities} precision={2} prefix="¥" valueStyle={{ color: '#52C41A', fontWeight: 600, fontFamily: 'DIN Alternate, monospace' }} /></Card>
        </Col>
        <Col span={8}>
          <Card><Statistic title="净资产" value={totals.netWorth} precision={2} prefix="¥" valueStyle={{ color: totals.netWorth >= 0 ? '#FF8C42' : '#52C41A', fontWeight: 600, fontFamily: 'DIN Alternate, monospace' }} /></Card>
        </Col>
      </Row>

      <Card
        title={<Typography.Title level={4} style={{ margin: 0 }}>账户管理</Typography.Title>}
        extra={
          <Space>
            <Checkbox checked={showDisabled} onChange={(e) => setShowDisabled(e.target.checked)}>显示已隐藏的账户</Checkbox>
            <Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>
              新建账户
            </Button>
          </Space>
        }
      >
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={[
            { key: 'asset', label: '资产账户' },
            { key: 'liability', label: '负债账户' },
          ]}
        />
        <Collapse
          bordered={false}
          items={grouped.map(([type, list]) => ({
            key: type,
            label: <Typography.Text strong>{type}</Typography.Text>,
            children: (
              <Table
                dataSource={list}
                columns={columns}
                rowKey="id"
                loading={loading}
                pagination={false}
                size="middle"
                showHeader={list === grouped[0]?.[1]}
                onRow={(record) => ({
                  draggable: true,
                  onDragStart: () => setDraggingId(record.id),
                  onDragOver: (event) => event.preventDefault(),
                  onDrop: () => void handleDrop(type, record.id),
                  style: { cursor: 'move' },
                })}
              />
            ),
          }))}
          defaultActiveKey={grouped.map(([type]) => type)}
        />
      </Card>

      <Drawer
        title={editing ? '编辑账户' : '新建账户'}
        open={drawerOpen}
        onClose={() => setDrawerOpen(false)}
        width={460}
        extra={
          <Space>
            <Button onClick={() => setDrawerOpen(false)}>取消</Button>
            <Button type="primary" onClick={handleSave}>保存</Button>
          </Space>
        }
      >
        <Form form={form} layout="vertical">
          <Form.Item name="accountName" label="账户名称" rules={[{ required: true, message: '请输入账户名称' }]}>
            <Input />
          </Form.Item>
          <Form.Item name="accountType" label="账户类型" rules={[{ required: true, message: '请选择账户类型' }]}>
            <Select
              options={accountTypes}
              onChange={(value) => {
                if (!form.getFieldValue('accountGroup')) {
                  form.setFieldValue('accountGroup', groupByTypeMap[value] || '其他账户');
                }
              }}
            />
          </Form.Item>
          <Form.Item name="accountGroup" label="账户分组" rules={[{ required: true, message: '请输入账户分组' }]}>
            <Input placeholder="如：现金账户、储蓄账户" />
          </Form.Item>
          <Form.Item name="currency" label="币种">
            <Select options={[{ value: 'CNY', label: 'CNY' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }, { value: 'GBP', label: 'GBP' }]} />
          </Form.Item>
          <Form.Item name="openingBalance" label="期初余额">
            <Input type="number" />
          </Form.Item>
          <Form.Item name="bankName" label="开户行">
            <Input />
          </Form.Item>
          <Form.Item name="accountNumber" label="账号">
            <Input />
          </Form.Item>
          <Form.Item name="includeInAssets" valuePropName="checked">
            <Checkbox>计入净资产统计</Checkbox>
          </Form.Item>
          <Form.Item name="status" label="状态">
            <Select options={[{ value: 'active', label: '活跃' }, { value: 'disabled', label: '已隐藏' }]} />
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
