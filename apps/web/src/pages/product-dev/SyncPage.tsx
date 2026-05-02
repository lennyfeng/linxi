import React, { useEffect, useState } from 'react';
import { Table, Tag, Button, Space, Typography, Spin, Modal, Form, Input, Select, message } from 'antd';
import { PlusOutlined, ReloadOutlined, SyncOutlined, CheckCircleOutlined, CloseCircleOutlined, ClockCircleOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/api/client';

interface SyncRecord {
  id: number;
  projectId: number;
  syncStatus: string;
  syncedBy: string | null;
  syncTime: string | null;
  resultMessage: string | null;
}

interface ProjectOption {
  id: number;
  projectCode: string;
  productName: string;
}

const syncStatusLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  pending: { label: '待同步', color: 'orange', icon: <ClockCircleOutlined /> },
  syncing: { label: '同步中', color: 'processing', icon: <SyncOutlined spin /> },
  success: { label: '已成功', color: 'green', icon: <CheckCircleOutlined /> },
  failed: { label: '已失败', color: 'red', icon: <CloseCircleOutlined /> },
  approval_passed: { label: '审批通过', color: 'green', icon: <CheckCircleOutlined /> },
  approval_rejected: { label: '审批驳回', color: 'red', icon: <CloseCircleOutlined /> },
};

const SyncPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SyncRecord[]>([]);
  const [projects, setProjects] = useState<ProjectOption[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [form] = Form.useForm();
  const [creating, setCreating] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [syncRes, projectRes] = await Promise.all([
        apiClient.get('/product-dev/sync-records'),
        apiClient.get('/product-dev/projects'),
      ]);
      setData(syncRes.data?.data?.items ?? syncRes.data?.data ?? []);
      setProjects(projectRes.data?.data?.items ?? projectRes.data?.data ?? []);
    } catch { message.error('加载同步数据失败'); }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleCreate = async () => {
    try {
      const values = await form.validateFields();
      setCreating(true);
      await apiClient.post('/product-dev/sync-records', values);
      setModalOpen(false);
      form.resetFields();
      message.success('同步记录已创建');
      await load();
    } catch { /* ignore */ }
    setCreating(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/product-dev/sync-records/${id}`);
      message.success('已删除');
      await load();
    } catch { message.error('删除失败'); }
  };

  const columns: ColumnsType<SyncRecord> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '项目', dataIndex: 'projectId', width: 180, render: (v: number) => {
      const project = projects.find((p) => p.id === v);
      return project ? `${project.projectCode} · ${project.productName}` : v;
    } },
    { title: '同步状态', dataIndex: 'syncStatus', width: 120,
      render: (v: string) => { const m = syncStatusLabels[v]; return m ? <Tag color={m.color} icon={m.icon}>{m.label}</Tag> : <Tag>{v}</Tag>; } },
    { title: '操作人', dataIndex: 'syncedBy', width: 100, render: (v: string) => v || '-' },
    { title: '同步时间', dataIndex: 'syncTime', width: 160, render: (v: string) => v ? v.replace('T', ' ').slice(0, 19) : '-' },
    { title: '结果消息', dataIndex: 'resultMessage', ellipsis: true, render: (v: string) => v || '-' },
    { title: '操作', key: 'actions', width: 80, render: (_: unknown, r: SyncRecord) => <Button size="small" type="link" danger onClick={() => handleDelete(r.id)}>删除</Button> },
  ];

  const statusStats: Record<string, number> = {};
  data.forEach((r) => { statusStats[r.syncStatus] = (statusStats[r.syncStatus] || 0) + 1; });

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>领星同步管理</Typography.Title>
        <Space>
          <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => setModalOpen(true)}>新增同步</Button>
        </Space>
      </div>

      <Space wrap style={{ marginBottom: 16 }}>
        {Object.entries(syncStatusLabels).map(([key, meta]) => (
          <Tag key={key} color={meta.color} icon={meta.icon}>{meta.label}: {statusStats[key] || 0}</Tag>
        ))}
      </Space>

      {loading ? <Spin /> : (
        <Table dataSource={data} columns={columns} rowKey="id" size="small"
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 条` }}
        />
      )}

      <Modal title="新增同步记录" open={modalOpen} onCancel={() => setModalOpen(false)} onOk={handleCreate} confirmLoading={creating}>
        <Form form={form} layout="vertical">
          <Form.Item name="projectId" label="项目ID" rules={[{ required: true }]}>
            <Select showSearch placeholder="选择项目" optionFilterProp="label" options={projects.map((p) => ({ value: p.id, label: `${p.projectCode} · ${p.productName}` }))} />
          </Form.Item>
          <Form.Item name="syncStatus" label="同步状态" initialValue="pending">
            <Select options={Object.entries(syncStatusLabels).map(([v, m]) => ({ value: v, label: m.label }))} />
          </Form.Item>
          <Form.Item name="syncedBy" label="操作人">
            <Input />
          </Form.Item>
          <Form.Item name="resultMessage" label="结果消息">
            <Input.TextArea rows={3} />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default SyncPage;
