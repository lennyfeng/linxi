import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Typography, Spin, Modal, Form, Input, InputNumber, Select, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/api/client';

interface Sample {
  id: number;
  projectId: number;
  roundNo: number;
  supplierName: string | null;
  sampleFee: number | null;
  reviewResult: string | null;
  improvementNotes: string | null;
}

interface ProjectOption {
  id: number;
  projectCode: string;
  productName: string;
}

const reviewResultLabels: Record<string, { label: string; color: string }> = {
  pass: { label: '通过', color: 'green' },
  fail: { label: '未通过', color: 'red' },
  pending: { label: '待评审', color: 'orange' },
  conditional: { label: '有条件通过', color: 'blue' },
};

const SamplesPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Sample[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [sampleRes, projectRes] = await Promise.all([
        apiClient.get('/product-dev/samples'),
        apiClient.get('/product-dev/projects'),
      ]);
      setData(sampleRes.data?.data?.items ?? sampleRes.data?.data ?? []);
      setProjects(projectRes.data?.data?.items ?? projectRes.data?.data ?? []);
    } catch { message.error('加载打样数据失败'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);
      await apiClient.post('/product-dev/samples', values);
      setModalOpen(false);
      form.resetFields();
      message.success('打样记录已创建');
      await load();
    } catch { /* ignore */ }
    setCreating(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/product-dev/samples/${id}`);
      message.success('已删除');
      await load();
    } catch { message.error('删除失败'); }
  };

  const columns: ColumnsType<Sample> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '项目', dataIndex: 'projectId', width: 180, render: (v: number) => {
      const project = projects.find((p) => p.id === v);
      return project ? `${project.projectCode} · ${project.productName}` : v;
    } },
    { title: '轮次', dataIndex: 'roundNo', width: 70 },
    { title: '供应商', dataIndex: 'supplierName', width: 140, render: (v: string) => v || '-' },
    { title: '打样费', dataIndex: 'sampleFee', width: 100, align: 'right', render: (v: number) => v != null ? `¥${Number(v).toFixed(2)}` : '-' },
    { title: '评审结果', dataIndex: 'reviewResult', width: 110,
      render: (v: string) => { const m = reviewResultLabels[v]; return m ? <Tag color={m.color}>{m.label}</Tag> : v ? <Tag>{v}</Tag> : '-'; } },
    { title: '改进意见', dataIndex: 'improvementNotes', ellipsis: true, render: (v: string) => v || '-' },
    { title: '操作', key: 'actions', width: 80, render: (_: unknown, r: Sample) => <Button size="small" type="link" danger onClick={() => handleDelete(r.id)}>删除</Button> },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>打样管理</Typography.Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新增打样</Button>
        </Space>
      </div>

      {loading ? <Spin /> : (
        <Table dataSource={data} columns={columns} rowKey="id" size="small"
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
        />
      )}

      <Modal title="新增打样记录" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleCreate} confirmLoading={creating}>
        <Form form={form} layout="vertical">
          <Form.Item name="projectId" label="项目ID" rules={[{ required: true }]}>
            <Select showSearch placeholder="选择项目" optionFilterProp="label" options={projects.map((p) => ({ value: p.id, label: `${p.projectCode} · ${p.productName}` }))} />
          </Form.Item>
          <Form.Item name="roundNo" label="轮次" initialValue={1}>
            <InputNumber min={1} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="supplierName" label="供应商名称">
            <Input />
          </Form.Item>
          <Form.Item name="sampleFee" label="打样费 (¥)">
            <InputNumber min={0} precision={2} style={{ width: '100%' }} />
          </Form.Item>
          <Form.Item name="reviewResult" label="评审结果">
            <Select allowClear placeholder="选择评审结果" options={Object.entries(reviewResultLabels).map(([v, m]) => ({ value: v, label: m.label }))} />
          </Form.Item>
          <Form.Item name="improvementNotes" label="改进意见">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SamplesPage;
