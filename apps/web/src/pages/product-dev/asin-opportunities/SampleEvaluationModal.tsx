import React from 'react';
import { Form, Input, InputNumber, Modal, Select } from 'antd';

interface Props {
  open: boolean;
  submitting?: boolean;
  onOk: (values: Record<string, unknown>) => void;
  onCancel: () => void;
}

const SampleEvaluationModal: React.FC<Props> = ({ open, submitting, onOk, onCancel }) => {
  const [form] = Form.useForm();

  const submit = async () => {
    const values = await form.validateFields();
    onOk(values);
    form.resetFields();
  };

  return (
    <Modal open={open} title="成本与打样评估" onCancel={onCancel} onOk={submit} confirmLoading={submitting} destroyOnHidden width={680}>
      <Form form={form} layout="vertical">
        <Form.Item name="targetPrice" label="目标售价" rules={[{ required: true, message: '请输入目标售价' }]}><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="estimatedCost" label="预估成本" rules={[{ required: true, message: '请输入预估成本' }]}><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="grossMargin" label="预估毛利率"><InputNumber min={0} max={100} precision={2} addonAfter="%" style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="moq" label="MOQ"><InputNumber min={0} precision={0} style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="supplier" label="供应商"><Input /></Form.Item>
        <Form.Item name="sampleCost" label="打样费用"><InputNumber min={0} precision={2} style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="sampleCycleDays" label="打样周期（天）"><InputNumber min={0} precision={0} style={{ width: '100%' }} /></Form.Item>
        <Form.Item name="decision" label="评估结论" rules={[{ required: true, message: '请选择评估结论' }]}>
          <Select
            options={[
              { value: 'approve_sampling', label: '允许打样' },
              { value: 'hold', label: '暂缓，继续评估' },
              { value: 'reject', label: '终止机会' },
            ]}
          />
        </Form.Item>
        <Form.Item name="comment" label="原因/备注"><Input.TextArea rows={3} placeholder="暂缓或终止时必须说明原因" /></Form.Item>
      </Form>
    </Modal>
  );
};

export default SampleEvaluationModal;
