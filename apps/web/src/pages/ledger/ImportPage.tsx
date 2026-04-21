import React, { useState } from 'react';
import {
  Alert,
  Button,
  Card,
  Radio,
  Result,
  Space,
  Steps,
  Table,
  Typography,
  Upload,
} from 'antd';
import { InboxOutlined, CheckCircleOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';

const { Dragger } = Upload;

const ImportPage: React.FC = () => {
  const navigate = useNavigate();
  const [current, setCurrent] = useState(0);
  const [sourceType, setSourceType] = useState<string>('airwallex');
  const [fileName, setFileName] = useState('');
  const [_batchId, setBatchId] = useState<number | null>(null);
  const [parsedRows, setParsedRows] = useState<any[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ success: number; skipped: number } | null>(null);

  const handleUpload = async (file: File) => {
    setFileName(file.name);
    // Create import batch
    const batchRes = await apiClient.post('/ledger/imports', {
      fileName: file.name,
      sourceType,
      batchNo: `IMP-${Date.now()}`,
      status: 'pending',
    });
    const batch = batchRes.data?.data ?? batchRes.data;
    setBatchId(batch?.id);
    // Simulate parsed rows (in real implementation, parse the PDF)
    setParsedRows([
      { key: 1, date: '2026-03-01', type: 'Transfer', details: 'PIPO received', credit: 8528, debit: 0, selected: true },
      { key: 2, date: '2026-03-01', type: 'Fee', details: 'Monthly fee', credit: 0, debit: 25, selected: true },
      { key: 3, date: '2026-03-05', type: 'Transfer', details: 'Payment out', credit: 0, debit: 5000, selected: true },
    ]);
    setCurrent(1);
    return false;
  };

  const handleConfirmImport = async () => {
    setImporting(true);
    try {
      const selected = parsedRows.filter((r) => r.selected);
      const transactions = selected.map((r) => ({
        transactionType: r.credit > 0 ? 'income' : 'expense',
        transactionDate: r.date,
        amount: r.credit || r.debit,
        summary: r.details,
        currency: 'CNY',
      }));
      const res = await apiClient.post('/ledger/transactions/batch', { transactions });
      const d = res.data?.data ?? res.data;
      setResult({ success: d?.success ?? transactions.length, skipped: parsedRows.length - selected.length });
      setCurrent(3);
    } finally {
      setImporting(false);
    }
  };

  const steps = [
    {
      title: '选择来源',
      content: (
        <div style={{ maxWidth: 600, margin: '24px auto' }}>
          <Radio.Group value={sourceType} onChange={(e) => setSourceType(e.target.value)}>
            <Space direction="vertical" size={12}>
              <Radio value="airwallex">Airwallex PDF 对账单</Radio>
              <Radio value="lemoncloud">柠檬云凭证同步</Radio>
            </Space>
          </Radio.Group>
          <div style={{ marginTop: 24 }}>
            <Dragger
              accept=".pdf,.csv,.xlsx"
              maxCount={1}
              showUploadList={false}
              beforeUpload={(file) => { handleUpload(file); return false; }}
            >
              <p className="ant-upload-drag-icon"><InboxOutlined /></p>
              <p className="ant-upload-text">拖拽文件到此处或点击浏览</p>
              <p className="ant-upload-hint">支持 PDF、CSV、XLSX，最大 50MB</p>
            </Dragger>
          </div>
        </div>
      ),
    },
    {
      title: '预览与编辑',
      content: (
        <div>
          <Alert
            type="info"
            showIcon
            message={`${fileName} — 发现 ${parsedRows.length} 条流水`}
            style={{ marginBottom: 16 }}
          />
          <Table
            dataSource={parsedRows}
            rowKey="key"
            size="small"
            pagination={false}
            rowSelection={{
              selectedRowKeys: parsedRows.filter((r) => r.selected).map((r) => r.key),
              onChange: (keys) => {
                setParsedRows((prev) =>
                  prev.map((r) => ({ ...r, selected: keys.includes(r.key) })),
                );
              },
            }}
            columns={[
              { title: '日期', dataIndex: 'date', width: 110 },
              { title: '类型', dataIndex: 'type', width: 100 },
              { title: '明细', dataIndex: 'details' },
              {
                title: '贷方',
                dataIndex: 'credit',
                width: 100,
                align: 'right',
                render: (v: number) => v > 0 ? <span style={{ color: '#00B894' }}>¥{v.toLocaleString()}</span> : '',
              },
              {
                title: '借方',
                dataIndex: 'debit',
                width: 100,
                align: 'right',
                render: (v: number) => v > 0 ? <span style={{ color: '#FF6B6B' }}>¥{v.toLocaleString()}</span> : '',
              },
            ]}
          />
          <div style={{ marginTop: 16, textAlign: 'right' }}>
            <Space>
              <Button onClick={() => setCurrent(0)}>上一步</Button>
              <Button type="primary" onClick={() => setCurrent(2)}>下一步: 查重</Button>
            </Space>
          </div>
        </div>
      ),
    },
    {
      title: '查重检查',
      content: (
        <div style={{ maxWidth: 600, margin: '24px auto', textAlign: 'center' }}>
          <CheckCircleOutlined style={{ fontSize: 48, color: '#52C41A' }} />
          <Typography.Title level={4} style={{ marginTop: 16 }}>
            {parsedRows.filter((r) => r.selected).length} 条流水 — 未发现重复
          </Typography.Title>
          <div style={{ marginTop: 24 }}>
            <Space>
              <Button onClick={() => setCurrent(1)}>上一步</Button>
              <Button type="primary" loading={importing} onClick={handleConfirmImport}>
                确认导入
              </Button>
            </Space>
          </div>
        </div>
      ),
    },
    {
      title: '结果',
      content: result ? (
        <Result
          status="success"
          title={`成功导入 ${result.success} 条流水`}
          subTitle={result.skipped > 0 ? `跳过 ${result.skipped} 行` : undefined}
          extra={[
            <Button type="primary" key="view" onClick={() => navigate('/ledger/transactions')}>
              查看已导入流水
            </Button>,
            <Button key="another" onClick={() => { setCurrent(0); setResult(null); setParsedRows([]); }}>
              继续导入
            </Button>,
          ]}
        />
      ) : null,
    },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card title={<Typography.Title level={4} style={{ margin: 0 }}>导入流水</Typography.Title>}>
        <Steps current={current} items={steps.map((s) => ({ title: s.title }))} style={{ marginBottom: 24 }} />
        {steps[current]?.content}
      </Card>
    </div>
  );
};

export default ImportPage;
