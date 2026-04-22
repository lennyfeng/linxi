import React, { useEffect, useState } from 'react';
import {
  AutoComplete,
  Button,
  Checkbox,
  DatePicker,
  Drawer,
  Dropdown,
  Form,
  Image,
  Input,
  InputNumber,
  message,
  Select,
  Space,
  Tabs,
  Tag,
  TreeSelect,
  Upload,
} from 'antd';
import { DownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '@/api/client';

interface Account { id: number; accountName: string; currency: string; }
interface Category { id: number; categoryName: string; categoryType: string; parentId: number | null; }
interface AttachmentItem { id: number; fileName: string; fileUrl: string | null; mimeType?: string | null; }

interface TransactionFormDrawerProps {
  open: boolean;
  editId?: number | null;
  onClose: () => void;
  onSaved: () => void;
  accounts: Account[];
  categories: Category[];
}

const typeOptions = [
  { key: 'income', label: '收入' },
  { key: 'expense', label: '支出' },
  { key: 'transfer', label: '转账' },
  { key: 'refund', label: '退款' },
];

const TransactionFormDrawer: React.FC<TransactionFormDrawerProps> = ({
  open,
  editId,
  onClose,
  onSaved,
  accounts,
  categories,
}) => {
  const [form] = Form.useForm();
  const [txType, setTxType] = useState('expense');
  const [continuous, setContinuous] = useState(false);
  const [saving, setSaving] = useState(false);
  const [counterpartySuggestions, setCounterpartySuggestions] = useState<{ value: string }[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [accountCurrency, setAccountCurrency] = useState('CNY');
  const [projects, setProjects] = useState<{ id: number; name: string; parentId: number | null }[]>([]);
  const [attachments, setAttachments] = useState<AttachmentItem[]>([]);
  const [pendingFiles, setPendingFiles] = useState<File[]>([]);

  const isTransfer = txType === 'transfer';
  const isEdit = !!editId;

  // Load projects
  useEffect(() => {
    if (!open) return;
    apiClient.get('/ledger/projects?status=active').then((r) => {
      const list = r.data?.data ?? r.data ?? [];
      setProjects(Array.isArray(list) ? list : []);
    });
  }, [open]);

  const projectTreeData = React.useMemo(() => {
    const roots = projects.filter((p) => !p.parentId);
    const buildChildren = (parentId: number): any[] =>
      projects.filter((p) => p.parentId === parentId).map((p) => ({
        value: p.name,
        title: p.name,
        children: buildChildren(p.id),
      }));
    return roots.map((r) => ({
      value: r.name,
      title: r.name,
      children: buildChildren(r.id),
    }));
  }, [projects]);

  // Load existing transaction for edit
  useEffect(() => {
    if (!open) return;
    if (editId) {
      apiClient.get(`/ledger/transactions/${editId}`).then((r) => {
        const detail = r.data?.data ?? r.data;
        const tx = detail?.transaction ?? detail;
        if (!tx) return;
        setAttachments(detail?.attachments ?? []);
        setPendingFiles([]);
        setTxType(tx.transactionType || 'expense');
        setIsSubmitted(tx.status === 'submitted');
        setAccountCurrency(tx.currency || 'CNY');
        form.setFieldsValue({
          transactionDate: dayjs(tx.transactionDate),
          accountId: tx.accountId,
          toAccountId: tx.transferInAccountId,
          amount: tx.amount,
          toAmount: tx.transferInAmount,
          categoryId: tx.categoryId,
          counterpartyName: tx.counterpartyName,
          projectName: tx.projectName,
          summary: tx.summary,
          remark: tx.remark,
          reimbursementRequired: !!tx.reimbursementRequired,
          invoiceRequired: !!tx.invoiceRequired,
        });
      });
    } else {
      setIsSubmitted(false);
      setAttachments([]);
      setPendingFiles([]);
      form.resetFields();
      form.setFieldsValue({
        transactionDate: dayjs(),
        amount: undefined,
      });
      setAccountCurrency('CNY');
    }
  }, [open, editId, form]);

  const handleCounterpartySearch = (q: string) => {
    if (!q || q.length < 1) return;
    apiClient.get('/ledger/counterparties', { params: { q } }).then((r) => {
      const data = r.data?.data ?? r.data ?? [];
      setCounterpartySuggestions(data.map((d: any) => ({ value: d.name })));
    });
  };

  const loadAttachments = async (transactionId: number) => {
    const res = await apiClient.get(`/ledger/transactions/${transactionId}/attachments`);
    setAttachments(res.data?.data ?? res.data ?? []);
  };

  const readFileAsBase64 = async (file: File) => {
    return await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = String(reader.result || '');
        resolve(result.includes(',') ? result.split(',')[1] || '' : result);
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  };

  const uploadPendingAttachments = async (transactionId: number) => {
    if (!pendingFiles.length) return;
    for (const file of pendingFiles) {
      const contentBase64 = await readFileAsBase64(file);
      await apiClient.post(`/ledger/transactions/${transactionId}/attachments`, {
        fileName: file.name,
        mimeType: file.type,
        fileSize: file.size,
        contentBase64,
      });
    }
    await loadAttachments(transactionId);
    setPendingFiles([]);
  };

  const doSave = async (status: string) => {
    const values = await form.validateFields();
    setSaving(true);
    try {
      const payload: Record<string, unknown> = {
        transactionType: txType,
        transactionDate: values.transactionDate?.format('YYYY-MM-DD'),
        accountId: isTransfer ? undefined : values.accountId,
        transferOutAccountId: isTransfer ? values.accountId : undefined,
        transferInAccountId: isTransfer ? values.toAccountId : undefined,
        amount: values.amount,
        transferInAmount: isTransfer ? (values.toAmount ?? values.amount) : undefined,
        // currency and exchangeRate auto-resolved by backend from account
        categoryId: isTransfer ? null : values.categoryId,
        counterpartyName: values.counterpartyName || null,
        projectName: values.projectName || null,
        summary: values.summary || null,
        remark: values.remark || null,
        reimbursementRequired: values.reimbursementRequired ? 1 : 0,
        invoiceRequired: values.invoiceRequired ? 1 : 0,
        status,
      };

      let savedId = editId ?? null;
      if (editId) {
        await apiClient.put(`/ledger/transactions/${editId}`, payload);
        message.success('流水已更新');
      } else {
        const res = await apiClient.post('/ledger/transactions', payload);
        savedId = res.data?.data?.id ?? res.data?.id ?? null;
        message.success('流水已创建');
      }

      if (savedId) {
        await uploadPendingAttachments(savedId);
      }

      if (continuous && !editId) {
        const preserveDate = values.transactionDate;
        const preserveAccount = values.accountId;
        form.resetFields();
        form.setFieldsValue({
          transactionDate: preserveDate,
          accountId: preserveAccount,
        });
        setAttachments([]);
        setPendingFiles([]);
      } else {
        onClose();
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const categoryTree = React.useMemo(() => {
    const type = txType === 'income' ? 'income' : 'expense';
    const items = categories.filter((c) => c.categoryType === type);
    const roots = items.filter((c) => !c.parentId);
    return roots.map((root) => {
      const children = items.filter((c) => c.parentId === root.id);
      return {
        value: root.id,
        title: root.categoryName,
        selectable: children.length === 0,
        children: children.map((ch) => ({ value: ch.id, title: ch.categoryName })),
      };
    });
  }, [categories, txType]);

  const accountOptions = accounts.map((a) => ({
    value: a.id,
    label: `${a.accountName} (${a.currency})`,
  }));

  const submittedWarning = isSubmitted && isEdit && (
    <div style={{ marginBottom: 16, padding: '8px 12px', background: '#FFF7E6', border: '1px solid #FFD666', borderRadius: 6, fontSize: 12, color: '#D48806' }}>
      已提交的流水仅部分字段可编辑
    </div>
  );

  return (
    <Drawer
      title={isEdit ? '编辑流水' : '记一笔'}
      open={open}
      onClose={onClose}
      width={640}
      destroyOnClose
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Checkbox checked={continuous} onChange={(e) => setContinuous(e.target.checked)} disabled={isEdit}>
            连续录入
          </Checkbox>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Dropdown
              menu={{
                items: [{ key: 'draft', label: '保存为草稿' }],
                onClick: () => doSave('draft'),
              }}
              placement="topRight"
            >
              <Button type="primary" loading={saving} onClick={() => doSave('submitted')}>
                保存 <DownOutlined />
              </Button>
            </Dropdown>
          </Space>
        </div>
      }
    >
      <Tabs
        activeKey={txType}
        onChange={(key) => { setTxType(key); }}
        items={typeOptions}
        style={{ marginBottom: 16 }}
      />

      {submittedWarning}

      <Form form={form} layout="vertical" size="middle">
        <Form.Item name="transactionDate" label="日期" rules={[{ required: true }]}>
          <DatePicker style={{ width: '100%' }} disabled={isSubmitted && isEdit} />
        </Form.Item>

        {!isTransfer ? (
          <>
            <Form.Item name="accountId" label="账户" rules={[{ required: true }]}>
              <Select
                showSearch
                optionFilterProp="label"
                options={accountOptions}
                placeholder="选择账户..."
                disabled={isSubmitted && isEdit}
                onChange={(val) => {
                  const acc = accounts.find((a) => a.id === val);
                  setAccountCurrency(acc?.currency || 'CNY');
                }}
              />
            </Form.Item>
            <Form.Item label="金额" required>
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item name="amount" noStyle rules={[{ required: true }]}>
                  <InputNumber
                    style={{ width: '100%' }}
                    min={0}
                    precision={2}
                    placeholder="0.00"
                    disabled={isSubmitted && isEdit}
                  />
                </Form.Item>
                {accountCurrency !== 'CNY' && (
                  <Tag color="blue" style={{ lineHeight: '30px', margin: 0, borderRadius: '0 6px 6px 0' }}>{accountCurrency}</Tag>
                )}
              </Space.Compact>
              {accountCurrency !== 'CNY' && (
                <div style={{ fontSize: 12, color: '#999', marginTop: 4 }}>汇率将根据账户币种自动计算</div>
              )}
            </Form.Item>
            <Form.Item name="categoryId" label="分类" rules={[{ required: true }]}>
              <TreeSelect
                showSearch
                treeData={categoryTree}
                treeDefaultExpandAll
                placeholder="选择分类..."
                treeLine
                treeNodeFilterProp="title"
              />
            </Form.Item>
          </>
        ) : (
          <>
            <Form.Item name="accountId" label="转出账户" rules={[{ required: true }]}>
              <Select showSearch optionFilterProp="label" options={accountOptions} placeholder="来源账户..." disabled={isSubmitted && isEdit} />
            </Form.Item>
            <Form.Item name="amount" label="转出金额" rules={[{ required: true }]}>
              <InputNumber style={{ width: '100%' }} min={0} precision={2} disabled={isSubmitted && isEdit} />
            </Form.Item>
            <Form.Item name="toAccountId" label="转入账户" rules={[{ required: true }]}>
              <Select showSearch optionFilterProp="label" options={accountOptions} placeholder="目标账户..." disabled={isSubmitted && isEdit} />
            </Form.Item>
            <Form.Item name="toAmount" label="转入金额">
              <InputNumber style={{ width: '100%' }} min={0} precision={2} placeholder="同币种则与转出相同" disabled={isSubmitted && isEdit} />
            </Form.Item>
          </>
        )}

        <Form.Item name="counterpartyName" label="对方">
          <AutoComplete
            options={counterpartySuggestions}
            onSearch={handleCounterpartySearch}
            placeholder="输入搜索..."
          />
        </Form.Item>

        <Form.Item name="projectName" label="项目">
          <TreeSelect
            treeData={projectTreeData}
            allowClear
            showSearch
            treeNodeFilterProp="title"
            treeDefaultExpandAll
            placeholder="选择项目（可选）"
          />
        </Form.Item>

        <Form.Item name="summary" label="摘要" rules={[{ required: true, min: 2, max: 200 }]}>
          <Input placeholder="简要描述" />
        </Form.Item>

        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={3} maxLength={500} showCount />
        </Form.Item>

        <Form.Item label="附件">
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            <Upload
              multiple
              accept="image/*"
              beforeUpload={(file) => {
                setPendingFiles((prev) => [...prev, file]);
                return false;
              }}
              fileList={pendingFiles.map((file, index) => ({ uid: `${file.name}-${index}`, name: file.name, status: 'done' as const }))}
              onRemove={(file) => {
                setPendingFiles((prev) => prev.filter((item, index) => `${item.name}-${index}` !== file.uid));
              }}
            >
              <Button>选择图片</Button>
            </Upload>
            {!isEdit && pendingFiles.length > 0 && (
              <div style={{ fontSize: 12, color: '#8C8C8C' }}>新建流水时会在保存后自动上传附件</div>
            )}
            {attachments.length > 0 && (
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {attachments.map((item) => (
                  <div key={item.id} style={{ width: 96 }}>
                    {item.fileUrl && String(item.mimeType || '').startsWith('image/') ? (
                      <Image src={item.fileUrl} width={96} height={96} style={{ objectFit: 'cover', borderRadius: 8 }} />
                    ) : (
                      <div style={{ width: 96, height: 96, border: '1px solid #F0F0F0', borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, color: '#8C8C8C', padding: 8, textAlign: 'center' }}>
                        {item.fileName}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </Space>
        </Form.Item>

        {!isTransfer && (
          <Space size={24}>
            <Form.Item name="reimbursementRequired" valuePropName="checked">
              <Checkbox>需要报销</Checkbox>
            </Form.Item>
            <Form.Item name="invoiceRequired" valuePropName="checked">
              <Checkbox>有发票</Checkbox>
            </Form.Item>
          </Space>
        )}
      </Form>
    </Drawer>
  );
};

export default TransactionFormDrawer;
