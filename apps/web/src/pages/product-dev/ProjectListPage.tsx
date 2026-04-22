import React, { useEffect, useState } from 'react';
import { Table, Tag, Input, Button, Space, Typography, Spin, Modal, Form, InputNumber } from 'antd';
import { PlusOutlined, SearchOutlined, AppstoreOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';

interface Project {
  id: number;
  projectCode: string;
  productName: string;
  sku: string | null;
  developerName: string | null;
  projectStatus: string;
  estimatedCost: number | null;
  targetPrice: number | null;
  grossMarginTarget: number | null;
  createdAt: string;
}

const stageColors: Record<string, string> = {
  '待调研': 'default', '调研中': 'processing', '选品完成': 'blue',
  '打样中': 'cyan', '样品评审': 'geekblue', '报价中': 'purple',
  '利润测算': 'magenta', '审批中': 'orange', '待推送': 'gold',
  '已推送': 'lime', '已上架': 'green', '已终止': 'red', '已归档': 'default',
};

const ProjectListPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Project[]>([]);
  const [keyword, setKeyword] = useState('');
  const [quickModal, setQuickModal] = useState(false);
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/product-dev/projects');
      setData(res.data?.data?.items ?? res.data?.data ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleQuickCreate = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);
      await apiClient.post('/product-dev/projects', values);
      setQuickModal(false);
      form.resetFields();
      await load();
    } catch { /* ignore */ }
    setCreating(false);
  };

  const filtered = keyword
    ? data.filter((r) => r.productName?.toLowerCase().includes(keyword.toLowerCase()) || r.projectCode?.toLowerCase().includes(keyword.toLowerCase()) || r.sku?.toLowerCase().includes(keyword.toLowerCase()))
    : data;

  const columns: ColumnsType<Project> = [
    { title: '编码', dataIndex: 'projectCode', key: 'projectCode', width: 140 },
    { title: '产品', dataIndex: 'productName', key: 'productName',
      render: (v: string, r: Project) => <a onClick={() => navigate(`/product-dev/projects/${r.id}`)}>{v}</a> },
    { title: 'SKU', dataIndex: 'sku', key: 'sku', width: 120, render: (v: string) => v || '-' },
    { title: '开发人', dataIndex: 'developerName', key: 'developerName', width: 100, render: (v: string) => v || '-' },
    { title: '阶段', dataIndex: 'projectStatus', key: 'projectStatus', width: 110,
      render: (v: string) => <Tag color={stageColors[v] || 'default'}>{v}</Tag> },
    { title: '预估成本', dataIndex: 'estimatedCost', key: 'estimatedCost', width: 100, align: 'right',
      render: (v: number | string | null) => v != null ? `¥${Number(v).toFixed(2)}` : '-' },
    { title: '目标售价', dataIndex: 'targetPrice', key: 'targetPrice', width: 110, align: 'right',
      render: (v: number | string | null) => v != null ? `$${Number(v).toFixed(2)}` : '-' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 110,
      render: (v: string) => v?.split('T')[0] ?? '-' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>产品开发</Typography.Title>
        <Space>
          <Input placeholder="搜索..." prefix={<SearchOutlined />} value={keyword} onChange={(e) => setKeyword(e.target.value)} allowClear style={{ width: 220 }} />
          <Button icon={<AppstoreOutlined />} onClick={() => navigate('/product-dev/kanban')}>看板</Button>
          <Button icon={<PlusOutlined />} onClick={() => setQuickModal(true)}>快速创建</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/product-dev/projects/new')}>完整创建</Button>
        </Space>
      </div>

      {loading ? <Spin /> : (
        <Table dataSource={filtered} columns={columns} rowKey="id" size="small"
          pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (t) => `共 ${t} 个项目` }}
          onRow={(r) => ({ onClick: () => navigate(`/product-dev/projects/${r.id}`), style: { cursor: 'pointer' } })}
        />
      )}

      <Modal title="快速创建项目" open={quickModal} onCancel={() => setQuickModal(false)} onOk={handleQuickCreate} confirmLoading={creating}>
        <Form form={form} layout="vertical">
          <Form.Item name="productName" label="产品名称" rules={[{ required: true }]}>
            <Input />
          </Form.Item>
          <Form.Item name="sku" label="SKU">
            <Input />
          </Form.Item>
          <Form.Item name="developerName" label="开发人">
            <Input />
          </Form.Item>
          <Form.Item name="targetPlatform" label="平台">
            <Input placeholder="如 Amazon US" />
          </Form.Item>
          <Form.Item name="estimatedCost" label="预估成本 (¥)">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="targetPrice" label="目标售价 ($)">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectListPage;
