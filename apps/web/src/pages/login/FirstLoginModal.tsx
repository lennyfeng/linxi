import React, { useState } from 'react';
import { Modal, Form, Input, Button, message } from 'antd';
import axios from 'axios';

interface Props {
  open: boolean;
  token: string;
  onSuccess: () => void;
  onCancel: () => void;
}

const FirstLoginModal: React.FC<Props> = ({ open, token, onSuccess, onCancel }) => {
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    const values = await form.validateFields();
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次密码不一致');
      return;
    }
    setLoading(true);
    try {
      await axios.post('/api/auth/change-password', {
        newPassword: values.newPassword,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      form.resetFields();
      onSuccess();
    } catch (err: any) {
      message.error(err?.response?.data?.message || '修改密码失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      title="修改密码"
      open={open}
      onCancel={onCancel}
      footer={null}
      closable={false}
      maskClosable={false}
    >
      <p style={{ marginBottom: 16, color: '#666' }}>
        首次登录请修改密码。
      </p>
      <Form form={form} layout="vertical">
        <Form.Item
          name="newPassword"
          label="新密码"
          rules={[
            { required: true, message: '请输入新密码' },
            { min: 6, message: '密码至少6位' },
          ]}
        >
          <Input.Password placeholder="请输入新密码" />
        </Form.Item>
        <Form.Item
          name="confirmPassword"
          label="确认密码"
          rules={[{ required: true, message: '请确认密码' }]}
        >
          <Input.Password placeholder="请再次输入新密码" />
        </Form.Item>
        <Button type="primary" block loading={loading} onClick={handleSubmit}>
          修改密码
        </Button>
      </Form>
    </Modal>
  );
};

export default FirstLoginModal;
