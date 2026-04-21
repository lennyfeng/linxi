import React, { useEffect, useState } from 'react';
import { Drawer, Form, Input, Select, Button, Space, message } from 'antd';
import apiClient from '@/api/client';

interface UserRow {
  id: number;
  name: string;
  username: string;
  email: string | null;
  mobile: string | null;
  departmentId: number | null;
  status: string;
}

interface Props {
  open: boolean;
  user: UserRow | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface DeptOption { id: number; name: string }
interface RoleOption { id: number; roleName: string; roleKey: string }

const UserFormDrawer: React.FC<Props> = ({ open, user, onClose, onSuccess }) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);
  const [departments, setDepartments] = useState<DeptOption[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const isEdit = !!user;

  useEffect(() => {
    if (open) {
      apiClient.get('/departments').then((r) => setDepartments(r.data?.data ?? [])).catch(() => {});
      apiClient.get('/roles').then((r) => setRoles(r.data?.data ?? [])).catch(() => {});
      if (user) {
        form.setFieldsValue({
          username: user.username,
          name: user.name,
          email: user.email || '',
          mobile: user.mobile || '',
          departmentId: user.departmentId,
          status: user.status,
        });
      } else {
        form.resetFields();
      }
    }
  }, [open, user, form]);

  const handleSubmit = async () => {
    const values = await form.validateFields();
    setLoading(true);
    try {
      if (isEdit) {
        await apiClient.put(`/users/${user!.id}`, values);
        message.success('用户已更新');
      } else {
        await apiClient.post('/users', values);
        message.success('用户已创建');
      }
      onSuccess();
    } catch (err: any) {
      message.error(err?.response?.data?.message || '操作失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Drawer
      title={isEdit ? '编辑用户' : '新建用户'}
      open={open}
      onClose={onClose}
      width={480}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={onClose}>取消</Button>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            {isEdit ? '保存' : '创建'}
          </Button>
        </Space>
      }
    >
      <Form form={form} layout="vertical" initialValues={{ status: 'active', sourceType: 'local' }}>
        <Form.Item name="username" label="用户名" rules={[{ required: true }]}>
          <Input disabled={isEdit} placeholder="登录用户名" />
        </Form.Item>
        <Form.Item name="name" label="显示名称" rules={[{ required: true }]}>
          <Input placeholder="姓名" />
        </Form.Item>
        {!isEdit && (
          <Form.Item name="password" label="初始密码" extra="留空则无密码，用户可在首次登录时设置。">
            <Input.Password placeholder="可选初始密码" />
          </Form.Item>
        )}
        <Form.Item name="email" label="邮箱">
          <Input placeholder="邮箱地址" />
        </Form.Item>
        <Form.Item name="mobile" label="手机">
          <Input placeholder="手机号码" />
        </Form.Item>
        <Form.Item name="departmentId" label="部门">
          <Select allowClear placeholder="选择部门">
            {departments.map((d) => (
              <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
        {!isEdit && (
          <Form.Item name="roleIds" label="角色">
            <Select mode="multiple" allowClear placeholder="分配角色">
              {roles.map((r) => (
                <Select.Option key={r.id} value={r.id}>{r.roleName}</Select.Option>
              ))}
            </Select>
          </Form.Item>
        )}
        <Form.Item name="status" label="状态">
          <Select options={[{ label: '活跃', value: 'active' }, { label: '已禁用', value: 'disabled' }]} />
        </Form.Item>
      </Form>
    </Drawer>
  );
};

export default UserFormDrawer;
