import React, { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Card,
  Col,
  Input,
  message,
  Row,
  Tree,
  Typography,
} from 'antd';
import { PlusOutlined, EditOutlined } from '@ant-design/icons';
import type { DataNode } from 'antd/es/tree';
import apiClient from '@/api/client';

interface Category {
  id: number;
  categoryName: string;
  categoryType: string;
  parentId: number | null;
  sortNo: number;
  status: string;
}

const CategoryPage: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [addingParent, setAddingParent] = useState<string | null>(null);
  const [addingName, setAddingName] = useState('');
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingName, setEditingName] = useState('');

  const fetch = useCallback(() => {
    setLoading(true);
    apiClient
      .get('/ledger/categories?pageSize=500')
      .then((r) => setCategories(r.data?.data?.list ?? []))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const buildTree = (type: string): DataNode[] => {
    const items = categories.filter((c) => c.categoryType === type);
    const roots = items.filter((c) => !c.parentId);
    const children = items.filter((c) => c.parentId);

    return roots.map((root) => ({
      key: root.id,
      title: renderNode(root),
      children: children
        .filter((c) => c.parentId === root.id)
        .sort((a, b) => a.sortNo - b.sortNo)
        .map((child) => ({
          key: child.id,
          title: renderNode(child),
        })),
    }));
  };

  const renderNode = (cat: Category) => {
    if (editingId === cat.id) {
      return (
        <Input
          size="small"
          value={editingName}
          onChange={(e) => setEditingName(e.target.value)}
          onPressEnter={async () => {
            if (!editingName.trim()) return;
            await apiClient.put(`/ledger/categories/${cat.id}`, { categoryName: editingName.trim() });
            setEditingId(null);
            fetch();
          }}
          onBlur={() => setEditingId(null)}
          style={{ width: 150 }}
          autoFocus
        />
      );
    }
    return (
      <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
        {cat.categoryName}
        <Button
          type="text"
          size="small"
          icon={<EditOutlined />}
          onClick={(e) => { e.stopPropagation(); setEditingId(cat.id); setEditingName(cat.categoryName); }}
        />
        {!cat.parentId && (
          <Button
            type="text"
            size="small"
            icon={<PlusOutlined />}
            onClick={(e) => { e.stopPropagation(); setAddingParent(`${cat.categoryType}:${cat.id}`); setAddingName(''); }}
          />
        )}
      </span>
    );
  };

  const handleAddChild = async (parentId: number, type: string) => {
    if (!addingName.trim()) { setAddingParent(null); return; }
    await apiClient.post('/ledger/categories', {
      categoryName: addingName.trim(),
      categoryType: type,
      parentId,
      sortNo: 0,
      status: 'active',
    });
    message.success('分类已添加');
    setAddingParent(null);
    fetch();
  };

  const handleAddRoot = async (type: string) => {
    if (!addingName.trim()) { setAddingParent(null); return; }
    await apiClient.post('/ledger/categories', {
      categoryName: addingName.trim(),
      categoryType: type,
      parentId: null,
      sortNo: 0,
      status: 'active',
    });
    message.success('分类已添加');
    setAddingParent(null);
    fetch();
  };

  const renderPanel = (type: string, title: string, color: string) => (
    <Card
      title={<Typography.Text style={{ color, fontWeight: 600, fontSize: 16 }}>{title}</Typography.Text>}
      loading={loading}
      style={{ height: '100%' }}
    >
      <Tree
        treeData={buildTree(type)}
        defaultExpandAll
        showLine
        selectable={false}
        blockNode
      />
      {addingParent?.startsWith(`${type}:`) && (
        <div style={{ marginTop: 8, paddingLeft: 24 }}>
          <Input
            size="small"
            placeholder="新子分类..."
            value={addingName}
            onChange={(e) => setAddingName(e.target.value)}
            onPressEnter={() => handleAddChild(Number(addingParent.split(':')[1]), type)}
            onBlur={() => setAddingParent(null)}
            style={{ width: 200 }}
            autoFocus
          />
        </div>
      )}
      {addingParent === `root:${type}` ? (
        <div style={{ marginTop: 12 }}>
          <Input
            size="small"
            placeholder="新父分类..."
            value={addingName}
            onChange={(e) => setAddingName(e.target.value)}
            onPressEnter={() => handleAddRoot(type)}
            onBlur={() => setAddingParent(null)}
            style={{ width: 200 }}
            autoFocus
          />
        </div>
      ) : (
        <Button
          type="dashed"
          block
          icon={<PlusOutlined />}
          style={{ marginTop: 12 }}
          onClick={() => { setAddingParent(`root:${type}`); setAddingName(''); }}
        >
          添加父分类
        </Button>
      )}
    </Card>
  );

  return (
    <div style={{ padding: 24 }}>
      <Typography.Title level={4}>分类管理</Typography.Title>
      <Row gutter={24}>
        <Col span={12}>{renderPanel('expense', '支出', '#FF6B6B')}</Col>
        <Col span={12}>{renderPanel('income', '收入', '#00B894')}</Col>
      </Row>
    </div>
  );
};

export default CategoryPage;
