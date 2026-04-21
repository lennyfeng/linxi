import React, { useEffect, useState } from 'react';
import { Modal, Table, InputNumber, Button, Input, Tag, Typography, Space, message } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/api/client';

interface LinkingModalProps {
  open: boolean;
  sourceType: 'purchase-orders' | 'payment-requests' | 'delivery-orders';
  sourceId: number;
  sourceLabel: string;
  sourceAmount: number;
  alreadyLinked: number;
  onClose: () => void;
  onSuccess: () => void;
}

interface Candidate {
  purchaseOrderId?: number;
  orderNo?: string;
  amount: number;
  confidence: number;
}

interface InvoiceRow {
  id: number;
  invoiceNo: string;
  supplierName: string;
  amount: number;
  matchStatus: string | null;
}

const fmtAmt = (n: number) => `¥${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const LinkingModal: React.FC<LinkingModalProps> = ({
  open, sourceType, sourceId, sourceLabel, sourceAmount, alreadyLinked, onClose, onSuccess,
}) => {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [allInvoices, setAllInvoices] = useState<InvoiceRow[]>([]);
  const [keyword, setKeyword] = useState('');
  const [selected, setSelected] = useState<Map<number, number>>(new Map());
  const [loading, setLoading] = useState(false);

  const remaining = sourceAmount - alreadyLinked;

  useEffect(() => {
    if (open) {
      loadData();
      setSelected(new Map());
      setKeyword('');
    }
  }, [open, sourceId]);

  const loadData = async () => {
    try {
      const [recRes, invRes] = await Promise.all([
        apiClient.get(`/reconciliation/invoices/${sourceId}/recommendations`).catch(() => ({ data: { data: { candidates: [] } } })),
        apiClient.get('/reconciliation/invoices'),
      ]);
      setCandidates(recRes.data?.data?.candidates ?? []);
      setAllInvoices(invRes.data?.data ?? []);
    } catch { /* ignore */ }
  };

  const toggleSelect = (invoiceId: number, invoiceAmount: number) => {
    const next = new Map(selected);
    if (next.has(invoiceId)) {
      next.delete(invoiceId);
    } else {
      const totalSelected = Array.from(next.values()).reduce((s, v) => s + v, 0);
      const defaultSplit = Math.min(invoiceAmount, remaining - totalSelected);
      next.set(invoiceId, Math.max(0, defaultSplit));
    }
    setSelected(next);
  };

  const updateSplit = (invoiceId: number, value: number) => {
    const next = new Map(selected);
    next.set(invoiceId, value);
    setSelected(next);
  };

  const totalSplit = Array.from(selected.values()).reduce((s, v) => s + v, 0);

  const handleConfirm = async () => {
    if (selected.size === 0) return;
    setLoading(true);
    try {
      const relationType = sourceType === 'purchase-orders' ? 'purchase' : sourceType === 'payment-requests' ? 'payment-requests' : 'delivery';
      const idKey = sourceType === 'purchase-orders' ? 'purchaseOrderId' : sourceType === 'payment-requests' ? 'paymentRequestId' : 'deliveryOrderId';

      for (const [invoiceId, splitAmount] of selected.entries()) {
        await apiClient.post(`/reconciliation/relations/${relationType}`, {
          invoiceId,
          [idKey]: sourceId,
          relationAmount: splitAmount,
          remark: null,
        });
      }
      message.success(`已创建 ${selected.size} 条关联`);
      onSuccess();
      onClose();
    } catch { message.error('创建关联失败'); }
    setLoading(false);
  };

  const filtered = keyword
    ? allInvoices.filter((r) => r.invoiceNo?.toLowerCase().includes(keyword.toLowerCase()) || r.supplierName?.toLowerCase().includes(keyword.toLowerCase()))
    : allInvoices;

  const invoiceColumns: ColumnsType<InvoiceRow> = [
    { title: '', key: 'check', width: 40, render: (_: unknown, r: InvoiceRow) => (
      <input type="checkbox" checked={selected.has(r.id)} onChange={() => toggleSelect(r.id, r.amount)} />
    )},
    { title: '发票号', dataIndex: 'invoiceNo', key: 'invoiceNo', width: 140 },
    { title: '供应商', dataIndex: 'supplierName', key: 'supplierName' },
    { title: '金额', dataIndex: 'amount', key: 'amount', width: 120, align: 'right', render: (v: number) => fmtAmt(v) },
    { title: '状态', dataIndex: 'matchStatus', key: 'matchStatus', width: 100, render: (v: string) => <Tag>{v || 'pending'}</Tag> },
  ];

  return (
    <Modal
      title={`关联发票到 ${sourceLabel}`}
      open={open}
      onCancel={onClose}
      width={800}
      footer={[
        <Button key="cancel" onClick={onClose}>取消</Button>,
        <Button key="confirm" type="primary" onClick={handleConfirm} loading={loading} disabled={selected.size === 0 || totalSplit <= 0 || totalSplit > remaining}>
          确认关联 ({selected.size})
        </Button>,
      ]}
    >
      <div style={{ marginBottom: 12 }}>
        <Space>
          <span>总额: {fmtAmt(sourceAmount)}</span>
          <span>已关联: {fmtAmt(alreadyLinked)}</span>
          <span style={{ color: remaining <= 0 ? '#52C41A' : '#FA8C16' }}>剩余: {fmtAmt(remaining)}</span>
        </Space>
      </div>

      {candidates.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <Typography.Text strong>推荐匹配</Typography.Text>
          {candidates.slice(0, 5).map((c, i) => (
            <div key={i} style={{ padding: '4px 0', color: '#595959' }}>
              💡 {c.orderNo || `#${c.purchaseOrderId}`} — {fmtAmt(c.amount)} — 匹配度: {Math.round(c.confidence * 100)}%
            </div>
          ))}
        </div>
      )}

      <Input placeholder="搜索发票..." prefix={<SearchOutlined />} value={keyword} onChange={(e) => setKeyword(e.target.value)} allowClear style={{ marginBottom: 8 }} />
      <Table dataSource={filtered} columns={invoiceColumns} rowKey="id" size="small" pagination={{ pageSize: 10 }} scroll={{ y: 200 }} />

      {selected.size > 0 && (
        <div style={{ marginTop: 12, padding: 12, background: '#FAFAFA', borderRadius: 6 }}>
          <Typography.Text strong>已选择关联</Typography.Text>
          {Array.from(selected.entries()).map(([invId, split]) => {
            const inv = allInvoices.find((r) => r.id === invId);
            return (
              <div key={invId} style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6 }}>
                <span>{inv?.invoiceNo ?? `#${invId}`}</span>
                <span style={{ color: '#8C8C8C' }}>{fmtAmt(inv?.amount ?? 0)}</span>
                <span>→</span>
                <InputNumber size="small" value={split} min={0.01} max={inv?.amount ?? remaining} precision={2} prefix="¥" style={{ width: 140 }} onChange={(v) => updateSplit(invId, v ?? 0)} />
              </div>
            );
          })}
          <div style={{ marginTop: 8, fontWeight: 600 }}>
            拆分合计: {fmtAmt(totalSplit)} / 剩余: {fmtAmt(remaining - totalSplit)}
            {remaining - totalSplit <= 0 && remaining - totalSplit >= -0.01 ? ' ✅' : ''}
          </div>
        </div>
      )}
    </Modal>
  );
};

export default LinkingModal;
