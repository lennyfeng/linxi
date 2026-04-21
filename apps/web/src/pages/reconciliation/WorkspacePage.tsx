import React, { useCallback, useEffect, useState } from 'react';
import { Button, Card, InputNumber, List, message, Select, Space, Tag, Typography } from 'antd';
import { LinkOutlined } from '@ant-design/icons';
import apiClient from '@/api/client';

interface SourceItem { id: number; orderNo?: string; requestNo?: string; supplierName: string; amount: number; invoiceStatus: string | null; }
interface InvoiceItem { id: number; invoiceNo: string; supplierName: string; amount: number; matchStatus: string | null; }

type SourceType = 'purchase-orders' | 'payment-requests' | 'delivery-orders';

const WorkspacePage: React.FC = () => {
  const [sourceType, setSourceType] = useState<SourceType>('purchase-orders');
  const [sourceData, setSourceData] = useState<SourceItem[]>([]);
  const [invoiceData, setInvoiceData] = useState<InvoiceItem[]>([]);
  const [selectedSource, setSelectedSource] = useState<SourceItem | null>(null);
  const [selectedTarget, setSelectedTarget] = useState<InvoiceItem | null>(null);
  const [splitAmount, setSplitAmount] = useState<number>(0);
  const [linking, setLinking] = useState(false);

  const loadSource = useCallback(async () => {
    try {
      const res = await apiClient.get(`/reconciliation/${sourceType}`);
      setSourceData(res.data?.data ?? []);
    } catch { /* ignore */ }
  }, [sourceType]);

  const loadInvoices = useCallback(async () => {
    try {
      const res = await apiClient.get('/reconciliation/invoices');
      setInvoiceData(res.data?.data ?? []);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => { loadSource(); }, [loadSource]);
  useEffect(() => { loadInvoices(); }, [loadInvoices]);

  const handleSelectSource = (item: SourceItem) => {
    setSelectedSource(item);
    setSplitAmount(item.amount);
  };

  const handleSelectTarget = (item: InvoiceItem) => {
    setSelectedTarget(item);
    if (selectedSource) {
      setSplitAmount(Math.min(selectedSource.amount, item.amount));
    }
  };

  const handleLink = async () => {
    if (!selectedSource || !selectedTarget || splitAmount <= 0) return;
    setLinking(true);
    try {
      const relationType = sourceType === 'purchase-orders' ? 'purchase' : sourceType === 'payment-requests' ? 'payment-requests' : 'delivery';
      await apiClient.post(`/reconciliation/relations/${relationType}`, {
        invoiceId: selectedTarget.id,
        [`${sourceType === 'purchase-orders' ? 'purchaseOrderId' : sourceType === 'payment-requests' ? 'paymentRequestId' : 'deliveryOrderId'}`]: selectedSource.id,
        relationAmount: splitAmount,
        remark: null,
      });
      message.success('链接已创建');
      setSelectedSource(null);
      setSelectedTarget(null);
      setSplitAmount(0);
      await Promise.all([loadSource(), loadInvoices()]);
    } catch { message.error('创建链接失败'); }
    setLinking(false);
  };

  const getLabel = (item: SourceItem) => item.orderNo || item.requestNo || `#${item.id}`;
  const fmtAmt = (n: number) => `¥${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

  // Smart filter: when source selected, prioritize same supplier invoices
  const sortedInvoices = selectedSource
    ? [...invoiceData].sort((a, b) => {
        const aMatch = a.supplierName?.includes(selectedSource.supplierName) ? 0 : 1;
        const bMatch = b.supplierName?.includes(selectedSource.supplierName) ? 0 : 1;
        return aMatch - bMatch;
      })
    : invoiceData;

  return (
    <div style={{ padding: 24, height: 'calc(100vh - 64px)', display: 'flex', flexDirection: 'column' }}>
      <Typography.Title level={4} style={{ marginBottom: 16 }}>对账工作台</Typography.Title>

      <div style={{ display: 'flex', flex: 1, gap: 16, overflow: 'hidden' }}>
        {/* Left Panel: Source */}
        <Card
          title={
            <Space>
              <span>单据来源:</span>
              <Select value={sourceType} onChange={(v) => { setSourceType(v); setSelectedSource(null); }} style={{ width: 180 }} options={[
                { value: 'purchase-orders', label: '采购单' },
                { value: 'payment-requests', label: '请款单' },
                { value: 'delivery-orders', label: '发货单' },
              ]} />
            </Space>
          }
          size="small"
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          bodyStyle={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}
        >
          <List
            size="small"
            dataSource={sourceData}
            renderItem={(item) => (
              <List.Item
                onClick={() => handleSelectSource(item)}
                style={{ cursor: 'pointer', background: selectedSource?.id === item.id ? '#E6F7FF' : undefined, borderRadius: 4, padding: '8px 12px', marginBottom: 4 }}
              >
                <div style={{ width: '100%' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <strong>{getLabel(item)}</strong>
                    <span>{fmtAmt(item.amount)}</span>
                  </div>
                  <div style={{ color: '#8C8C8C', fontSize: 12 }}>{item.supplierName}</div>
                  <Tag color={item.invoiceStatus === 'matched' ? 'green' : item.invoiceStatus === 'partial' ? 'orange' : 'default'} style={{ marginTop: 4 }}>
                    {item.invoiceStatus || 'pending'}
                  </Tag>
                </div>
              </List.Item>
            )}
          />
        </Card>

        {/* Right Panel: Invoices */}
        <Card
          title="目标: 发票"
          size="small"
          style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
          bodyStyle={{ flex: 1, overflow: 'auto', padding: '8px 12px' }}
        >
          <List
            size="small"
            dataSource={sortedInvoices}
            renderItem={(item) => {
              const isRecommended = selectedSource && item.supplierName?.includes(selectedSource.supplierName);
              return (
                <List.Item
                  onClick={() => handleSelectTarget(item)}
                  style={{ cursor: 'pointer', background: selectedTarget?.id === item.id ? '#FFF7E6' : isRecommended ? '#F6FFED' : undefined, borderRadius: 4, padding: '8px 12px', marginBottom: 4 }}
                >
                  <div style={{ width: '100%' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <strong>{isRecommended ? '💡 ' : ''}{item.invoiceNo}</strong>
                      <span>{fmtAmt(item.amount)}</span>
                    </div>
                    <div style={{ color: '#8C8C8C', fontSize: 12 }}>{item.supplierName}</div>
                    <Tag color={item.matchStatus === 'matched' ? 'green' : item.matchStatus === 'partial' ? 'orange' : 'default'} style={{ marginTop: 4 }}>
                      {item.matchStatus || 'pending'}
                    </Tag>
                  </div>
                </List.Item>
              );
            }}
          />
        </Card>
      </div>

      {/* Link Action Bar */}
      {(selectedSource || selectedTarget) && (
        <Card size="small" style={{ marginTop: 12, background: '#FAFAFA' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <span>
              <strong>来源:</strong> {selectedSource ? `${getLabel(selectedSource)} (${fmtAmt(selectedSource.amount)})` : '— 请选择 —'}
            </span>
            <LinkOutlined />
            <span>
              <strong>目标:</strong> {selectedTarget ? `${selectedTarget.invoiceNo} (${fmtAmt(selectedTarget.amount)})` : '— 请选择 —'}
            </span>
            <div style={{ flex: 1 }} />
            <span>拆分金额:</span>
            <InputNumber
              value={splitAmount}
              min={0.01}
              max={selectedSource?.amount ?? 999999}
              precision={2}
              prefix="¥"
              style={{ width: 150 }}
              onChange={(v) => setSplitAmount(v ?? 0)}
            />
            <Button
              type="primary"
              icon={<LinkOutlined />}
              onClick={handleLink}
              loading={linking}
              disabled={!selectedSource || !selectedTarget || splitAmount <= 0}
            >
              创建链接
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default WorkspacePage;
