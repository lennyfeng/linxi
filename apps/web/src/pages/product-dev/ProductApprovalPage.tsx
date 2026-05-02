import React, { useEffect, useState } from 'react';
import { Card, Table, Tag, Button, Space, Typography, Spin, message, Popconfirm, Input, Modal, Form } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, ReloadOutlined, SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';

interface Project {
  id: number;
  projectCode: string;
  productName: string;
  projectStatus: string;
  developerName: string | null;
  ownerName: string | null;
}

const ProductApprovalPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Project[]>([]);
  const [keyword, setKeyword] = useState('');
  const [rejectProject, setRejectProject] = useState<Project | null>(null);
  const [rejectForm] = Form.useForm();

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/product-dev/projects');
      const all: Project[] = res.data?.data?.items ?? res.data?.data ?? [];
      setData(all.filter((p) => p.projectStatus === '待立项审批'));
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const handleApprove = async (id: number) => {
    try {
      await apiClient.post(`/product-dev/projects/${id}/approve`, {});
      message.success('已审批通过');
      await load();
    } catch { message.error('审批失败'); }
  };

  const handleReject = async (id: number, reason: string) => {
    try {
      await apiClient.post(`/product-dev/projects/${id}/reject`, { reason });
      message.success('已驳回');
      setRejectProject(null);
      rejectForm.resetFields();
      await load();
    } catch { message.error('驳回失败'); }
  };

  const submitReject = async () => {
    if (!rejectProject) return;
    const values = await rejectForm.validateFields();
    await handleReject(rejectProject.id, values.reason);
  };

  const filtered = keyword
    ? data.filter((p) => p.productName?.toLowerCase().includes(keyword.toLowerCase()) || p.projectCode?.toLowerCase().includes(keyword.toLowerCase()))
    : data;

  const columns: ColumnsType<Project> = [
    { title: '编码', dataIndex: 'projectCode', width: 140 },
    { title: '产品名称', dataIndex: 'productName',
      render: (v: string, r: Project) => <a onClick={() => navigate(`/product-dev/projects/${r.id}`)}>{v}</a> },
    { title: '开发人', dataIndex: 'developerName', width: 100, render: (v: string) => v || '-' },
    { title: '负责人', dataIndex: 'ownerName', width: 100, render: (v: string) => v || '-' },
    { title: '状态', dataIndex: 'projectStatus', width: 110, render: (v: string) => <Tag color="orange">{v}</Tag> },
    { title: '操作', key: 'actions', width: 200,
      render: (_: unknown, r: Project) => (
        <Space>
          <Popconfirm title="确认审批通过？" onConfirm={() => handleApprove(r.id)} okText="通过" cancelText="取消">
            <Button size="small" type="primary" icon={<CheckCircleOutlined />}>通过</Button>
          </Popconfirm>
          <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => setRejectProject(r)}>驳回</Button>
        </Space>
      ),
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>审批中心</Typography.Title>
        <Space>
          <Input placeholder="搜索..." prefix={<SearchOutlined />} value={keyword} onChange={(e) => setKeyword(e.target.value)} allowClear style={{ width: 220 }} />
          <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
        </Space>
      </div>

      <Card size="small" style={{ marginBottom: 16 }}>
        <Typography.Text type="secondary">当前待审批项目：{filtered.length} 个</Typography.Text>
      </Card>

      {loading ? <Spin /> : (
        <Table dataSource={filtered} columns={columns} rowKey="id" size="small"
          pagination={{ pageSize: 20, showTotal: (t) => `共 ${t} 个待审批` }}
        />
      )}
      <Modal
        title={`驳回项目：${rejectProject?.productName || ''}`}
        open={!!rejectProject}
        onCancel={() => setRejectProject(null)}
        onOk={submitReject}
        okText="确认驳回"
        okButtonProps={{ danger: true }}
        cancelText="取消"
      >
        <Form form={rejectForm} layout="vertical">
          <Form.Item name="reason" label="驳回原因" rules={[{ required: true, message: '请输入驳回原因' }]}>
            <Input.TextArea rows={4} placeholder="请说明不通过原因，便于开发人调整后重新提交" />
          </Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProductApprovalPage;
