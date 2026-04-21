import React, { useEffect, useState } from 'react';
import { Drawer, Descriptions, Table, Tag, Button, Progress, Spin, Popconfirm, message } from 'antd';
import { LinkOutlined, DeleteOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/api/client';

type EntityType = 'purchase-orders' | 'payment-requests' | 'delivery-orders' | 'invoices';

interface EntityDetailDrawerProps {
  open: boolean;
  entityType: EntityType;
  entityId: number | null;
  onClose: () => void;
  onLink?: () => void;
}

interface RelationItem {
  id: number;
  invoiceId?: number;
  purchaseOrderId?: number;
  paymentRequestId?: number;
  deliveryOrderId?: number;
  relationAmount: number;
  remark: string | null;
}

const fmtAmt = (n: number) => `¥${Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`;

const EntityDetailDrawer: React.FC<EntityDetailDrawerProps> = ({ open, entityType, entityId, onClose, onLink }) => {
  const [loading, setLoading] = useState(false);
  const [detail, setDetail] = useState<Record<string, unknown> | null>(null);
  const [relations, setRelations] = useState<RelationItem[]>([]);

  useEffect(() => {
    if (open && entityId) loadDetail();
    else { setDetail(null); setRelations([]); }
  }, [open, entityId, entityType]);

  const loadDetail = async () => {
    if (!entityId) return;
    setLoading(true);
    try {
      const res = await apiClient.get(`/reconciliation/${entityType}/${entityId}`);
      const data = res.data?.data;
      setDetail(data?.detail ?? data ?? null);
      setRelations(data?.relations ?? []);
    } catch { /* ignore */ }
    setLoading(false);
  };

  const handleDeleteRelation = async (relationId: number) => {
    const relType = entityType === 'purchase-orders' ? 'purchase' : entityType === 'payment-requests' ? 'payment-requests' : 'delivery';
    try {
      await apiClient.delete(`/reconciliation/relations/${relType}/${relationId}`);
      message.success('链接已移除');
      loadDetail();
    } catch { message.error('移除链接失败'); }
  };

  const entityAmount = Number(detail?.amount ?? detail?.totalAmount ?? 0);
  const linkedTotal = relations.reduce((s, r) => s + Number(r.relationAmount || 0), 0);
  const remaining = entityAmount - linkedTotal;
  const progressPct = entityAmount > 0 ? Math.min(100, (linkedTotal / entityAmount) * 100) : 0;

  const relationColumns: ColumnsType<RelationItem> = [
    { title: '关联实体', key: 'linked', render: (_: unknown, r: RelationItem) => {
      if (r.invoiceId) return `发票 #${r.invoiceId}`;
      if (r.purchaseOrderId) return `采购单 #${r.purchaseOrderId}`;
      if (r.paymentRequestId) return `请款单 #${r.paymentRequestId}`;
      if (r.deliveryOrderId) return `发货单 #${r.deliveryOrderId}`;
      return '-';
    }},
    { title: '拆分金额', dataIndex: 'relationAmount', key: 'relationAmount', width: 140, align: 'right', render: (v: number) => fmtAmt(v) },
    { title: '备注', dataIndex: 'remark', key: 'remark', ellipsis: true },
    { title: '', key: 'actions', width: 60, render: (_: unknown, r: RelationItem) => (
      <Popconfirm title="确定移除此链接？" onConfirm={() => handleDeleteRelation(r.id)} okText="是" cancelText="否">
        <Button type="text" danger size="small" icon={<DeleteOutlined />} />
      </Popconfirm>
    )},
  ];

  const title = entityType === 'purchase-orders' ? '采购单' : entityType === 'payment-requests' ? '请款单' : entityType === 'delivery-orders' ? '发货单' : '发票';

  return (
    <Drawer title={`${title}详情`} open={open} onClose={onClose} width={640}>
      {loading ? <Spin style={{ display: 'block', margin: '40px auto' }} /> : detail ? (
        <>
          <Descriptions column={2} size="small" bordered style={{ marginBottom: 16 }}>
            <Descriptions.Item label="ID">{String(detail.id ?? '')}</Descriptions.Item>
            <Descriptions.Item label="编号">{String(detail.orderNo ?? detail.requestNo ?? detail.invoiceNo ?? '')}</Descriptions.Item>
            <Descriptions.Item label="供应商">{String(detail.supplierName ?? '')}</Descriptions.Item>
            <Descriptions.Item label="金额">{fmtAmt(entityAmount)}</Descriptions.Item>
            <Descriptions.Item label="状态">
              <Tag>{String(detail.invoiceStatus ?? detail.matchStatus ?? detail.status ?? 'N/A')}</Tag>
            </Descriptions.Item>
          </Descriptions>

          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span>已关联: {fmtAmt(linkedTotal)} / {fmtAmt(entityAmount)}</span>
              <span style={{ color: remaining <= 0 ? '#52C41A' : '#FF4D4F' }}>
                剩余: {fmtAmt(remaining)} {remaining <= 0 ? '✅' : ''}
              </span>
            </div>
            <Progress percent={Math.round(progressPct)} status={remaining <= 0 ? 'success' : 'active'} />
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
            <strong>关联记录</strong>
            {onLink && <Button size="small" type="primary" icon={<LinkOutlined />} onClick={onLink}>+ 关联</Button>}
          </div>
          <Table dataSource={relations} columns={relationColumns} rowKey="id" size="small" pagination={false} />
        </>
      ) : (
        <div style={{ textAlign: 'center', color: '#999', padding: 40 }}>暂无数据</div>
      )}
    </Drawer>
  );
};

export default EntityDetailDrawer;
