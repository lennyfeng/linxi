import React, { useEffect, useState, useRef, useCallback } from 'react';
import { Card, Tag, Typography, Spin, Popover, Button, Space, Input, message, Popconfirm, Row, Col, Statistic } from 'antd';
import { SearchOutlined, UnorderedListOutlined, SwapRightOutlined } from '@ant-design/icons';
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

const STAGES = [
  '待调研', '待报价', '待立项审批', '立项通过', '打样中', '打样通过', '待同步', '已同步领星',
];

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

const stageColors: Record<string, string> = {
  '待调研': '#D9D9D9', '待报价': '#EB2F96', '待立项审批': '#FA8C16',
  '立项通过': '#52C41A', '打样中': '#13C2C2', '打样通过': '#52C41A',
  '待同步': '#FADB14', '已同步领星': '#52C41A',
  '已驳回': '#FF4D4F', '打样失败': '#FF4D4F',
};

const KanbanPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [keyword, setKeyword] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragOverStage, setDragOverStage] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/product-dev/projects');
      setProjects(res.data?.data?.items ?? res.data?.data ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const filtered = keyword
    ? projects.filter((p) => p.productName?.toLowerCase().includes(keyword.toLowerCase()) || p.projectCode?.toLowerCase().includes(keyword.toLowerCase()))
    : projects;

  const byStage = STAGES.map((stage) => ({
    stage,
    items: filtered.filter((p) => p.projectStatus === stage),
  }));

  const doTransition = async (projectId: number, targetStatus: string) => {
    try {
      await apiClient.post(`/product-dev/projects/${projectId}/transition`, { targetStatus });
      message.success(`已流转到：${targetStatus}`);
      await load();
    } catch (err: any) {
      const detail = err?.response?.data?.error?.detail;
      message.error(detail?.reason || '流转失败');
    }
  };

  const onDragStart = useCallback((e: React.DragEvent, projectId: number) => {
    e.dataTransfer.setData('projectId', String(projectId));
    e.dataTransfer.effectAllowed = 'move';
  }, []);

  const onDragOver = useCallback((e: React.DragEvent, stage: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    setDragOverStage(stage);
  }, []);

  const onDragLeave = useCallback(() => {
    setDragOverStage(null);
  }, []);

  const onDrop = useCallback(async (e: React.DragEvent, targetStage: string) => {
    e.preventDefault();
    setDragOverStage(null);
    const projectId = Number(e.dataTransfer.getData('projectId'));
    if (!projectId) return;
    const project = projects.find((p) => p.id === projectId);
    if (!project) return;
    const allowed = VALID_TRANSITIONS[project.projectStatus] || [];
    if (!allowed.includes(targetStage)) {
      message.warning(`不可从"${project.projectStatus}"流转到"${targetStage}"`);
      return;
    }
    await doTransition(projectId, targetStage);
  }, [projects]);

  const totalCount = filtered.length;
  const statsByStage = STAGES.reduce<Record<string, number>>((acc, s) => { acc[s] = filtered.filter((p) => p.projectStatus === s).length; return acc; }, {});

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ padding: 24, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>看板</Typography.Title>
        <Space>
          <Input placeholder="搜索..." prefix={<SearchOutlined />} value={keyword} onChange={(e) => setKeyword(e.target.value)} allowClear style={{ width: 200 }} />
          <Button icon={<UnorderedListOutlined />} onClick={() => navigate('/product-dev/projects')}>列表视图</Button>
        </Space>
      </div>

      <Row gutter={8} style={{ marginBottom: 12 }}>
        <Col><Card size="small" style={{ padding: '4px 12px' }}><Statistic title="总计" value={totalCount} valueStyle={{ fontSize: 16 }} /></Card></Col>
        {STAGES.slice(0, 4).map((s) => (
          <Col key={s}><Card size="small" style={{ padding: '4px 12px' }}><Statistic title={s} value={statsByStage[s] || 0} valueStyle={{ fontSize: 16, color: stageColors[s] }} /></Card></Col>
        ))}
      </Row>

      <div ref={scrollRef} style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', display: 'flex', gap: 12 }}>
        {byStage.map(({ stage, items }) => (
          <div
            key={stage}
            onDragOver={(e) => onDragOver(e, stage)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, stage)}
            style={{
              minWidth: 220, maxWidth: 260, flex: '0 0 auto', display: 'flex', flexDirection: 'column',
              outline: dragOverStage === stage ? `2px dashed ${stageColors[stage]}` : 'none',
              borderRadius: 6,
            }}
          >
            <div style={{ padding: '8px 12px', background: stageColors[stage] || '#D9D9D9', borderRadius: '6px 6px 0 0', color: '#FFF', fontWeight: 600, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
              <span>{stage}</span>
              <Tag style={{ marginRight: 0 }}>{items.length}</Tag>
            </div>
            <div style={{ flex: 1, background: dragOverStage === stage ? '#E6F7FF' : '#FAFAFA', borderRadius: '0 0 6px 6px', padding: 8, overflowY: 'auto', minHeight: 200 }}>
              {items.map((p) => {
                const allowed = VALID_TRANSITIONS[p.projectStatus] || [];
                return (
                  <Popover
                    key={p.id}
                    mouseEnterDelay={0.5}
                    content={
                      <div style={{ maxWidth: 260, fontSize: 12 }}>
                        <div><strong>成本:</strong> {p.estimatedCost != null ? `¥${p.estimatedCost}` : '-'}</div>
                        <div><strong>目标:</strong> {p.targetPrice != null ? `$${p.targetPrice}` : '-'}</div>
                        <div><strong>利润率:</strong> {p.grossMarginTarget != null ? `${p.grossMarginTarget}%` : '-'}</div>
                        <div style={{ fontSize: 10, color: '#bbb' }}>开发人: {p.developerName || '-'}</div>
                        {allowed.length > 0 && (
                          <div style={{ marginTop: 8 }}>
                            <Typography.Text type="secondary" style={{ fontSize: 11 }}>快速流转：</Typography.Text>
                            <Space size={4} wrap style={{ marginTop: 4 }}>
                              {allowed.map((target) => (
                                <Popconfirm key={target} title={`流转到"${target}"？`} onConfirm={() => doTransition(p.id, target)}>
                                  <Button size="small" type="dashed" icon={<SwapRightOutlined />} style={{ fontSize: 11, padding: '0 6px' }}>{target}</Button>
                                </Popconfirm>
                              ))}
                            </Space>
                          </div>
                        )}
                      </div>
                    }
                  >
                    <Card
                      size="small"
                      hoverable
                      draggable
                      onDragStart={(e) => onDragStart(e, p.id)}
                      onClick={() => navigate(`/product-dev/projects/${p.id}`)}
                      style={{ marginBottom: 8, borderLeft: `3px solid ${stageColors[stage] || '#D9D9D9'}`, cursor: 'grab' }}
                      bodyStyle={{ padding: '8px 10px' }}
                    >
                      <div style={{ fontSize: 11, color: '#999' }}>成本: ¥{p.estimatedCost?.toFixed(2) ?? '-'}</div>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{p.productName}</div>
                      <div style={{ color: '#8C8C8C', fontSize: 11 }}>{p.projectCode}{p.sku ? ` · ${p.sku}` : ''}</div>
                      {p.grossMarginTarget != null && <div style={{ fontSize: 11, color: '#999' }}>利润率: {Number(p.grossMarginTarget).toFixed(0)}%</div>}
                    </Card>
                  </Popover>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanPage;
