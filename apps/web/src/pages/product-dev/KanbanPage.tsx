import React, { useEffect, useState, useRef } from 'react';
import { Card, Tag, Typography, Spin, Popover, Button, Space, Input } from 'antd';
import { SearchOutlined, UnorderedListOutlined } from '@ant-design/icons';
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
  '待调研', '调研中', '选品完成', '打样中', '样品评审', '报价中',
  '利润测算', '审批中', '待推送', '已推送', '已上架', '已终止', '已归档',
];

const stageColors: Record<string, string> = {
  '待调研': '#D9D9D9', '调研中': '#1890FF', '选品完成': '#2F54EB',
  '打样中': '#13C2C2', '样品评审': '#722ED1', '报价中': '#EB2F96',
  '利润测算': '#FA541C', '审批中': '#FA8C16', '待推送': '#FADB14',
  '已推送': '#A0D911', '已上架': '#52C41A', '已终止': '#FF4D4F', '已归档': '#8C8C8C',
};

const KanbanPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);
  const [keyword, setKeyword] = useState('');
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await apiClient.get('/product-dev/projects');
        setProjects(res.data?.data?.items ?? res.data?.data ?? []);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  const filtered = keyword
    ? projects.filter((p) => p.productName?.toLowerCase().includes(keyword.toLowerCase()) || p.projectCode?.toLowerCase().includes(keyword.toLowerCase()))
    : projects;

  const byStage = STAGES.map((stage) => ({
    stage,
    items: filtered.filter((p) => p.projectStatus === stage),
  }));

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

      <div ref={scrollRef} style={{ flex: 1, overflowX: 'auto', overflowY: 'hidden', display: 'flex', gap: 12 }}>
        {byStage.map(({ stage, items }) => (
          <div key={stage} style={{ minWidth: 220, maxWidth: 260, flex: '0 0 auto', display: 'flex', flexDirection: 'column' }}>
            <div style={{ padding: '8px 12px', background: stageColors[stage] || '#D9D9D9', borderRadius: '6px 6px 0 0', color: '#FFF', fontWeight: 600, fontSize: 13, display: 'flex', justifyContent: 'space-between' }}>
              <span>{stage}</span>
              <Tag style={{ marginRight: 0 }}>{items.length}</Tag>
            </div>
            <div style={{ flex: 1, background: '#FAFAFA', borderRadius: '0 0 6px 6px', padding: 8, overflowY: 'auto', minHeight: 200 }}>
              {items.map((p) => (
                <Popover
                  key={p.id}
                  mouseEnterDelay={0.5}
                  content={
                    <div style={{ maxWidth: 240, fontSize: 12 }}>
                      <div><strong>成本:</strong> {p.estimatedCost != null ? `¥${p.estimatedCost}` : '-'}</div>
                      <div><strong>目标:</strong> {p.targetPrice != null ? `$${p.targetPrice}` : '-'}</div>
                      <div><strong>利润率:</strong> {p.grossMarginTarget != null ? `${p.grossMarginTarget}%` : '-'}</div>
                      <div style={{ fontSize: 10, color: '#bbb' }}>开发人: {p.developerName || '-'}</div>
                    </div>
                  }
                >
                  <Card
                    size="small"
                    hoverable
                    onClick={() => navigate(`/product-dev/projects/${p.id}`)}
                    style={{ marginBottom: 8, borderLeft: `3px solid ${stageColors[stage] || '#D9D9D9'}` }}
                    bodyStyle={{ padding: '8px 10px' }}
                  >
                    <div style={{ fontSize: 11, color: '#999' }}>成本: ¥{p.estimatedCost?.toFixed(2) ?? '-'}</div>
                    <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 2 }}>{p.productName}</div>
                    <div style={{ color: '#8C8C8C', fontSize: 11 }}>{p.projectCode}{p.sku ? ` · ${p.sku}` : ''}</div>
                    {p.grossMarginTarget != null && <div style={{ fontSize: 11, color: '#999' }}>利润率: {(p.grossMarginTarget * 100).toFixed(0)}%</div>}
                  </Card>
                </Popover>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default KanbanPage;
