import React, { useCallback, useEffect, useState } from 'react';
import { Button, Card, Form, Input, InputNumber, Space, Table, Tabs, Tag, Typography, message } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/api/client';

// ── General Settings Tab ──
interface SettingRow {
  id: number;
  key: string;
  value: string;
  description: string | null;
  isSecret: boolean;
}

const GeneralSettingsTab: React.FC = () => {
  const [settings, setSettings] = useState<SettingRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/settings');
      setSettings(res.data?.data ?? []);
    } catch {
      message.error('加载设置失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleSave = async (key: string) => {
    try {
      await apiClient.put(`/settings/${key}`, { value: editValue });
      message.success('设置已更新');
      setEditKey(null);
      fetchSettings();
    } catch {
      message.error('保存设置失败');
    }
  };

  const columns: ColumnsType<SettingRow> = [
    { title: '键', dataIndex: 'key', width: 200 },
    {
      title: '值', dataIndex: 'value', width: 300,
      render: (v, record) =>
        editKey === record.key ? (
          <Input.TextArea
            autoSize
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
          />
        ) : (
          <Typography.Text style={{ whiteSpace: 'pre-wrap' }}>{v}</Typography.Text>
        ),
    },
    { title: '描述', dataIndex: 'description', render: (v) => v || '-' },
    {
      title: '加密', dataIndex: 'isSecret', width: 70,
      render: (v) => v ? <Tag color="orange">是</Tag> : <Tag>否</Tag>,
    },
    {
      title: '操作', width: 140,
      render: (_, record) =>
        editKey === record.key ? (
          <Space>
            <a onClick={() => handleSave(record.key)}>保存</a>
            <a onClick={() => setEditKey(null)}>取消</a>
          </Space>
        ) : (
          <a onClick={() => { setEditKey(record.key); setEditValue(record.value); }}>编辑</a>
        ),
    },
  ];

  return (
    <Table rowKey="key" columns={columns} dataSource={settings} loading={loading} pagination={false} size="small" />
  );
};

// ── Lingxing Config Tab ──
const LingxingConfigTab: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get('/settings/lingxing_credentials').then((res) => {
      const val = res.data?.data?.value;
      if (val) {
        try {
          const parsed = JSON.parse(val);
          form.setFieldsValue(parsed);
        } catch { /* ignore */ }
      }
    }).catch(() => { /* not yet configured */ });
  }, [form]);

  const handleSave = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      await apiClient.put('/settings/lingxing_credentials', {
        value: values,
        isSecret: true,
        description: 'Lingxing ERP API credentials',
      });
      message.success('凭证已保存');
    } catch {
      message.error('保存凭证失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Form form={form} layout="vertical" style={{ maxWidth: 500 }}>
      <Form.Item name="appId" label="App ID" rules={[{ required: true }]}>
        <Input placeholder="ak_xxxxxxxxx" />
      </Form.Item>
      <Form.Item name="appSecret" label="App Secret" rules={[{ required: true }]}>
        <Input.Password placeholder="App Secret" />
      </Form.Item>
      <Button type="primary" loading={loading} onClick={handleSave}>
        保存凭证
      </Button>
    </Form>
  );
};

// ── Sync Jobs Tab ──
interface SyncJob {
  id: number;
  jobKey: string;
  jobName: string;
  status: string;
  cronExpr: string | null;
  lastRunAt: string | null;
  nextRunAt: string | null;
}

