import React, { useEffect, useState } from 'react';
import {
  AutoComplete,
  Button,
  Checkbox,
  DatePicker,
  Drawer,
  Dropdown,
  Form,
  Input,
  InputNumber,
  message,
  Select,
  Space,
  Tabs,
} from 'antd';
import { DownOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '@/api/client';

interface Account { id: number; accountName: string; currency: string; }
interface Category { id: number; categoryName: string; categoryType: string; parentId: number | null; }

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

  const isTransfer = txType === 'transfer';
  const isEdit = !!editId;

  // Load existing transaction for edit
  useEffect(() => {
    if (!open) return;
    if (editId) {
      apiClient.get(`/ledger/transactions/${editId}`).then((r) => {
        const tx = r.data?.data ?? r.data;
        if (!tx) return;
        setTxType(tx.transactionType || 'expense');
        setIsSubmitted(tx.status === 'submitted');
        form.setFieldsValue({
          transactionDate: dayjs(tx.transactionDate),
          accountId: tx.accountId,
          toAccountId: tx.transferInAccountId,
          amount: tx.amount,
          toAmount: tx.transferInAmount,
          currency: tx.currency,
          exchangeRate: tx.exchangeRate,
          categoryId: tx.categoryId,
          counterpartyName: tx.counterpartyName,
          summary: tx.summary,
          remark: tx.remark,
          reimbursementRequired: !!tx.reimbursementRequired,
          invoiceRequired: !!tx.invoiceRequired,
        });
      });
    } else {
      setIsSubmitted(false);
      form.resetFields();
      form.setFieldsValue({
        transactionDate: dayjs(),
        currency: 'CNY',
        amount: undefined,
      });
    }
  }, [open, editId, form]);

  const handleCounterpartySearch = (q: string) => {
    if (!q || q.length < 1) return;
    apiClient.get('/ledger/counterparties', { params: { q } }).then((r) => {
      const data = r.data?.data ?? r.data ?? [];
      setCounterpartySuggestions(data.map((d: any) => ({ value: d.name })));
    });
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
        currency: values.currency || 'CNY',
        exchangeRate: values.exchangeRate || null,
        categoryId: isTransfer ? null : values.categoryId,
        counterpartyName: values.counterpartyName || null,
        summary: values.summary || null,
        remark: values.remark || null,
        reimbursementRequired: values.reimbursementRequired ? 1 : 0,
        invoiceRequired: values.invoiceRequired ? 1 : 0,
        status,
      };

      if (editId) {
        await apiClient.put(`/ledger/transactions/${editId}`, payload);
        message.success('流水已更新');
      } else {
        await apiClient.post('/ledger/transactions', payload);
        message.success('流水已创建');
      }

      if (continuous && !editId) {
        const preserveDate = values.transactionDate;
        const preserveAccount = values.accountId;
        form.resetFields();
        form.setFieldsValue({
          transactionDate: preserveDate,
          accountId: preserveAccount,
          currency: 'CNY',
        });
      } else {
        onClose();
      }
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  const categoryOptions = categories
    .filter((c) => {
      if (txType === 'income') return c.categoryType === 'income';
      return c.categoryType === 'expense';
    })
    .map((c) => ({ value: c.id, label: c.categoryName }));

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
      title={isEdit ? '编辑流水' : '新建流水'}
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
              />
            </Form.Item>
            <Form.Item name="amount" label="金额" rules={[{ required: true }]}>
              <InputNumber
                style={{ width: '100%' }}
                min={0}
                precision={2}
                placeholder="0.00"
                disabled={isSubmitted && isEdit}
              />
            </Form.Item>
            <Form.Item name="currency" label="币种">
              <Select
                options={[{ value: 'CNY' }, { value: 'USD' }, { value: 'EUR' }, { value: 'GBP' }]}
                disabled={isSubmitted && isEdit}
              />
            </Form.Item>
            <Form.Item name="exchangeRate" label="汇率">
              <InputNumber style={{ width: '100%' }} min={0} precision={4} placeholder="自动填充" disabled={isSubmitted && isEdit} />
            </Form.Item>
            <Form.Item name="categoryId" label="分类" rules={[{ required: true }]}>
              <Select showSearch optionFilterProp="label" options={categoryOptions} placeholder="选择分类..." />
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
            <Form.Item name="exchangeRate" label="汇率">
              <InputNumber style={{ width: '100%' }} min={0} precision={4} placeholder="不同币种时填写" disabled={isSubmitted && isEdit} />
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

        <Form.Item name="summary" label="摘要" rules={[{ required: true, min: 2, max: 200 }]}>
          <Input placeholder="简要描述" />
        </Form.Item>

        <Form.Item name="remark" label="备注">
          <Input.TextArea rows={3} maxLength={500} showCount />
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
