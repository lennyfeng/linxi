import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Button, Card, Input, Select, Space, Table, Tag, Popconfirm, message, Tooltip, Typography,
} from 'antd';
import { PlusOutlined, ReloadOutlined, SearchOutlined, LockOutlined } from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import apiClient from '@/api/client';
import UserFormDrawer from './UserFormDrawer';

interface UserRow {
  id: number;
  name: string;
  username: string;
  email: string | null;
  mobile: string | null;
  sourceType: string;
  departmentId: number | null;
  departmentName: string | null;
  status: string;
  lastLoginAt: string | null;
  createdAt: string;
}

interface Pagination {
  page: number;
  page_size: number;
  total: number;
}

const UserListPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserRow[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, page_size: 20, total: 0 });
  const [keyword, setKeyword] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserRow | null>(null);
  const searchRef = useRef(keyword);
  searchRef.current = keyword;

  const fetchUsers = useCallback(async (page = 1, pageSize = 20) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('pageSize', String(pageSize));
      if (searchRef.current) params.set('keyword', searchRef.current);
      if (statusFilter) params.set('status', statusFilter);

      const res = await apiClient.get(`/users?${params.toString()}`);
      const data = res.data?.data;
      setUsers(data?.list ?? []);
      setPagination(data?.pagination ?? { page, page_size: pageSize, total: 0 });
    } catch {
      message.error('加载用户失败');
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  const handleToggleStatus = async (id: number, current: string) => {
    const action = current === 'active' ? 'disable' : 'enable';
    try {
      await apiClient.post(`/users/${id}/${action}`);
      message.success(action === 'disable' ? '已禁用' : '已启用');
      fetchUsers(pagination.page, pagination.page_size);
    } catch {
      message.error('操作失败');
    }
  };

  const handleResetPwd = async (id: number) => {
    try {
      await apiClient.post(`/users/${id}/reset-password`, {});
      message.success('密码已重置为默认密码 (linxi123)');
    } catch {
      message.error('重置密码失败');
    }
  };

  const columns: ColumnsType<UserRow> = [
    { title: 'ID', dataIndex: 'id', width: 60 },
    { title: '用户名', dataIndex: 'username', width: 120 },
    { title: '姓名', dataIndex: 'name', width: 120 },
    { title: '邮箱', dataIndex: 'email', width: 180, render: (v) => v || '-' },
    { title: '手机', dataIndex: 'mobile', width: 130, render: (v) => v || '-' },
    { title: '部门', dataIndex: 'departmentName', width: 120, render: (v) => v || '-' },
    { title: '来源', dataIndex: 'sourceType', width: 80, render: (v) => <Tag>{v}</Tag> },
    {
      title: '状态', dataIndex: 'status', width: 80,
      render: (v) => <Tag color={v === 'active' ? 'green' : 'red'}>{v}</Tag>,
    },
    {
      title: '最近登录', dataIndex: 'lastLoginAt', width: 160,
      render: (v) => v ? new Date(v).toLocaleString() : '-',
    },
    {
      title: '操作', width: 200, fixed: 'right',
      render: (_, record) => (
        <Space size="small">
          <a onClick={() => { setEditingUser(record); setDrawerOpen(true); }}>编辑</a>
          <Popconfirm
            title={`确定${record.status === 'active' ? '禁用' : '启用'}该用户？`}
            onConfirm={() => handleToggleStatus(record.id, record.status)}
          >
            <a style={{ color: record.status === 'active' ? '#ff4d4f' : '#52c41a' }}>
              {record.status === 'active' ? '禁用' : '启用'}
            </a>
          </Popconfirm>
          <Tooltip title="重置密码为默认值">
            <Popconfirm title="确定重置密码？" onConfirm={() => handleResetPwd(record.id)}>
              <a><LockOutlined /></a>
            </Popconfirm>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <>
      <Card
        title={<Typography.Title level={4} style={{ margin: 0 }}>用户管理</Typography.Title>}
        extra={
          <Button type="primary" icon={<PlusOutlined />} onClick={() => { setEditingUser(null); setDrawerOpen(true); }}>
            新建用户
          </Button>
        }
      >
        <Space style={{ marginBottom: 16 }} wrap>
          <Input
            placeholder="搜索姓名 / 用户名 / 邮箱"
            prefix={<SearchOutlined />}
            allowClear
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onPressEnter={() => fetchUsers(1, pagination.page_size)}
            style={{ width: 260 }}
          />
          <Select
            value={statusFilter}
            onChange={(v) => setStatusFilter(v)}
            style={{ width: 120 }}
            options={[
              { label: '全部状态', value: '' },
              { label: '活跃', value: 'active' },
              { label: '已禁用', value: 'disabled' },
            ]}
          />
          <Button icon={<ReloadOutlined />} onClick={() => fetchUsers(1, pagination.page_size)}>
            搜索
          </Button>
        </Space>
        <Table
          rowKey="id"
          columns={columns}
          dataSource={users}
          loading={loading}
          scroll={{ x: 1200 }}
          pagination={{
            current: pagination.page,
            pageSize: pagination.page_size,
            total: pagination.total,
            showSizeChanger: true,
            showTotal: (t) => `共 ${t} 条`,
            onChange: (p, ps) => fetchUsers(p, ps),
          }}
        />
      </Card>
      <UserFormDrawer
        open={drawerOpen}
        user={editingUser}
        onClose={() => { setDrawerOpen(false); setEditingUser(null); }}
        onSuccess={() => { setDrawerOpen(false); setEditingUser(null); fetchUsers(pagination.page, pagination.page_size); }}
      />
    </>
  );
};

export default UserListPage;