const SyncJobsTab: React.FC = () => {
  const [jobs, setJobs] = useState<SyncJob[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/sync-jobs');
      setJobs(res.data?.data ?? []);
    } catch {
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchJobs(); }, [fetchJobs]);

  const handleTrigger = async (id: number) => {
    try {
      await apiClient.post(`/sync-jobs/${id}/trigger`);
      message.success('任务已触发');
      fetchJobs();
    } catch {
      message.error('触发失败');
    }
  };

  const columns: ColumnsType<SyncJob> = [
    { title: '任务', dataIndex: 'jobName', width: 180 },
    { title: '键名', dataIndex: 'jobKey', width: 160 },
    { title: 'Cron', dataIndex: 'cronExpr', width: 120, render: (v) => v || '-' },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v) => <Tag color={v === 'active' ? 'green' : 'default'}>{v}</Tag>,
    },
    {
      title: '上次运行', dataIndex: 'lastRunAt', width: 170,
      render: (v) => v ? new Date(v).toLocaleString() : '从未',
    },
    {
      title: '操作', width: 100,
      render: (_, record) => (
        <a onClick={() => handleTrigger(record.id)}>触发</a>
      ),
    },
  ];

  return (
    <Table rowKey="id" columns={columns} dataSource={jobs} loading={loading} pagination={false} size="small" />
  );
};

// ── Profit Defaults Tab ──
const ProfitDefaultsTab: React.FC = () => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    apiClient.get('/settings/profit_defaults').then((res) => {
      const val = res.data?.data?.value;
      if (val) {
        try {
          const parsed = typeof val === 'string' ? JSON.parse(val) : val;
          form.setFieldsValue(parsed);
        } catch { /* ignore */ }
      }
    }).catch(() => { /* not yet configured */ });
  }, [form]);

  const handleSave = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      await apiClient.put('/settings/profit_defaults', {
        value: values,
        description: 'Default percentages for profit calculation formula',
      });
      message.success('默认值已保存');
    } catch {
      message.error('保存默认值失败');
    } finally {
      setLoading(false);
    }
  };

  const pctField = (name: string, label: string, tooltip?: string) => (
    <Form.Item name={name} label={label} tooltip={tooltip}>
      <InputNumber min={0} max={100} precision={1} addonAfter="%" style={{ width: 160 }} />
    </Form.Item>
  );

  return (
    <Form form={form} layout="vertical" style={{ maxWidth: 600 }}>
      <Typography.Title level={5}>亚马逊费用默认值</Typography.Title>
      {pctField('storagePct', '仓储费', '占售价百分比')}
      {pctField('commissionPct', '佣金', '平台佣金比例')}
      {pctField('advertisingPct', '广告费', '广告支出占售价百分比')}
      {pctField('returnPct', '退货率', '预期退货率')}

      <Typography.Title level={5} style={{ marginTop: 16 }}>物流默认值</Typography.Title>
      <Form.Item name="expressRatePerKg" label="快递费率 (¥/kg)">
        <InputNumber min={0} precision={2} addonAfter="¥/kg" style={{ width: 180 }} />
      </Form.Item>
      <Form.Item name="airRatePerKg" label="空运费率 (¥/kg)">
        <InputNumber min={0} precision={2} addonAfter="¥/kg" style={{ width: 180 }} />
      </Form.Item>
      <Form.Item name="seaRatePerKg" label="海运费率 (¥/kg)">
        <InputNumber min={0} precision={2} addonAfter="¥/kg" style={{ width: 180 }} />
      </Form.Item>

      <Typography.Title level={5} style={{ marginTop: 16 }}>汇率</Typography.Title>
      <Form.Item name="defaultExchangeRate" label="默认 USD → CNY 汇率">
        <InputNumber min={0} precision={4} style={{ width: 160 }} />
      </Form.Item>

      <Button type="primary" loading={loading} onClick={handleSave}>
        保存默认值
      </Button>
    </Form>
  );
};

// ── Main Settings Page ──
const SettingsPage: React.FC = () => {
  return (
    <Card title={<Typography.Title level={4} style={{ margin: 0 }}>系统设置</Typography.Title>}>
      <Tabs
        items={[
          { key: 'general', label: '常规', children: <GeneralSettingsTab /> },
          { key: 'shipping', label: '物流默认值', children: <LingxingConfigTab /> },
          { key: 'sync', label: '同步任务', children: <SyncJobsTab /> },
          { key: 'profit', label: '利润默认值', children: <ProfitDefaultsTab /> },
        ]}
      />
    </Card>
  );
};

export default SettingsPage;
