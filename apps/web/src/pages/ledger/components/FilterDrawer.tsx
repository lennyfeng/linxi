import React, { useEffect } from 'react';
import { Button, DatePicker, Drawer, Form, Select, Space } from 'antd';
import dayjs from 'dayjs';

const { RangePicker } = DatePicker;

interface FilterDrawerProps {
  open: boolean;
  onClose: () => void;
  onApply: (filters: FilterValues) => void;
  accounts: { id: number; accountName: string }[];
  categories: { id: number; categoryName: string; categoryType: string }[];
  initialValues?: Partial<FilterValues>;
}

export interface FilterValues {
  dateRange?: [string, string] | null;
  transactionTypes?: string[];
  accountIds?: number[];
  categoryIds?: number[];
  statuses?: string[];
}

const typeOptions = [
  { value: 'income', label: '收入' },
  { value: 'expense', label: '支出' },
  { value: 'transfer', label: '转账' },
  { value: 'refund', label: '退款' },
];

const statusOptions = [
  { value: 'submitted', label: '已提交' },
  { value: 'draft', label: '草稿' },
];

const FilterDrawer: React.FC<FilterDrawerProps> = ({
  open,
  onClose,
  onApply,
  accounts,
  categories,
  initialValues,
}) => {
  const [form] = Form.useForm();

  useEffect(() => {
    if (open && initialValues) {
      form.setFieldsValue({
        dateRange: initialValues.dateRange
          ? [dayjs(initialValues.dateRange[0]), dayjs(initialValues.dateRange[1])]
          : undefined,
        transactionTypes: initialValues.transactionTypes,
        accountIds: initialValues.accountIds,
        categoryIds: initialValues.categoryIds,
        statuses: initialValues.statuses,
      });
    }
  }, [open, initialValues, form]);

  const handleApply = () => {
    const values = form.getFieldsValue();
    const filters: FilterValues = {
      dateRange: values.dateRange
        ? [values.dateRange[0].format('YYYY-MM-DD'), values.dateRange[1].format('YYYY-MM-DD')]
        : null,
      transactionTypes: values.transactionTypes?.length ? values.transactionTypes : undefined,
      accountIds: values.accountIds?.length ? values.accountIds : undefined,
      categoryIds: values.categoryIds?.length ? values.categoryIds : undefined,
      statuses: values.statuses?.length ? values.statuses : undefined,
    };
    onApply(filters);
    onClose();
  };

  const handleReset = () => {
    form.resetFields();
    onApply({});
    onClose();
  };

  return (
    <Drawer
      title="筛选"
      open={open}
      onClose={onClose}
      width={360}
      footer={
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <Button onClick={handleReset}>重置</Button>
          <Space>
            <Button onClick={onClose}>取消</Button>
            <Button type="primary" onClick={handleApply}>应用</Button>
          </Space>
        </div>
      }
    >
      <Form form={form} layout="vertical">
        <Form.Item name="dateRange" label="日期范围">
          <RangePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="transactionTypes" label="类型">
          <Select
            mode="multiple"
            options={typeOptions}
            placeholder="全部类型"
            allowClear
          />
        </Form.Item>

        <Form.Item name="accountIds" label="账户">
          <Select
            mode="multiple"
            options={accounts.map((a) => ({ value: a.id, label: a.accountName }))}
            placeholder="全部账户"
            showSearch
            optionFilterProp="label"
            allowClear
          />
        </Form.Item>

        <Form.Item name="categoryIds" label="分类">
          <Select
            mode="multiple"
            options={categories.map((c) => ({ value: c.id, label: c.categoryName }))}
            placeholder="全部分类"
            showSearch
            optionFilterProp="label"
            allowClear
          />
        </Form.Item>

        <Form.Item name="statuses" label="状态">
          <Select
            mode="multiple"
            options={statusOptions}
            placeholder="全部状态"
            allowClear
          />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default FilterDrawer;
