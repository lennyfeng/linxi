import React, { useEffect, useState } from 'react';
import { Descriptions, Tag, Tabs, Table, Button, Spin, Typography, Space } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
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

const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [samples, setSamples] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [profits, setProfits] = useState<any[]>([]);
  const [syncs, setSyncs] = useState<any[]>([]);

  useEffect(() => {
    if (id) loadAll();
  }, [id]);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [pRes, sRes, qRes, prRes, syRes] = await Promise.all([
        apiClient.get(`/product-dev/projects/${id}`),
        apiClient.get(`/product-dev/projects/${id}/samples`),
        apiClient.get(`/product-dev/projects/${id}/quotes`),
        apiClient.get(`/product-dev/projects/${id}/profit-calculations`),
        apiClient.get(`/product-dev/projects/${id}/sync-records`),
      ]);
      setProject(pRes.data?.data ?? null);
      setSamples(sRes.data?.data?.items ?? sRes.data?.data ?? []);
      setQuotes(qRes.data?.data?.items ?? qRes.data?.data ?? []);
      setProfits(prRes.data?.data?.items ?? prRes.data?.data ?? []);
      setSyncs(syRes.data?.data?.items ?? syRes.data?.data ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!project) return <div style={{ padding: 24 }}><Typography.Text>未找到项目</Typography.Text></div>;

  const sampleColumns: ColumnsType<any> = [
    { title: '轮次', dataIndex: 'roundNumber', key: 'roundNumber', width: 80 },
    { title: '供应商', dataIndex: 'supplierName', key: 'supplierName' },
    { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (v: string) => <Tag>{v || 'pending'}</Tag> },
    { title: '结果', dataIndex: 'reviewResult', key: 'reviewResult', width: 100 },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 110, render: (v: string) => v?.split('T')[0] ?? '-' },
  ];

  const quoteColumns: ColumnsType<any> = [
    { title: '供应商', dataIndex: 'supplierName', key: 'supplierName' },
    { title: '报价', dataIndex: 'quotePrice', key: 'quotePrice', width: 100, align: 'right', render: (v: number) => v != null ? `¥${v}` : '-' },
    { title: '起订量', dataIndex: 'moq', key: 'moq', width: 80 },
    { title: '交期', dataIndex: 'deliveryDays', key: 'deliveryDays', width: 90, render: (v: number) => v != null ? `${v}天` : '-' },
    { title: '首选', dataIndex: 'preferred', key: 'preferred', width: 80, render: (v: number) => v ? <Tag color="green">是</Tag> : '-' },
  ];

  const profitColumns: ColumnsType<any> = [
    { title: '场景', dataIndex: 'shippingMethod', key: 'shippingMethod', width: 100 },
    { title: '售价', dataIndex: 'salesPriceUsd', key: 'salesPriceUsd', width: 100, render: (v: number) => v != null ? `$${v}` : '-' },
    { title: '利润率', dataIndex: 'netMargin', key: 'netMargin', width: 100, render: (v: number) => v != null ? `${(v * 100).toFixed(1)}%` : '-' },
    { title: '利润', dataIndex: 'netProfitUsd', key: 'netProfitUsd', width: 100, render: (v: number) => v != null ? `$${v.toFixed(2)}` : '-' },
  ];

  const syncColumns: ColumnsType<any> = [
    { title: '状态', dataIndex: 'syncStatus', key: 'syncStatus', width: 100, render: (v: string) => <Tag color={v === 'success' ? 'green' : v === 'failed' ? 'red' : 'default'}>{v}</Tag> },
    { title: '操作人', dataIndex: 'syncedBy', key: 'syncedBy', width: 100 },
    { title: '时间', dataIndex: 'syncTime', key: 'syncTime', width: 180 },
    { title: '结果', dataIndex: 'resultMessage', key: 'resultMessage', ellipsis: true },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Space style={{ marginBottom: 16 }}>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/product-dev/projects')}>返回</Button>
        <Typography.Title level={4} style={{ margin: 0 }}>{project.productName}</Typography.Title>
        <Tag>{project.projectStatus}</Tag>
      </Space>

      <Tabs defaultActiveKey="overview" items={[
        { key: 'overview', label: '概览', children: (
          <Descriptions column={2} bordered size="small">
            <Descriptions.Item label="编码">{project.projectCode}</Descriptions.Item>
            <Descriptions.Item label="SKU">{project.sku || '-'}</Descriptions.Item>
            <Descriptions.Item label="开发人">{project.developerName || '-'}</Descriptions.Item>
            <Descriptions.Item label="负责人">{project.ownerName || '-'}</Descriptions.Item>
            <Descriptions.Item label="平台">{project.targetPlatform || '-'}</Descriptions.Item>
            <Descriptions.Item label="市场">{project.targetMarket || '-'}</Descriptions.Item>
            <Descriptions.Item label="预估成本">{project.estimatedCost != null ? `¥${project.estimatedCost}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="目标售价">{project.targetPrice != null ? `$${project.targetPrice}` : '-'}</Descriptions.Item>
            <Descriptions.Item label="目标利润率">{project.grossMarginTarget != null ? `${project.grossMarginTarget}%` : '-'}</Descriptions.Item>
            <Descriptions.Item label="创建时间">{project.createdAt?.split('T')[0] ?? '-'}</Descriptions.Item>
          </Descriptions>
        )},
        { key: 'sampling', label: `打样 (${samples.length})`, children: (
          <Table dataSource={samples} columns={sampleColumns} rowKey="id" size="small" pagination={false} />
        )},
        { key: 'quoting', label: `报价 (${quotes.length})`, children: (
          <Table dataSource={quotes} columns={quoteColumns} rowKey="id" size="small" pagination={false} />
        )},
        { key: 'profit', label: `利润测算 (${profits.length})`, children: (
          <Table dataSource={profits} columns={profitColumns} rowKey="id" size="small" pagination={false} />
        )},
        { key: 'sync', label: `领星同步 (${syncs.length})`, children: (
          <Table dataSource={syncs} columns={syncColumns} rowKey="id" size="small" pagination={false} />
        )},
      ]} />
    </div>
  );
};

export default ProjectDetailPage;
