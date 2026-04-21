import React, { useState } from 'react';
import { Form, Input, Button, Checkbox, Card, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import apiClient from '@/api/client';
import FirstLoginModal from './FirstLoginModal';

const { Title, Text } = Typography;

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [loading, setLoading] = useState(false);
  const [mustChangePassword, setMustChangePassword] = useState(false);
  const [tempToken, setTempToken] = useState('');

  const onFinish = async (values: { username: string; password: string; remember: boolean }) => {
    setLoading(true);
    try {
      const res = await apiClient.post('/auth/login', {
        username: values.username,
        password: values.password,
      });
      const data = res.data?.data;
      if (!data?.access_token) {
        message.error('登录失败');
        return;
      }

      const user = {
        id: data.user?.id ?? 0,
        username: data.user?.username ?? values.username,
        displayName: data.user?.name ?? data.user?.username ?? values.username,
        email: data.user?.email ?? null,
        phone: data.user?.mobile ?? null,
        avatar: data.user?.avatar_url ?? null,
        departmentId: data.user?.department_id ?? null,
        lingxingUid: null,
        status: (data.user?.account_status ?? 'active') as 'active' | 'disabled',
        mustChangePassword: Boolean(data.must_change_password),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const permissions = data.user?.permissions?.actions ?? ['*'];

      if (data.must_change_password) {
        setTempToken(data.access_token);
        setMustChangePassword(true);
        return;
      }

      setAuth(user, data.access_token, data.refresh_token || '', permissions);
      navigate('/');
    } catch (err: any) {
      const msg = err?.response?.data?.message || '登录失败';
      message.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChanged = () => {
    setMustChangePassword(false);
    setTempToken('');
    message.success('密码已修改，请重新登录');
  };

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'linear-gradient(135deg, #E8FBF5 0%, #F5F7FA 100%)',
    }}>
      <Card style={{ width: 400, borderRadius: 12, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}>
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <Title level={3} style={{ color: '#00B894', marginBottom: 4 }}>霖淅</Title>
          <Text type="secondary">内部管理平台</Text>
        </div>
        <Form layout="vertical" onFinish={onFinish} autoComplete="off">
          <Form.Item name="username" rules={[{ required: true, message: '请输入用户名' }]}>
            <Input size="large" placeholder="用户名" />
          </Form.Item>
          <Form.Item name="password" rules={[{ required: true, message: '请输入密码' }]}>
            <Input.Password size="large" placeholder="密码" />
          </Form.Item>
          <Form.Item name="remember" valuePropName="checked" initialValue={true}>
            <Checkbox>记住我</Checkbox>
          </Form.Item>
          <Form.Item>
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              登 录
            </Button>
          </Form.Item>
        </Form>
      </Card>
      <FirstLoginModal
        open={mustChangePassword}
        token={tempToken}
        onSuccess={handlePasswordChanged}
        onCancel={() => setMustChangePassword(false)}
      />
    </div>
  );
};

export default LoginPage;
