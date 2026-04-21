import React, { useState } from 'react';
import { Avatar, Button, Card, Col, Descriptions, Form, Input, Row, Typography, message } from 'antd';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/api/client';

const PersonalCenter: React.FC = () => {
  const user = useAuthStore((s) => s.user);
  const [loading, setLoading] = useState(false);
  const [form] = Form.useForm();

  const handleChangePassword = async () => {
    const values = await form.validateFields();
    if (values.newPassword !== values.confirmPassword) {
      message.error('两次密码不一致');
      return;
    }
    setLoading(true);
    try {
      await apiClient.post('/auth/change-password', {
        oldPassword: values.oldPassword,
        newPassword: values.newPassword,
      });
      message.success('密码修改成功');
      form.resetFields();
    } catch (err: any) {
      message.error(err?.response?.data?.message || '修改密码失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Row gutter={24}>
      <Col span={12}>
        <Card title={<Typography.Title level={4} style={{ margin: 0 }}>个人信息</Typography.Title>}>
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <Avatar size={80} style={{ backgroundColor: '#00B894', fontSize: 32 }}>
              {user?.displayName?.[0] ?? 'U'}
            </Avatar>
            <Typography.Title level={5} style={{ marginTop: 12, marginBottom: 0 }}>
              {user?.displayName ?? 'User'}
            </Typography.Title>
            <Typography.Text type="secondary">@{user?.username ?? ''}</Typography.Text>
          </div>
          <Descriptions column={1} bordered size="small">
            <Descriptions.Item label="用户名">{user?.username ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="邮箱">{user?.email ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="电话">{user?.phone ?? '-'}</Descriptions.Item>
            <Descriptions.Item label="状态">{user?.status ?? '-'}</Descriptions.Item>
          </Descriptions>
        </Card>
      </Col>
      <Col span={12}>
        <Card title={<Typography.Title level={4} style={{ margin: 0 }}>修改密码</Typography.Title>}>
          <Form form={form} layout="vertical" onFinish={handleChangePassword}>
            <Form.Item name="oldPassword" label="当前密码" rules={[{ required: true }]}>
              <Input.Password placeholder="请输入当前密码" />
            </Form.Item>
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
            <Button type="primary" htmlType="submit" loading={loading} block>
              修改密码
            </Button>
          </Form>
        </Card>
      </Col>
    </Row>
  );
};

export default PersonalCenter;
