import React, { useEffect, useState } from 'react';
import {
  Button,
  Descriptions,
  Drawer,
  Empty,
  Image,
  Popconfirm,
  Space,
  Spin,
  Tag,
} from 'antd';
import { LeftOutlined, RightOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '@/api/client';

interface TransactionDetailDrawerProps {
  open: boolean;
  transactionId: number | null;
  onClose: () => void;
  onEdit: (id: number) => void;
  onDeleted: () => void;
  onNavigate: (direction: 'prev' | 'next') => void;
  hasPrev: boolean;
  hasNext: boolean;
}

interface TxDetail {
  id: number;
  transactionNo: string;
  transactionType: string;
  transactionDate: string;
  accountId: number | null;
  transferInAccountId: number | null;
  amount: number;
  transferInAmount: number | null;
  currency: string;
  exchangeRate: number | null;
  amountCny: number | null;
  categoryId: number | null;
  counterpartyName: string | null;
  projectName: string | null;
  summary: string | null;
  remark: string | null;
  reimbursementRequired: number;
  reimbursementStatus: string | null;
  invoiceRequired: number;
  status: string;
  createdBy: string | null;
  createdAt?: string;
  attachments: AttachmentItem[];
}

interface AttachmentItem {
  id: number;
  fileName: string;
  fileUrl: string | null;
  mimeType?: string | null;
}

const fmtAmt = (n: number) =>
  Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const typeColorMap: Record<string, { color: string; label: string }> = {
  income: { color: '#00B894', label: '收入' },
  expense: { color: '#FF6B6B', label: '支出' },
  transfer: { color: '#4ECDC4', label: '转账' },
  refund: { color: '#FFA502', label: '退款' },
};

const TransactionDetailDrawer: React.FC<TransactionDetailDrawerProps> = ({
  open,
  transactionId,
  onClose,
  onEdit,
  onDeleted,
  onNavigate,
  hasPrev,
  hasNext,
}) => {
  const [tx, setTx] = useState<TxDetail | null>(null);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open || !transactionId) { setTx(null); setAttachments([]); return; }
    setLoading(true);
    apiClient
      .get(`/ledger/transactions/${transactionId}`)
      .then((r) => {
        const detail = r.data?.data ?? r.data;
        setTx(detail?.transaction ?? detail);
        setAttachments(detail?.attachments ?? []);
      })
      .finally(() => setLoading(false));
  }, [open, transactionId]);

  const handleDelete = async () => {
    if (!tx) return;
    await apiClient.delete(`/ledger/transactions/${tx.id}`);
    onDeleted();
    onClose();
  };

 const handleDeleteAttachment = async (attachmentId: number) => {
   if (!tx) return;
   await apiClient.delete(`/ledger/transactions/${tx.id}/attachments/${attachmentId}`);
   setAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
 };

  const typeInfo = tx ? typeColorMap[tx.transactionType] ?? { color: '#999', label: tx.transactionType } : null;
  const prefix = tx?.transactionType === 'income' ? '+' : tx?.transactionType === 'expense' ? '-' : '';

  return (
    <Drawer
      title={
        tx ? (
          <Space>
            <Tag color={typeInfo?.color}>{typeInfo?.label}</Tag>
            <span style={{ fontWeight: 600 }}>{tx.summary || tx.transactionNo}</span>
            <Tag color={tx.status === 'submitted' ? 'green' : 'default'}>
              {tx.status === 'submitted' ? '已提交' : '草稿'}
            </Tag>
          </Space>
        ) : '流水详情'
      }
      open={open}
      onClose={onClose}
      width={800}
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Space>
            <Button icon={<LeftOutlined />} disabled={!hasPrev} onClick={() => onNavigate('prev')}>
              上一条
            </Button>
            <Button disabled={!hasNext} onClick={() => onNavigate('next')}>
              下一条 <RightOutlined />
            </Button>
          </Space>
          {tx && (
            <Space>
              <Button icon={<EditOutlined />} onClick={() => onEdit(tx.id)}>编辑</Button>
              {tx.status === 'draft' && (
                <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>删除</Button>
              )}
            </Space>
          )}
        </div>
      }
    >
      {loading && <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>}
      {!loading && !tx && <Empty description="未找到流水" />}
      {!loading && tx && (
        <>
          <Descriptions column={2} bordered size="small" style={{ marginBottom: 24 }}>
            <Descriptions.Item label="日期">
              {dayjs(tx.transactionDate).format('YYYY-MM-DD')}
            </Descriptions.Item>
            <Descriptions.Item label="流水号">{tx.transactionNo}</Descriptions.Item>
            <Descriptions.Item label="金额">
              <span
                style={{
                  color: typeInfo?.color,
                  fontWeight: 600,
                  fontSize: 16,
                  fontFamily: 'DIN Alternate, monospace',
                }}
              >
                {prefix}¥{fmtAmt(tx.amount)}
              </span>
            </Descriptions.Item>
            <Descriptions.Item label="币种">{tx.currency}</Descriptions.Item>
            {tx.exchangeRate && (
              <Descriptions.Item label="汇率">{tx.exchangeRate}</Descriptions.Item>
            )}
            {tx.amountCny && (
              <Descriptions.Item label="人民币等值">¥{fmtAmt(tx.amountCny)}</Descriptions.Item>
            )}
            {tx.transactionType === 'transfer' && (
              <>
                <Descriptions.Item label="转出账户">账户 #{tx.accountId}</Descriptions.Item>
                <Descriptions.Item label="转入账户">账户 #{tx.transferInAccountId}</Descriptions.Item>
                {tx.transferInAmount && (
                  <Descriptions.Item label="转入金额">¥{fmtAmt(tx.transferInAmount)}</Descriptions.Item>
                )}
              </>
            )}
            {tx.transactionType !== 'transfer' && (
              <Descriptions.Item label="账户">账户 #{tx.accountId}</Descriptions.Item>
            )}
            <Descriptions.Item label="分类">
              {tx.categoryId ? `分类 #${tx.categoryId}` : '-'}
            </Descriptions.Item>
            <Descriptions.Item label="对方">{tx.counterpartyName || '-'}</Descriptions.Item>
            {tx.projectName && (
              <Descriptions.Item label="项目">{tx.projectName}</Descriptions.Item>
            )}
            <Descriptions.Item label="报销">
              {tx.reimbursementRequired ? '是' : '否'}
            </Descriptions.Item>
            <Descriptions.Item label="发票">
              {tx.invoiceRequired ? '是' : '否'}
            </Descriptions.Item>
            {tx.createdBy && (
              <Descriptions.Item label="创建人">{tx.createdBy}</Descriptions.Item>
            )}
            {tx.createdAt && (
              <Descriptions.Item label="创建时间">
                {dayjs(tx.createdAt).format('YYYY-MM-DD HH:mm')}
              </Descriptions.Item>
            )}
          </Descriptions>

          {tx.remark && (
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: '#6B7B8D', marginBottom: 4 }}>备注</div>
              <div style={{ padding: '8px 12px', background: '#F5F7FA', borderRadius: 6 }}>
                {tx.remark}
              </div>
            </div>
          )}

          {attachments.length > 0 && (
            <div>
              <div style={{ fontSize: 12, color: '#6B7B8D', marginBottom: 8 }}>附件</div>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {attachments.map((item) => (
                  <div key={item.id} style={{ width: 104 }}>
                    {item.fileUrl && String(item.mimeType || '').startsWith('image/') ? (
                      <Image src={item.fileUrl} width={104} height={104} style={{ objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                      <a href={item.fileUrl || '#'} target="_blank" rel="noreferrer" style={{ display: 'flex', width: 104, height: 104, border: '1px solid #F0F0F0', borderRadius: 8, alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#1677FF', padding: 8, textAlign: 'center' }}>
                        {item.fileName}
                      </a>
                    )}
                   <Popconfirm title="确认删除此附件？" okText="确认" cancelText="取消" onConfirm={() => handleDeleteAttachment(item.id)}>
                     <Button type="link" size="small" danger style={{ padding: 0, marginTop: 4 }}>删除</Button>
                   </Popconfirm>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </Drawer>
  );
};

export default TransactionDetailDrawer;
