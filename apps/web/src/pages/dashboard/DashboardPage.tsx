import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Typography, Spin, List, Tag, Button } from 'antd';
import {
  DollarOutlined,
  ProjectOutlined,
  FileSearchOutlined,
  BellOutlined,
  SyncOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';

interface DashboardData {
  financial: { transactions: number; totalAmount: number };
  projects: { total: number; active: number };
  reconciliation: { purchaseOrders: number; invoices: number; relations: number };
  pendingApprovals: number;
  recentActivity: Array<{ id: number; action: string; module: string; entity_type: string; created_at: string }>;
  syncJobs: Array<{ name: string; status: string; last_run_at: string | null }>;
}

const DashboardPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardData | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const res = await apiClient.get('/dashboard');
        setData(res.data?.data ?? null);
      } catch { /* ignore */ }
      setLoading(false);
    })();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={4} style={{ marginBottom: 24 }}>工作台</Typography.Title>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card hoverable onClick={() => navigate('/ledger/transactions')} style={{ borderTop: '3px solid #1890FF' }}>
            <Statistic title="流水记录" value={data?.financial.transactions ?? 0} prefix={<DollarOutlined />} />
            <div style={{ color: '#8C8C8C', fontSize: 12, marginTop: 4 }}>
              总额: ¥{(data?.financial.totalAmount ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable onClick={() => navigate('/product-dev/projects')} style={{ borderTop: '3px solid #52C41A' }}>
            <Statistic title="活跃项目" value={data?.projects.active ?? 0} prefix={<ProjectOutlined />} suffix={`/ ${data?.projects.total ?? 0}`} />
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable onClick={() => navigate('/reconciliation')} style={{ borderTop: '3px solid #FA8C16' }}>
            <Statistic title="对账" value={data?.reconciliation.relations ?? 0} prefix={<FileSearchOutlined />} suffix="条链接" />
            <div style={{ color: '#8C8C8C', fontSize: 12, marginTop: 4 }}>
              {data?.reconciliation.purchaseOrders ?? 0} 采购单 · {data?.reconciliation.invoices ?? 0} 发票
            </div>
          </Card>
        </Col>
        <Col span={6}>
          <Card hoverable onClick={() => navigate('/approvals')} style={{ borderTop: '3px solid #722ED1' }}>
            <Statistic title="待审批" value={data?.pendingApprovals ?? 0} prefix={<BellOutlined />} valueStyle={{ color: (data?.pendingApprovals ?? 0) > 0 ? '#FF4D4F' : undefined }} />
          </Card>
        </Col>
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="最近动态" size="small" extra={<Button size="small" onClick={() => navigate('/audit-logs')}>查看全部</Button>}>
            {data?.recentActivity?.length ? (
              <List size="small" dataSource={data.recentActivity} renderItem={(a) => (
                <List.Item>
                  <span style={{ fontSize: 12 }}>
                    <Tag color="blue">{a.module}</Tag> {a.action} {a.entity_type ? `操作 ${a.entity_type}` : ''} — {a.created_at?.replace('T', ' ').slice(0, 19)}
                  </span>
                </List.Item>
              )} />
            ) : <Typography.Text type="secondary">暂无最近动态</Typography.Text>}
          </Card>
        </Col>
        <Col span={12}>
          <Card title="同步状态" size="small" extra={<Button size="small" icon={<SyncOutlined />} onClick={() => navigate('/reconciliation/sync')}>监控</Button>}>
            {data?.syncJobs?.length ? (
              <List size="small" dataSource={data.syncJobs} renderItem={(j) => (
                <List.Item>
                  <span>{j.name}</span>
                  <Tag color={j.status === 'idle' ? 'green' : j.status === 'running' ? 'blue' : j.status === 'failed' ? 'red' : 'default'}>{j.status}</Tag>
                </List.Item>
              )} />
            ) : <Typography.Text type="secondary">暂无同步任务</Typography.Text>}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default DashboardPage;
