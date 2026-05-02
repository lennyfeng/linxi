import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, Spin, Tag, Table, Space, Button } from 'antd';
import { useNavigate } from 'react-router-dom';
import { AppstoreOutlined, CheckCircleOutlined, SyncOutlined, ClockCircleOutlined, WarningOutlined } from '@ant-design/icons';
import apiClient from '@/api/client';

interface Project {
  id: number;
  projectCode: string;
  productName: string;
  projectStatus: string;
  developerName: string | null;
  createdAt: string;
}

const stageColors: Record<string, string> = {
  '待调研': 'default', '待报价': 'purple', '待立项审批': 'orange',
  '立项通过': 'green', '打样中': 'cyan', '打样通过': 'green',
  '待同步': 'gold', '已同步领星': 'green', '已驳回': 'red', '打样失败': 'red',
};

const ProductDevOverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    setLoading(true);
    apiClient.get('/product-dev/projects')
      .then((res) => setProjects(res.data?.data?.items ?? res.data?.data ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const stageStats: Record<string, number> = {};
  projects.forEach((p) => { stageStats[p.projectStatus] = (stageStats[p.projectStatus] || 0) + 1; });

  const pendingApproval = stageStats['待立项审批'] || 0;
  const sampling = stageStats['打样中'] || 0;
  const synced = stageStats['已同步领星'] || 0;
  const rejected = stageStats['已驳回'] || 0;
  const failed = stageStats['打样失败'] || 0;

  const recentProjects = [...projects].slice(0, 5);

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={4}>新品开发总览</Typography.Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={4}><Card hoverable onClick={() => navigate('/product-dev/projects')}><Statistic title="项目总数" value={projects.length} prefix={<AppstoreOutlined />} /></Card></Col>
        <Col span={4}><Card hoverable onClick={() => navigate('/product-dev/approvals')}><Statistic title="待立项审批" value={pendingApproval} prefix={<ClockCircleOutlined />} valueStyle={{ color: pendingApproval ? '#fa8c16' : undefined }} /></Card></Col>
        <Col span={4}><Card hoverable onClick={() => navigate('/product-dev/samples')}><Statistic title="打样中" value={sampling} prefix={<SyncOutlined />} valueStyle={{ color: '#13c2c2' }} /></Card></Col>
        <Col span={4}><Card hoverable onClick={() => navigate('/product-dev/sync')}><Statistic title="已同步领星" value={synced} prefix={<CheckCircleOutlined />} valueStyle={{ color: '#52c41a' }} /></Card></Col>
        <Col span={4}><Card><Statistic title="已驳回" value={rejected} prefix={<WarningOutlined />} valueStyle={{ color: rejected ? '#ff4d4f' : undefined }} /></Card></Col>
        <Col span={4}><Card><Statistic title="打样失败" value={failed} prefix={<WarningOutlined />} valueStyle={{ color: failed ? '#ff4d4f' : undefined }} /></Card></Col>
      </Row>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={12}>
          <Card title="阶段分布" size="small">
            <Space wrap>
              {Object.entries(stageStats).map(([stage, count]) => (
                <Tag key={stage} color={stageColors[stage] || 'default'} style={{ fontSize: 13, padding: '4px 10px' }}>{stage}: {count}</Tag>
              ))}
            </Space>
          </Card>
        </Col>
        <Col span={12}>
          <Card title="入口中心" size="small">
            <Space wrap>
              <Button type="primary" onClick={() => navigate('/product-dev/projects/new')}>新建项目</Button>
              <Button onClick={() => navigate('/product-dev/projects')}>项目管理</Button>
              <Button onClick={() => navigate('/product-dev/kanban')}>流程看板</Button>
              <Button onClick={() => navigate('/product-dev/asin-opportunities')}>ASIN机会分析</Button>
              <Button onClick={() => navigate('/product-dev/quotes')}>报价管理</Button>
              <Button onClick={() => navigate('/product-dev/samples')}>打样管理</Button>
              <Button onClick={() => navigate('/product-dev/profit')}>利润试算</Button>
              <Button onClick={() => navigate('/product-dev/approvals')}>审批中心</Button>
              <Button onClick={() => navigate('/product-dev/sync')}>领星同步</Button>
            </Space>
          </Card>
        </Col>
      </Row>

      <Card title="最近项目" size="small" extra={<Button type="link" onClick={() => navigate('/product-dev/projects')}>查看全部</Button>}>
        <Table dataSource={recentProjects} rowKey="id" size="small" pagination={false}
          columns={[
            { title: '编码', dataIndex: 'projectCode', width: 140 },
            { title: '产品名称', dataIndex: 'productName',
              render: (v: string, r: Project) => <a onClick={() => navigate(`/product-dev/projects/${r.id}`)}>{v}</a> },
            { title: '阶段', dataIndex: 'projectStatus', width: 120,
              render: (v: string) => <Tag color={stageColors[v] || 'default'}>{v}</Tag> },
            { title: '开发人', dataIndex: 'developerName', width: 100, render: (v: string) => v || '-' },
            { title: '创建时间', dataIndex: 'createdAt', width: 110, render: (v: string) => v?.split('T')[0] ?? '-' },
          ]}
        />
      </Card>
    </div>
  );
};

export default ProductDevOverviewPage;
