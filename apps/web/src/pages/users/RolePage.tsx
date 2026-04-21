import React, { useCallback, useEffect, useState } from 'react';
import {
  Button, Card, Checkbox, Drawer, Form, Input, Modal, Popconfirm, Space, Table, Tag, Typography, message,
} from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/api/client';

interface RoleRow {
  id: number;
  roleKey: string;
  roleName: string;
  description: string | null;
  status: string;
}

interface PermItem {
  permissionKey: string;
  permissionType: string;
}

const RolePage: React.FC = () => {
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<RoleRow | null>(null);
  const [form] = Form.useForm();

  // Permission drawer
  const [permDrawer, setPermDrawer] = useState(false);
  const [permRole, setPermRole] = useState<RoleRow | null>(null);
  const [allPerms, setAllPerms] = useState<PermItem[]>([]);
  const [rolePerms, setRolePerms] = useState<string[]>([]);
  const [permSaving, setPermSaving] = useState(false);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/roles');
      setRoles(res.data?.data ?? []);
    } catch {
      message.error('加载角色失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchRoles(); }, [fetchRoles]);

  const openCreate = () => {
    setEditing(null);
    form.resetFields();
    setModalOpen(true);
  };

  const openEdit = (role: RoleRow) => {
    setEditing(role);
    form.setFieldsValue({ roleKey: role.roleKey, roleName: role.roleName, description: role.description });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await apiClient.put(`/roles/${editing.id}`, values);
        message.success('角色已更新');
      } else {
        await apiClient.post('/roles', values);
        message.success('角色已创建');
      }
      setModalOpen(false);
      fetchRoles();
    } catch (err: any) {
      message.error(err?.response?.data?.message || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/roles/${id}`);
      message.success('角色已删除');
      fetchRoles();
    } catch {
      message.error('删除角色失败');
    }
  };

  const openPermissions = async (role: RoleRow) => {
    setPermRole(role);
    try {
      const [permsRes, rolePermsRes] = await Promise.all([
        apiClient.get('/permissions'),
        apiClient.get(`/roles/${role.id}/permissions`),
      ]);
      setAllPerms(permsRes.data?.data ?? []);
      setRolePerms((rolePermsRes.data?.data ?? []).map((p: PermItem) => p.permissionKey));
    } catch {
      message.error('加载权限失败');
    }
    setPermDrawer(true);
  };

  const handleSavePerms = async () => {
    if (!permRole) return;
    setPermSaving(true);
    try {
      await apiClient.put(`/roles/${permRole.id}/permissions`, { permissions: rolePerms });
      message.success('权限已保存');
      setPermDrawer(false);
    } catch {
      message.error('保存权限失败');
    } finally {
      setPermSaving(false);
    }
  };

  const columns: ColumnsType<RoleRow> = [
    { title: '角色标识', dataIndex: 'roleKey', width: 160 },
    { title: '角色名称', dataIndex: 'roleName', width: 160 },
    { title: '描述', dataIndex: 'description', render: (v) => v || '-' },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v) => <Tag color={v === 'active' ? 'green' : 'default'}>{v}</Tag>,
    },
    {
      title: '操作', width: 240,
      render: (_, record) => (
        <Space>
          <a onClick={() => openEdit(record)}>编辑</a>
          <a onClick={() => openPermissions(record)}>权限</a>
          <Popconfirm title="确定删除该角色？" onConfirm={() => handleDelete(record.id)}>
            <a style={{ color: '#ff4d4f' }}>删除</a>
          </Popconfirm>
        </Space>
      ),
    },
  ];

  // Group permissions by module
  const permGroups = allPerms.reduce<Record<string, PermItem[]>>((acc, p) => {
    const parts = p.permissionKey.split('.');
    const mod = parts[0] || 'general';
    if (!acc[mod]) acc[mod] = [];
    acc[mod].push(p);
    return acc;
  }, {});

  return (
    <>
      <Card
        title={<Typography.Title level={4} style={{ margin: 0 }}>角色与权限</Typography.Title>}
        extra={<Button type="primary" icon={<PlusOutlined />} onClick={openCreate}>新建角色</Button>}
      >
        <Table rowKey="id" columns={columns} dataSource={roles} loading={loading} pagination={false} />
      </Card>

      <Modal
        title={editing ? '编辑角色' : '新建角色'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="roleKey" label="角色标识" rules={[{ required: true }]}>
            <Input disabled={!!editing} placeholder="如 finance-manager" />
          </Form.Item>
          <Form.Item name="roleName" label="角色名称" rules={[{ required: true }]}>
            <Input placeholder="显示名称" />
          </Form.Item>
          <Form.Item name="description" label="描述">
            <Input.TextArea rows={2} />
          </Form.Item>
        </Form>
      </Modal>

      <Drawer
        title={`权限配置 - ${permRole?.roleName || ''}`}
        open={permDrawer}
        onClose={() => setPermDrawer(false)}
        width={480}
        footer={
          <Space style={{ float: 'right' }}>
            <Button onClick={() => setPermDrawer(false)}>取消</Button>
            <Button type="primary" loading={permSaving} onClick={handleSavePerms}>保存</Button>
          </Space>
        }
      >
        {Object.entries(permGroups).map(([mod, perms]) => (
          <div key={mod} style={{ marginBottom: 16 }}>
            <Typography.Text strong style={{ textTransform: 'capitalize' }}>{mod}</Typography.Text>
            <div style={{ marginTop: 8 }}>
              <Checkbox.Group
                value={rolePerms.filter((k) => perms.some((p) => p.permissionKey === k))}
                onChange={(checked) => {
                  const modKeys = perms.map((p) => p.permissionKey);
                  const others = rolePerms.filter((k) => !modKeys.includes(k));
                  setRolePerms([...others, ...(checked as string[])]);
                }}
                options={perms.map((p) => ({ label: p.permissionKey, value: p.permissionKey }))}
              />
            </div>
          </div>
        ))}
        {allPerms.length === 0 && (
          <Typography.Text type="secondary">暂无权限定义。请在权限表中添加。</Typography.Text>
        )}
      </Drawer>
    </>
  );
};

export default RolePage;
