import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Typography, Spin, Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/api/client';

interface ProfitCalc {
  id: number;
  projectId: number;
  salesPriceUsd: number;
  exchangeRate: number;
  productCostRmb: number;
  accessoryCostRmb: number;
  shippingExpress: number | null;
  shippingAir: number | null;
  shippingSea: number | null;
  selectedPlan: string | null;
  selectedProfit: number | null;
  selectedProfitRate: number | null;
  calculatedBy: string | null;
}

interface ProjectOption {
  id: number;
  projectCode: string;
  productName: string;
}

const planLabels: Record<string, { label: string; color: string }> = {
  express: { label: '快递', color: 'blue' },
  air: { label: '空运', color: 'cyan' },
  sea: { label: '海运', color: 'green' },
};

const ProfitPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<ProfitCalc[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [profitRes, projectRes] = await Promise.all([
        apiClient.get('/product-dev/profit-calculations'),
        apiClient.get('/product-dev/projects'),
      ]);
      setData(profitRes.data?.data?.items ?? profitRes.data?.data ?? []);
      setProjects(projectRes.data?.data?.items ?? projectRes.data?.data ?? []);
    } catch { message.error('加载利润试算数据失败'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      const shipping = values.selectedPlan === 'express' ? values.shippingExpress : values.selectedPlan === 'air' ? values.shippingAir : values.selectedPlan === 'sea' ? values.shippingSea : 0;
      const revenueRmb = Number(values.salesPriceUsd || 0) * Number(values.exchangeRate || 0);
      const totalCost = Number(values.productCostRmb || 0) + Number(values.accessoryCostRmb || 0) + Number(shipping || 0);
      const selectedProfit = revenueRmb - totalCost;
      const selectedProfitRate = revenueRmb > 0 ? (selectedProfit / revenueRmb) * 100 : null;
      setCreating(true);
      await apiClient.post('/product-dev/profit-calculations', {
        ...values,
        selectedProfit,
        selectedProfitRate,
      });
      setModalOpen(false);
      form.resetFields();
      message.success('利润试算已创建');
      await load();
    } catch { /* ignore */ }
    setCreating(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/product-dev/profit-calculations/${id}`);
      message.success('已删除');
      await load();
    } catch { message.error('删除失败'); }
  };

  const columns: ColumnsType<ProfitCalc> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '项目', dataIndex: 'projectId', width: 180, render: (v: number) => {
      const project = projects.find((p) => p.id === v);
      return project ? `${project.projectCode} · ${project.productName}` : v;
    } },
    { title: '售价(USD)', dataIndex: 'salesPriceUsd', width: 100, align: 'right', render: (v: number) => `$${Number(v).toFixed(2)}` },
    { title: '汇率', dataIndex: 'exchangeRate', width: 80, render: (v: number) => Number(v).toFixed(4) },
    { title: '产品成本', dataIndex: 'productCostRmb', width: 100, align: 'right', render: (v: number) => `¥${Number(v).toFixed(2)}` },
    { title: '配件成本', dataIndex: 'accessoryCostRmb', width: 100, align: 'right', render: (v: number) => `¥${Number(v).toFixed(2)}` },
    { title: '方案', dataIndex: 'selectedPlan', width: 80,
      render: (v: string) => { const m = planLabels[v]; return m ? <Tag color={m.color}>{m.label}</Tag> : v || '-'; } },
    { title: '利润', dataIndex: 'selectedProfit', width: 100, align: 'right', render: (v: number) => v != null ? `¥${Number(v).toFixed(2)}` : '-' },
    { title: '利润率', dataIndex: 'selectedProfitRate', width: 90, align: 'right',
      render: (v: number) => v != null ? <span style={{ color: Number(v) >= 20 ? '#3f8600' : Number(v) >= 10 ? undefined : '#cf1322' }}>{Number(v).toFixed(1)}%</span> : '-' },
    { title: '计算人', dataIndex: 'calculatedBy', width: 90, render: (v: string) => v || '-' },
    { title: '操作', key: 'actions', width: 80, render: (_: unknown, r: ProfitCalc) => <Button size="small" type="link" danger onClick={() => handleDelete(r.id)}>删除</Button> },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>利润试算</Typography.Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新增试算</Button>
        </Space>
      </div>

      {loading ? <Spin /> : (
        <Table dataSource={data} columns={columns} rowKey="id" size="small"
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
        />
      )}

      <Modal title="新增利润试算" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleCreate} confirmLoading={creating} width={600}>
        <Form form={form} layout="vertical">
          <Form.Item name="projectId" label="项目ID" rules={[{ required: true }]}>
            <Select showSearch placeholder="选择项目" optionFilterProp="label" options={projects.map((p) => ({ value: p.id, label: `${p.projectCode} · ${p.productName}` }))} />
          </Form.Item>
          <Space size="large" style={{ width: '100%' }}>
            <Form.Item name="salesPriceUsd" label="售价(USD)" rules={[{ required: true }]}>
              <InputNumber min={0} precision={2} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="exchangeRate" label="汇率" rules={[{ required: true }]}>
              <InputNumber min={0} precision={4} style={{ width: 200 }} />
            </Form.Item>
          </Space>
          <Space size="large" style={{ width: '100%' }}>
            <Form.Item name="productCostRmb" label="产品成本(¥)">
              <InputNumber min={0} precision={2} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="accessoryCostRmb" label="配件成本(¥)">
              <InputNumber min={0} precision={2} style={{ width: 200 }} />
            </Form.Item>
          </Space>
          <Space size="large" style={{ width: '100%' }}>
            <Form.Item name="shippingExpress" label="快递运费(¥)">
              <InputNumber min={0} precision={2} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="shippingAir" label="空运费(¥)">
              <InputNumber min={0} precision={2} style={{ width: 200 }} />
            </Form.Item>
            <Form.Item name="shippingSea" label="海运费(¥)">
              <InputNumber min={0} precision={2} style={{ width: 200 }} />
            </Form.Item>
          </Space>
          <Form.Item name="selectedPlan" label="选择方案">
            <Select placeholder="选择物流方案" options={Object.entries(planLabels).map(([v, m]) => ({ value: v, label: m.label }))} />
          </Form.Item>
          <Form.Item name="calculatedBy" label="计算人">
            <Input />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProfitPage;
