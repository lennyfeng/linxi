import React from 'react';
import { Modal, Form, Input, Upload } from 'antd';

interface Props {
  open: boolean;
  submitting?: boolean;
  onOk: (values: Record<string, unknown>) => void;
  onCancel: () => void;
}

const DesignEvaluationModal: React.FC<Props> = ({ open, submitting, onOk, onCancel }) => {
  const [form] = Form.useForm();

  const submit = async () => {
    const values = await form.validateFields();
    onOk(values);
    form.resetFields();
  };

  return (
    <Modal open={open} title="产品设计评估" onCancel={onCancel} onOk={submit} confirmLoading={submitting} destroyOnHidden width={760}>
      <Form form={form} layout="vertical">
        <Form.Item name="targetUser" label="目标用户" rules={[{ required: true, message: '请输入目标用户' }]}><Input /></Form.Item>
        <Form.Item name="usageScenario" label="使用场景" rules={[{ required: true, message: '请输入使用场景' }]}><Input.TextArea rows={2} /></Form.Item>
        <Form.Item name="painPoints" label="痛点" rules={[{ required: true, message: '请输入痛点' }]}><Input.TextArea rows={2} /></Form.Item>
        <Form.Item name="designDirection" label="设计方向" rules={[{ required: true, message: '请输入设计方向' }]}><Input.TextArea rows={2} /></Form.Item>
        <Form.Item name="materialSuggestion" label="材料建议"><Input.TextArea rows={2} /></Form.Item>
        <Form.Item name="structureSuggestion" label="结构建议"><Input.TextArea rows={2} /></Form.Item>
        <Form.Item name="packageSuggestion" label="包装建议"><Input.TextArea rows={2} /></Form.Item>
        <Form.Item name="sellingPoints" label="卖点" rules={[{ required: true, message: '请输入卖点' }]}><Input.TextArea rows={2} /></Form.Item>
        <Form.Item name="attachments" label="附件">
          <Upload beforeUpload={() => false} multiple>
            <div>点击或拖拽上传（MVP 仅保留附件元数据）</div>
          </Upload>
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default DesignEvaluationModal;
