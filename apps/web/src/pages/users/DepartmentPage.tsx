import React, { useCallback, useEffect, useState } from 'react';
import { Button, Card, Input, Modal, Popconfirm, Space, Tree, Typography, message, Form, Select } from 'antd';
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import apiClient from '@/api/client';

interface Dept {
  id: number;
  name: string;
  parentId: number | null;
  code: string | null;
  status: string;
}

function buildTree(list: Dept[], parentId: number | null = null): DataNode[] {
  return list
    .filter((d) => d.parentId === parentId)
    .map((d) => ({
      key: d.id,
      title: d.name,
      children: buildTree(list, d.id),
    }));
}

const DepartmentPage: React.FC = () => {
  const [departments, setDepartments] = useState<Dept[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Dept | null>(null);
  const [form] = Form.useForm();

  const fetchDepts = useCallback(async () => {
    setLoading(true);
    try {
      const res = await apiClient.get('/departments');
      setDepartments(res.data?.data ?? []);
    } catch {
      message.error('加载部门失败');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchDepts(); }, [fetchDepts]);

  const openCreate = (parentId?: number) => {
    setEditing(null);
    form.resetFields();
    if (parentId) form.setFieldValue('parentId', parentId);
    setModalOpen(true);
  };

  const openEdit = (dept: Dept) => {
    setEditing(dept);
    form.setFieldsValue({ name: dept.name, parentId: dept.parentId, code: dept.code });
    setModalOpen(true);
  };

  const handleSave = async () => {
    const values = await form.validateFields();
    try {
      if (editing) {
        await apiClient.put(`/departments/${editing.id}`, values);
        message.success('部门已更新');
      } else {
        await apiClient.post('/departments', values);
        message.success('部门已创建');
      }
      setModalOpen(false);
      fetchDepts();
    } catch (err: any) {
      message.error(err?.response?.data?.message || '操作失败');
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/departments/${id}`);
      message.success('部门已删除');
      fetchDepts();
    } catch {
      message.error('删除失败');
    }
  };

  const treeData = buildTree(departments);

  const titleRender = (node: DataNode) => {
    const dept = departments.find((d) => d.id === node.key);
    return (
      <Space>
        <span>{node.title as string}</span>
        <a onClick={(e) => { e.stopPropagation(); openCreate(dept?.id); }} title="添加子部门">
          <PlusOutlined style={{ fontSize: 12 }} />
        </a>
        <a onClick={(e) => { e.stopPropagation(); if (dept) openEdit(dept); }} title="编辑">
          <EditOutlined style={{ fontSize: 12 }} />
        </a>
        <Popconfirm title="确定删除该部门？" onConfirm={() => handleDelete(dept!.id)}>
          <a onClick={(e) => e.stopPropagation()} title="删除" style={{ color: '#ff4d4f' }}>
            <DeleteOutlined style={{ fontSize: 12 }} />
          </a>
        </Popconfirm>
      </Space>
    );
  };

  return (
    <Card
      title={<Typography.Title level={4} style={{ margin: 0 }}>部门管理</Typography.Title>}
      extra={<Button type="primary" icon={<PlusOutlined />} onClick={() => openCreate()}>新建部门</Button>}
      loading={loading}
    >
      {treeData.length > 0 ? (
        <Tree
          defaultExpandAll
          treeData={treeData}
          titleRender={titleRender}
          blockNode
        />
      ) : (
        <Typography.Text type="secondary">暂无部门数据。</Typography.Text>
      )}

      <Modal
        title={editing ? '编辑部门' : '新建部门'}
        open={modalOpen}
        onOk={handleSave}
        onCancel={() => setModalOpen(false)}
      >
        <Form form={form} layout="vertical">
          <Form.Item name="name" label="名称" rules={[{ required: true }]}>
            <Input placeholder="部门名称" />
          </Form.Item>
          <Form.Item name="parentId" label="上级部门">
            <Select allowClear placeholder="无（顶级部门）">
              {departments.map((d) => (
                <Select.Option key={d.id} value={d.id}>{d.name}</Select.Option>
              ))}
            </Select>
          </Form.Item>
          <Form.Item name="code" label="编码">
            <Input placeholder="可选编码" />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  );
};

export default DepartmentPage;
