import React, { useEffect, useState } from 'react';
import { Card, Col, Row, Statistic, Alert, Button, Space, Spin, Typography, List } from 'antd';
import {
  ShoppingCartOutlined,
  DollarOutlined,
  CarOutlined,
  FileTextOutlined,
  SyncOutlined,
  ArrowRightOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';

interface StatsData {
  summary: {
    purchaseOrders: number;
    paymentRequests: number;
    deliveryOrders: number;
    invoices: number;
    totalPOAmount: number;
    totalInvoiceAmount: number;
    gap: number;
  };
}

interface AlertItem {
  type: string;
  severity: string;
  message: string;
  count: number;
}

const OverviewPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<StatsData | null>(null);
  const [alerts, setAlerts] = useState<AlertItem[]>([]);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [reportRes, alertRes] = await Promise.all([
        apiClient.get('/reconciliation/reports'),
        apiClient.get('/reconciliation/alerts'),
      ]);
      setStats(reportRes.data?.data ?? null);
      setAlerts(alertRes.data?.data?.alerts ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleSyncAll = async () => {
    setSyncing(true);
    try {
      await Promise.all([
        apiClient.post('/reconciliation/sync/suppliers', {}),
        apiClient.post('/reconciliation/sync/purchase-orders', {}),
        apiClient.post('/reconciliation/sync/payment-requests', {}),
        apiClient.post('/reconciliation/sync/delivery-orders', {}),
      ]);
      await loadData();
    } catch { /* ignore */ }
    setSyncing(false);
  };

  const cards = [
    { title: '采购单', value: stats?.summary.purchaseOrders ?? 0, icon: <ShoppingCartOutlined />, color: '#1890FF', path: '/reconciliation/purchase-orders' },
    { title: '请款单', value: stats?.summary.paymentRequests ?? 0, icon: <DollarOutlined />, color: '#52C41A', path: '/reconciliation/payment-requests' },
    { title: '发货单', value: stats?.summary.deliveryOrders ?? 0, icon: <CarOutlined />, color: '#FA8C16', path: '/reconciliation/delivery-orders' },
    { title: '发票', value: stats?.summary.invoices ?? 0, icon: <FileTextOutlined />, color: '#722ED1', path: '/reconciliation/invoices' },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;

  return (
    <div style={{ padding: 24 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Typography.Title level={4} style={{ margin: 0 }}>对账总览</Typography.Title>
        <Space>
          <Button icon={<SyncOutlined spin={syncing} />} onClick={handleSyncAll} loading={syncing}>
            全部同步
          </Button>
          <Button type="primary" icon={<ArrowRightOutlined />} onClick={() => navigate('/reconciliation/workspace')}>
            开始匹配
          </Button>
        </Space>
      </div>

      <Row gutter={16} style={{ marginBottom: 24 }}>
        {cards.map((c) => (
          <Col span={6} key={c.title}>
            <Card hoverable onClick={() => navigate(c.path)} style={{ borderTop: `3px solid ${c.color}` }}>
              <Statistic title={c.title} value={c.value} prefix={c.icon} />
            </Card>
          </Col>
        ))}
      </Row>

      <Row gutter={16}>
        <Col span={12}>
          <Card title="金额汇总" size="small">
            <Statistic title="采购单总额" value={stats?.summary.totalPOAmount ?? 0} precision={2} prefix="¥" />
            <Statistic title="发票总额" value={stats?.summary.totalInvoiceAmount ?? 0} precision={2} prefix="¥" style={{ marginTop: 12 }} />
            <Statistic
              title="差额"
              value={stats?.summary.gap ?? 0}
              precision={2}
              prefix="¥"
              valueStyle={{ color: (stats?.summary.gap ?? 0) > 0 ? '#FF4D4F' : '#52C41A' }}
              style={{ marginTop: 12 }}
            />
          </Card>
        </Col>
        <Col span={12}>
          <Card title="告警" size="small">
            {alerts.length === 0 ? (
              <Typography.Text type="secondary">暂无告警</Typography.Text>
            ) : (
              <List
                size="small"
                dataSource={alerts}
                renderItem={(a) => (
                  <List.Item>
                    <Alert
                      type={a.severity === 'warning' ? 'warning' : 'info'}
                      message={a.message}
                      showIcon
                      style={{ width: '100%' }}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OverviewPage;
