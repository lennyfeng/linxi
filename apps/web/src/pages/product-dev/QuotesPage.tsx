import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Typography, Spin, Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/api/client';

interface Quote {
  id: number;
  projectId: number;
  supplierName: string;
  supplierErpId: string | null;
  currency: string;
  quotePrice: number;
  moq: number | null;
  taxIncluded: number;
  deliveryDays: number | null;
  preferred: number;
}

interface ProjectOption {
  id: number;
  projectCode: string;
  productName: string;
}

const QuotesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Quote[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [quoteRes, projectRes] = await Promise.all([
        apiClient.get('/product-dev/quotes'),
        apiClient.get('/product-dev/projects'),
      ]);
      setData(quoteRes.data?.data?.items ?? quoteRes.data?.data ?? []);
      setProjects(projectRes.data?.data?.items ?? projectRes.data?.data ?? []);
    } catch { message.error('加载报价数据失败'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);
      await apiClient.post('/product-dev/quotes', values);
      setModalOpen(false);
      form.resetFields();
      message.success('报价已创建');
      await load();
    } catch { /* ignore */ }
    setCreating(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/product-dev/quotes/${id}`);
      message.success('已删除');
      await load();
    } catch { message.error('删除失败'); }
  };

  const columns: ColumnsType<Quote> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '项目', dataIndex: 'projectId', width: 180, render: (v: number) => {
      const project = projects.find((p) => p.id === v);
      return project ? `${project.projectCode} · ${project.productName}` : v;
    } },
    { title: '供应商', dataIndex: 'supplierName', width: 140 },
    { title: 'ERP编码', dataIndex: 'supplierErpId', width: 110, render: (v: string) => v || '-' },
    { title: '币种', dataIndex: 'currency', width: 70 },
    { title: '报价', dataIndex: 'quotePrice', width: 100, align: 'right', render: (v: number) => v?.toFixed(2) ?? '-' },
    { title: 'MOQ', dataIndex: 'moq', width: 70, render: (v: number) => v ?? '-' },
    { title: '含税', dataIndex: 'taxIncluded', width: 70, render: (v: number) => v ? '是' : '否' },
    { title: '交期(天)', dataIndex: 'deliveryDays', width: 90, render: (v: number) => v ?? '-' },
    { title: '首选', dataIndex: 'preferred', width: 70, render: (v: number) => v ? <Tag color="green">首选</Tag> : '-' },
    { title: '操作', key: 'actions', width: 80, render: (_: unknown, r: Quote) => <Button size="small" type="link" danger onClick={() => handleDelete(r.id)}>删除</Button> },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>报价管理</Typography.Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新增报价</Button>
        </Space>
      </div>

      {loading ? <Spin /> : (
        <Table dataSource={data} columns={columns} rowKey="id" size="small"
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
        />
      )}

      <Modal title="新增报价" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleCreate} confirmLoading={creating}>
        <Form form={form} layout="vertical">
          <Form.Item name="projectId" label="项目ID" rules={[{ required: true }]}>
            <Select showSearch placeholder="选择项目" optionFilterProp="label" options={projects.map((p) => ({ value: p.id, label: `${p.projectCode} · ${p.productName}` }))} />
          </Form.Item>
          <Form.Item name="supplierName" label="供应商名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="supplierErpId" label="ERP编码">
            <Input />
          </Form.Item>
          <Form.Item name="currency" label="币种" initialValue="CNY">
            <Select options={[{ value: 'CNY', label: 'CNY' }, { value: 'USD', label: 'USD' }, { value: 'EUR', label: 'EUR' }]} />
          </Form.Item>
          <Form.Item name="quotePrice" label="报价" rules={[{ required: true }]}>
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="moq" label="MOQ">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="deliveryDays" label="交期(天)">
            <InputNumber min={0} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="taxIncluded" label="含税" initialValue={1}>
            <Select options={[{ value: 1, label: '是' }, { value: 0, label: '否' }]} />
          </Form.Item>
          <Form.Item name="preferred" label="首选供应商" initialValue={0}>
            <Select options={[{ value: 1, label: '是' }, { value: 0, label: '否' }]} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default QuotesPage;
