import React, { useEffect, useState, useMemo } from 'react';
import { Table, Tag, Input, Button, Space, Typography, Spin, Modal, Form, InputNumber, Card, Row, Col, Statistic, Select, Popconfirm, message } from 'antd';
import { PlusOutlined, SearchOutlined, AppstoreOutlined, DeleteOutlined, ReloadOutlined, DownloadOutlined } from '@ant-design/icons';
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
  '待报价': 'purple', '待立项审批': 'orange', '立项通过': 'green',
  '打样通过': 'green', '待同步': 'gold', '已同步领星': 'green',
  '已驳回': 'red', '打样失败': 'red',
};

const STAGE_OPTIONS = [
  '待调研', '待报价', '待立项审批', '立项通过', '打样中', '打样通过', '待同步', '已同步领星', '已驳回', '打样失败',
];

const ProjectListPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Project[]>([]);
  const [keyword, setKeyword] = useState('');
  const [stageFilter, setStageFilter] = useState<string | undefined>(undefined);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
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

  const filtered = useMemo(() => {
    let result = data;
    if (keyword) {
      const kw = keyword.toLowerCase();
      result = result.filter((r) => r.productName?.toLowerCase().includes(kw) || r.projectCode?.toLowerCase().includes(kw) || r.sku?.toLowerCase().includes(kw));
    }
    if (stageFilter) {
      result = result.filter((r) => r.projectStatus === stageFilter);
    }
    return result;
  }, [data, keyword, stageFilter]);

  const stageStats = useMemo(() => {
    const map: Record<string, number> = {};
    data.forEach((p) => { map[p.projectStatus] = (map[p.projectStatus] || 0) + 1; });
    return map;
  }, [data]);

  const handleBatchDelete = async () => {
    try {
      await Promise.all(selectedRowKeys.map((key) => apiClient.delete(`/product-dev/projects/${key}`)));
      message.success(`已删除 ${selectedRowKeys.length} 个项目`);
      setSelectedRowKeys([]);
      await load();
    } catch { message.error('部分项目删除失败'); }
  };

  const handleExport = () => {
    if (!filtered.length) { message.warning('无数据可导出'); return; }
    const headers = ['编码', '产品名称', 'SKU', '开发人', '阶段', '预估成本', '目标售价', '利润率', '创建时间'];
    const rows = filtered.map((r) => [r.projectCode, r.productName, r.sku || '', r.developerName || '', r.projectStatus, r.estimatedCost ?? '', r.targetPrice ?? '', r.grossMarginTarget ?? '', r.createdAt?.split('T')[0] ?? '']);
    const csv = [headers, ...rows].map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `projects_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    message.success('导出成功');
  };

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
    { title: '利润率', dataIndex: 'grossMarginTarget', key: 'grossMarginTarget', width: 80, align: 'right',
      render: (v: number | null) => v != null ? `${Number(v)}%` : '-' },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 110,
      render: (v: string) => v?.split('T')[0] ?? '-' },
  ];

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>产品开发</Typography.Title>
        <Space>
          <Input placeholder="搜索..." prefix={<SearchOutlined />} value={keyword} onChange={(e) => setKeyword(e.target.value)} allowClear style={{ width: 220 }} />
          <Select allowClear placeholder="阶段筛选" value={stageFilter} onChange={setStageFilter} style={{ width: 140 }}
            options={STAGE_OPTIONS.map((s) => ({ value: s, label: `${s} (${stageStats[s] || 0})` }))} />
          <Button icon={<ReloadOutlined />} onClick={load}>刷新</Button>
          <Button icon={<DownloadOutlined />} onClick={handleExport}>导出</Button>
          <Button icon={<AppstoreOutlined />} onClick={() => navigate('/product-dev/kanban')}>看板</Button>
          <Button icon={<PlusOutlined />} onClick={() => setQuickModal(true)}>快速创建</Button>
          <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/product-dev/projects/new')}>完整创建</Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="项目总数" value={data.length} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="待立项审批" value={stageStats['待立项审批'] || 0} valueStyle={{ color: '#fa8c16' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="打样中" value={stageStats['打样中'] || 0} valueStyle={{ color: '#13c2c2' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="已同步领星" value={stageStats['已同步领星'] || 0} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>

      {selectedRowKeys.length > 0 && (
        <div style={{ marginBottom: 12 }}>
          <Space>
            <Typography.Text>已选 {selectedRowKeys.length} 项</Typography.Text>
            <Popconfirm title={`确认删除 ${selectedRowKeys.length} 个项目？`} onConfirm={handleBatchDelete}>
              <Button size="small" danger icon={<DeleteOutlined />}>批量删除</Button>
            </Popconfirm>
            <Button size="small" onClick={() => setSelectedRowKeys([])}>取消选择</Button>
          </Space>
        </div>
      )}

      {loading ? <Spin /> : (
        <Table dataSource={filtered} columns={columns} rowKey="id" size="small"
          rowSelection={{ selectedRowKeys, onChange: setSelectedRowKeys }}
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
