import React, { useEffect, useState } from 'react';
import { Descriptions, Tag, Tabs, Table, Button, Spin, Typography, Space, Input, InputNumber, Card, Row, Col, Statistic, Modal, Form, Select, Popconfirm, message, Progress } from 'antd';
import { ArrowLeftOutlined, EditOutlined, CheckCircleOutlined, CloseCircleOutlined, SwapRightOutlined, PlusOutlined, SyncOutlined, SaveOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { useNavigate, useParams } from 'react-router-dom';
import apiClient from '@/api/client';

interface Project {
  id: number; projectCode: string; productName: string; sku: string | null;
  developerName: string | null; ownerName: string | null;
  targetPlatform: string | null; targetMarket: string | null;
  estimatedCost: number | null; targetPrice: number | null; grossMarginTarget: number | null;
  projectStatus: string; createdAt: string;
}

interface PreSyncCheck {
  projectId: number;
  ready: boolean;
  errors: string[];
}

const STAGE_COLORS: Record<string, string> = {
  '待调研': '#D9D9D9', '调研中': '#1890FF', '选品完成': '#2F54EB',
  '打样中': '#13C2C2', '样品评审': '#722ED1', '报价中': '#EB2F96',
  '利润测算': '#FA541C', '审批中': '#FA8C16', '待推送': '#FADB14',
  '已推送': '#A0D911', '已上架': '#52C41A', '已终止': '#FF4D4F', '已归档': '#8C8C8C',
  '待报价': '#EB2F96', '待立项审批': '#FA8C16', '立项通过': '#52C41A',
  '打样通过': '#52C41A', '待同步': '#FADB14', '已同步领星': '#52C41A',
  '已驳回': '#FF4D4F', '打样失败': '#FF4D4F',
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  '待调研': ['待报价'],
  '待报价': ['待立项审批'],
  '待立项审批': ['立项通过', '已驳回'],
  '立项通过': ['打样中'],
  '已驳回': ['待调研'],
  '打样中': ['打样通过', '打样失败'],
  '打样通过': ['待同步'],
  '打样失败': ['打样中'],
  '待同步': ['已同步领星'],
  '已同步领星': [],
};

const PRE_SYNC_ERROR_LABELS: Record<string, string> = {
  missing_sku: '缺少 SKU',
  no_quotes: '无报价记录',
  no_profit_calculation: '无利润测算',
  no_passed_sample: '无通过评审的样品',
};

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [samples, setSamples] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [profits, setProfits] = useState<any[]>([]);
  const [syncs, setSyncs] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Project>>({});
  const [preSyncCheck, setPreSyncCheck] = useState<PreSyncCheck | null>(null);
  const [sampleModal, setSampleModal] = useState(false);
  const [quoteModal, setQuoteModal] = useState(false);
  const [profitModal, setProfitModal] = useState(false);
  const [sampleForm] = Form.useForm();
  const [quoteForm] = Form.useForm();
  const [profitForm] = Form.useForm();
  const [submitting, setSubmitting] = useState(false);

  const loadAll = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/product-dev/projects/${id}`);
      const payload = res.data?.data;
      const proj = payload?.project ?? payload ?? null;
      setProject(proj);
      setSamples(payload?.sampleRecords ?? payload?.samples ?? []);
      setQuotes(payload?.quotes ?? []);
      setProfits(payload?.profitCalculations ?? payload?.profits ?? []);
      setSyncs(payload?.syncRecords ?? payload?.syncs ?? []);
      if (proj) setEditForm({ ...proj });
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { loadAll(); }, [id]);

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!project) return <div style={{ padding: 24 }}><Typography.Text>未找到项目</Typography.Text></div>;

  const allowedTransitions = VALID_TRANSITIONS[project.projectStatus] || [];

  const doTransition = async (targetStatus: string) => {
    try {
      await apiClient.post(`/product-dev/projects/${project.id}/transition`, { targetStatus });
      message.success(`已流转到：${targetStatus}`);
      await loadAll();
    } catch (err: any) {
      const detail = err?.response?.data?.error?.detail;
      if (detail?.errors) {
        Modal.error({ title: '流转失败', content: detail.errors.map((e: string) => PRE_SYNC_ERROR_LABELS[e] || e).join('；') });
      } else {
        message.error(detail?.reason || '流转失败');
      }
    }
  };

  const doApprove = async () => {
    try {
      await apiClient.post(`/product-dev/projects/${project.id}/approve`);
      message.success('已审批通过');
      await loadAll();
    } catch { message.error('审批失败'); }
  };

  const doReject = async (reason: string) => {
    try {
      await apiClient.post(`/product-dev/projects/${project.id}/reject`, { reason });
      message.success('已驳回');
      await loadAll();
    } catch { message.error('驳回失败'); }
  };

  const checkPreSync = async () => {
    try {
      const res = await apiClient.get(`/product-dev/projects/${project.id}/pre-sync-check`);
      setPreSyncCheck(res.data?.data ?? null);
    } catch { message.error('检查失败'); }
  };

  const saveProject = async () => {
    setSaving(true);
    try {
      await apiClient.put(`/product-dev/projects/${project.id}`, editForm);
      message.success('项目已更新');
      setEditing(false);
      await loadAll();
    } catch { message.error('更新失败'); }
    setSaving(false);
  };

  const createSampleRecord = async () => {
    try {
      const values = await sampleForm.validateFields();
      setSubmitting(true);
      await apiClient.post('/product-dev/samples', { projectId: project.id, ...values });
      message.success('打样记录已添加');
      setSampleModal(false);
      sampleForm.resetFields();
      await loadAll();
    } catch { /* validation */ }
    setSubmitting(false);
  };

  const createQuoteRecord = async () => {
    try {
      const values = await quoteForm.validateFields();
      setSubmitting(true);
      await apiClient.post('/product-dev/quotes', { projectId: project.id, ...values });
      message.success('报价已添加');
      setQuoteModal(false);
      quoteForm.resetFields();
      await loadAll();
    } catch { /* validation */ }
    setSubmitting(false);
  };

  const createProfitRecord = async () => {
    try {
      const values = await profitForm.validateFields();
      setSubmitting(true);
      await apiClient.post('/product-dev/profit-calculations', { projectId: project.id, ...values });
      message.success('利润测算已添加');
      setProfitModal(false);
      profitForm.resetFields();
      await loadAll();
    } catch { /* validation */ }
    setSubmitting(false);
  };

  const sampleColumns: ColumnsType<any> = [
    { title: '轮次', dataIndex: 'roundNo', key: 'roundNo', width: 80 },
    { title: '供应商', dataIndex: 'supplierName', key: 'supplierName' },
    { title: '样品费', dataIndex: 'sampleFee', key: 'sampleFee', width: 100, render: (v: number) => v != null ? `¥${v}` : '-' },
    { title: '评审结果', dataIndex: 'reviewResult', key: 'reviewResult', width: 100, render: (v: string) => v === 'pass' ? <Tag color="success">通过</Tag> : v === 'fail' ? <Tag color="error">未通过</Tag> : <Tag>{v || '待评审'}</Tag> },
    { title: '改进说明', dataIndex: 'improvementNotes', key: 'improvementNotes', ellipsis: true },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 110, render: (v: string) => v?.split('T')[0] ?? '-' },
  ];

  const quoteColumns: ColumnsType<any> = [
    { title: '供应商', dataIndex: 'supplierName', key: 'supplierName' },
    { title: '报价', dataIndex: 'quotePrice', key: 'quotePrice', width: 100, align: 'right', render: (v: number) => v != null ? `¥${v}` : '-' },
    { title: '币种', dataIndex: 'currency', key: 'currency', width: 70 },
    { title: '起订量', dataIndex: 'moq', key: 'moq', width: 80 },
    { title: '交期', dataIndex: 'deliveryDays', key: 'deliveryDays', width: 90, render: (v: number) => v != null ? `${v}天` : '-' },
    { title: '含税', dataIndex: 'taxIncluded', key: 'taxIncluded', width: 70, render: (v: number) => v ? '是' : '否' },
    { title: '首选', dataIndex: 'preferred', key: 'preferred', width: 80, render: (v: number) => v ? <Tag color="green">是</Tag> : '-' },
  ];

  const profitColumns: ColumnsType<any> = [
    { title: '售价(USD)', dataIndex: 'salesPriceUsd', key: 'salesPriceUsd', width: 110, render: (v: number) => v != null ? `$${v}` : '-' },
    { title: '汇率', dataIndex: 'exchangeRate', key: 'exchangeRate', width: 80 },
    { title: '产品成本', dataIndex: 'productCostRmb', key: 'productCostRmb', width: 100, render: (v: number) => v != null ? `¥${v}` : '-' },
    { title: '配件成本', dataIndex: 'accessoryCostRmb', key: 'accessoryCostRmb', width: 100, render: (v: number) => v != null ? `¥${v}` : '-' },
    { title: '快递运费', dataIndex: 'shippingExpress', key: 'shippingExpress', width: 100, render: (v: number) => v != null ? `¥${v}` : '-' },
    { title: '空运运费', dataIndex: 'shippingAir', key: 'shippingAir', width: 100, render: (v: number) => v != null ? `¥${v}` : '-' },
    { title: '海运运费', dataIndex: 'shippingSea', key: 'shippingSea', width: 100, render: (v: number) => v != null ? `¥${v}` : '-' },
    { title: '选中利润', dataIndex: 'selectedProfit', key: 'selectedProfit', width: 100, render: (v: number) => v != null ? `$${v.toFixed(2)}` : '-' },
    { title: '利润率', dataIndex: 'selectedProfitRate', key: 'selectedProfitRate', width: 100, render: (v: number) => v != null ? `${(v * 100).toFixed(1)}%` : '-' },
  ];

  const syncColumns: ColumnsType<any> = [
    { title: '状态', dataIndex: 'syncStatus', key: 'syncStatus', width: 100, render: (v: string) => <Tag color={v === 'success' ? 'green' : v === 'failed' ? 'red' : 'default'}>{v}</Tag> },
    { title: '操作人', dataIndex: 'syncedBy', key: 'syncedBy', width: 100 },
    { title: '时间', dataIndex: 'syncTime', key: 'syncTime', width: 180 },
    { title: '结果', dataIndex: 'resultMessage', key: 'resultMessage', ellipsis: true },
  ];

  const stageProgress = (() => {
    const stages = ['待调研', '待报价', '待立项审批', '立项通过', '打样中', '打样通过', '待同步', '已同步领星'];
    const idx = stages.indexOf(project.projectStatus);
    if (idx < 0) return 0;
    return Math.round(((idx + 1) / stages.length) * 100);
  })();

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/product-dev/projects')}>返回</Button>
        <Typography.Title level={4} style={{ margin: 0 }}>{project.productName}</Typography.Title>
        <Tag color={STAGE_COLORS[project.projectStatus] || 'default'}>{project.projectStatus}</Tag>
        <Button size="small" icon={<EditOutlined />} onClick={() => navigate(`/product-dev/projects/${id}/edit`)}>完整编辑</Button>
      </Space>

      {/* Status & Actions Bar */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col span={8}>
            <Typography.Text type="secondary">流程进度</Typography.Text>
            <Progress percent={stageProgress} strokeColor={STAGE_COLORS[project.projectStatus]} size="small" style={{ marginTop: 4 }} />
          </Col>
          <Col span={16} style={{ textAlign: 'right' }}>
            <Space wrap>
              {allowedTransitions.map((target) => (
                <Popconfirm key={target} title={`确认流转到"${target}"？`} onConfirm={() => doTransition(target)}>
                  <Button size="small" icon={<SwapRightOutlined />} style={{ borderColor: STAGE_COLORS[target], color: STAGE_COLORS[target] }}>
                    流转到 {target}
                  </Button>
                </Popconfirm>
              ))}
              {project.projectStatus === '待立项审批' && (
                <>
                  <Button size="small" type="primary" icon={<CheckCircleOutlined />} onClick={doApprove}>审批通过</Button>
                  <Button size="small" danger icon={<CloseCircleOutlined />} onClick={() => { Modal.confirm({ title: '驳回项目', content: <Input.TextArea id="reject-reason" placeholder="驳回原因" />, okText: '确认驳回', okButtonProps: { danger: true }, cancelText: '取消', onOk: () => { const el = document.getElementById('reject-reason') as HTMLTextAreaElement; doReject(el?.value || ''); } }); }}>驳回</Button>
                </>
              )}
              {project.projectStatus === '待同步' && (
                <Button size="small" icon={<SyncOutlined />} onClick={checkPreSync}>同步前检查</Button>
              )}
            </Space>
          </Col>
        </Row>
        {preSyncCheck && (
          <div style={{ marginTop: 12 }}>
            {preSyncCheck.ready ? (
              <Typography.Text type="success">✅ 同步前检查通过，可以同步到领星</Typography.Text>
            ) : (
              <Typography.Text type="danger">❌ 未通过检查：{preSyncCheck.errors.map((e) => PRE_SYNC_ERROR_LABELS[e] || e).join('；')}</Typography.Text>
            )}
          </div>
        )}
      </Card>

      {/* Project Info */}
      <Card title="项目信息" size="small" style={{ marginBottom: 16 }} extra={<Button size="small" type="link" icon={<EditOutlined />} onClick={() => setEditing(true)}>编辑</Button>}>
        {editing ? (
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <Row gutter={16}>
              <Col span={8}>
                <Typography.Text type="secondary">产品名称</Typography.Text>
                <Input value={editForm.productName} onChange={(e) => setEditForm((prev) => ({ ...prev, productName: e.target.value }))} />
              </Col>
              <Col span={8}>
                <Typography.Text type="secondary">SKU</Typography.Text>
                <Input value={editForm.sku || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, sku: e.target.value }))} />
              </Col>
              <Col span={8}>
                <Typography.Text type="secondary">编码</Typography.Text>
                <Input value={editForm.projectCode} disabled />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Typography.Text type="secondary">开发人</Typography.Text>
                <Input value={editForm.developerName || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, developerName: e.target.value }))} />
              </Col>
              <Col span={8}>
                <Typography.Text type="secondary">负责人</Typography.Text>
                <Input value={editForm.ownerName || ''} onChange={(e) => setEditForm((prev) => ({ ...prev, ownerName: e.target.value }))} />
              </Col>
              <Col span={8}>
                <Typography.Text type="secondary">目标平台</Typography.Text>
                <Select value={editForm.targetPlatform || undefined} onChange={(v) => setEditForm((prev) => ({ ...prev, targetPlatform: v }))} options={[{ value: 'Amazon US', label: 'Amazon US' }, { value: 'Amazon EU', label: 'Amazon EU' }, { value: 'Amazon JP', label: 'Amazon JP' }, { value: 'Shopify', label: 'Shopify' }]} allowClear placeholder="选择平台" style={{ width: '100%' }} />
              </Col>
            </Row>
            <Row gutter={16}>
              <Col span={8}>
                <Typography.Text type="secondary">预估成本 (¥)</Typography.Text>
                <InputNumber min={0} precision={2} value={editForm.estimatedCost ?? undefined} onChange={(v) => setEditForm((prev) => ({ ...prev, estimatedCost: v ?? null }))} style={{ width: '100%' }} />
              </Col>
              <Col span={8}>
                <Typography.Text type="secondary">目标售价 ($)</Typography.Text>
                <InputNumber min={0} precision={2} value={editForm.targetPrice ?? undefined} onChange={(v) => setEditForm((prev) => ({ ...prev, targetPrice: v ?? null }))} style={{ width: '100%' }} />
              </Col>
              <Col span={8}>
                <Typography.Text type="secondary">目标毛利率 (%)</Typography.Text>
                <InputNumber min={0} max={100} precision={1} value={editForm.grossMarginTarget ?? undefined} onChange={(v) => setEditForm((prev) => ({ ...prev, grossMarginTarget: v ?? null }))} style={{ width: '100%' }} />
              </Col>
            </Row>
            <Space>
              <Button size="small" type="primary" icon={<SaveOutlined />} loading={saving} onClick={saveProject}>保存</Button>
              <Button size="small" onClick={() => { setEditing(false); setEditForm({ ...project }); }}>取消</Button>
            </Space>
          </Space>
        ) : (
          <Descriptions column={3} bordered size="small">
            <Descriptions.Item label="编码">{project.projectCode}</Descriptions.Item>
            <Descriptions.Item label="SKU">{project.sku || '-'}</Descriptions.Item>
            <Descriptions.Item label="阶段"><Tag color={STAGE_COLORS[project.projectStatus] || 'default'}>{project.projectStatus}</Tag></Descriptions.Item>
            <Descriptions.Item label="开发人">{project.developerName || '-'}</Descriptions.Item>
            <Descriptions.Item label="负责人">{project.ownerName || '-'}</Descriptions.Item>
            <Descriptions.Item label="平台">{project.targetPlatform || '-'}</Descriptions.Item>
            <Descriptions.Item label="市场">{project.targetMarket || '-'}</Descriptions.Item>
            <Descriptions.Item label="预估成本">{project.estimatedCost != null ? `¥${project.estimatedCost}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="目标售价">{project.targetPrice != null ? `$${project.targetPrice}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="目标利润率">{project.grossMarginTarget != null ? `${project.grossMarginTarget}%` : '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{project.createdAt?.split('T')[0] ?? '-'}</Descriptions.Item>
          </Descriptions>
        )}
      </Card>

      {/* Summary Stats */}
      <Row gutter={16} style={{ marginBottom: 16 }}>
        <Col span={6}><Card size="small"><Statistic title="打样轮次" value={samples.length} valueStyle={{ color: '#13c2c2' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="报价数" value={quotes.length} valueStyle={{ color: '#eb2f96' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="利润测算" value={profits.length} valueStyle={{ color: '#fa541c' }} /></Card></Col>
        <Col span={6}><Card size="small"><Statistic title="同步记录" value={syncs.length} valueStyle={{ color: '#52c41a' }} /></Card></Col>
      </Row>

      <Tabs defaultActiveKey="sampling" items={[
        { key: 'sampling', label: `打样 (${samples.length})`, children: (
          <Card extra={<Button size="small" icon={<PlusOutlined />} onClick={() => setSampleModal(true)}>添加打样</Button>}>
            <Table dataSource={samples} columns={sampleColumns} rowKey="id" size="small" pagination={false} locale={{ emptyText: '暂无打样记录' }} />
          </Card>
        )},
        { key: 'quoting', label: `报价 (${quotes.length})`, children: (
          <Card extra={<Button size="small" icon={<PlusOutlined />} onClick={() => setQuoteModal(true)}>添加报价</Button>}>
            <Table dataSource={quotes} columns={quoteColumns} rowKey="id" size="small" pagination={false} locale={{ emptyText: '暂无报价记录' }} />
          </Card>
        )},
        { key: 'profit', label: `利润测算 (${profits.length})`, children: (
          <Card extra={<Button size="small" icon={<PlusOutlined />} onClick={() => setProfitModal(true)}>添加测算</Button>}>
            <Table dataSource={profits} columns={profitColumns} rowKey="id" size="small" pagination={false} locale={{ emptyText: '暂无利润测算' }} />
          </Card>
        )},
        { key: 'sync', label: `领星同步 (${syncs.length})`, children: (
          <Card>
            <Table dataSource={syncs} columns={syncColumns} rowKey="id" size="small" pagination={false} locale={{ emptyText: '暂无同步记录' }} />
          </Card>
        )},
      ]} />

      {/* Sample Modal */}
      <Modal title="添加打样记录" open={sampleModal} onCancel={() => setSampleModal(false)} onOk={createSampleRecord} confirmLoading={submitting}>
        <Form form={sampleForm} layout="vertical">
          <Form.Item name="roundNo" label="轮次" initialValue={samples.length + 1}><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="supplierName" label="供应商" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="sampleFee" label="样品费 (¥)"><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="reviewResult" label="评审结果"><Select options={[{ value: 'pass', label: '通过' }, { value: 'fail', label: '未通过' }, { value: 'pending', label: '待评审' }]} allowClear placeholder="选择结果" /></Form.Item>
          <Form.Item name="improvementNotes" label="改进说明"><Input.TextArea rows={3} /></Form.Item>
        </Form>
      </Modal>

      {/* Quote Modal */}
      <Modal title="添加报价" open={quoteModal} onCancel={() => setQuoteModal(false)} onOk={createQuoteRecord} confirmLoading={submitting}>
        <Form form={quoteForm} layout="vertical">
          <Form.Item name="supplierName" label="供应商" rules={[{ required: true }]}><Input /></Form.Item>
          <Form.Item name="quotePrice" label="报价 (¥)" rules={[{ required: true }]}><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="currency" label="币种" initialValue="CNY"><Select options={[{ value: 'CNY', label: 'CNY' }, { value: 'USD', label: 'USD' }]} /></Form.Item>
          <Form.Item name="moq" label="起订量"><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="deliveryDays" label="交期(天)"><InputNumber min={1} style={{ width: '100%' }} /></Form.Item>
          <Form.Item name="taxIncluded" label="含税" initialValue={1}><Select options={[{ value: 1, label: '是' }, { value: 0, label: '否' }]} /></Form.Item>
          <Form.Item name="preferred" label="首选供应商" initialValue={0}><Select options={[{ value: 1, label: '是' }, { value: 0, label: '否' }]} /></Form.Item>
        </Form>
      </Modal>

      {/* Profit Modal */}
      <Modal title="添加利润测算" open={profitModal} onCancel={() => setProfitModal(false)} onOk={createProfitRecord} confirmLoading={submitting} width={640}>
        <Form form={profitForm} layout="vertical">
          <Row gutter={16}>
            <Col span={12}><Form.Item name="salesPriceUsd" label="售价 (USD)" rules={[{ required: true }]}><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="exchangeRate" label="汇率" rules={[{ required: true }]}><InputNumber min={0} precision={4} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}><Form.Item name="productCostRmb" label="产品成本 (¥)"><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={12}><Form.Item name="accessoryCostRmb" label="配件成本 (¥)"><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Row gutter={16}>
            <Col span={8}><Form.Item name="shippingExpress" label="快递运费 (¥)"><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="shippingAir" label="空运运费 (¥)"><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
            <Col span={8}><Form.Item name="shippingSea" label="海运运费 (¥)"><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item></Col>
          </Row>
          <Form.Item name="selectedPlan" label="选中方案"><Select options={[{ value: 'express', label: '快递' }, { value: 'air', label: '空运' }, { value: 'sea', label: '海运' }]} allowClear placeholder="选择方案" /></Form.Item>
        </Form>
      </Modal>
    </div>
  );
};

export default ProjectDetailPage;
