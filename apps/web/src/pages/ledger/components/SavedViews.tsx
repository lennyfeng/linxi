import React, { useEffect, useState } from 'react';
import { Dropdown, Button, Input, message, Popconfirm } from 'antd';
import { BookOutlined, PlusOutlined, DeleteOutlined, StarOutlined } from '@ant-design/icons';
import apiClient from '@/api/client';

interface SavedView {
  id: number;
  name: string;
  config: Record<string, unknown>;
  is_default: number;
}

interface SavedViewsProps {
  module: string;
  onApply: (config: Record<string, unknown>) => void;
  currentConfig: Record<string, unknown>;
}

const SavedViews: React.FC<SavedViewsProps> = ({ module, onApply, currentConfig }) => {
  const [views, setViews] = useState<SavedView[]>([]);
  const [open, setOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async () => {
    try {
      const res = await apiClient.get(`/saved-views?module=${module}`);
      setViews(res.data?.data?.items ?? res.data?.data ?? []);
    } catch { /* ignore */ }
  };

  useEffect(() => { load(); }, [module]);

  const handleSave = async () => {
    if (!newName.trim()) return;
    setSaving(true);
    try {
      await apiClient.post('/saved-views', { module, name: newName.trim(), config: currentConfig });
      message.success('视图已保存');
      setNewName('');
      load();
    } catch { message.error('保存视图失败'); }
    setSaving(false);
  };

  const handleDelete = async (id: number) => {
    try {
      await apiClient.delete(`/saved-views/${id}`);
      message.success('视图已删除');
      load();
    } catch { message.error('删除失败'); }
  };

  const dropdownContent = (
    <div style={{ padding: 12, minWidth: 240, background: '#FFF', borderRadius: 8, boxShadow: '0 6px 16px rgba(0,0,0,0.08)' }}>
      {views.length === 0 ? (
        <div style={{ color: '#8C8C8C', padding: '8px 0', textAlign: 'center' }}>暂无保存的视图</div>
      ) : (
        views.map((v) => (
          <div key={v.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px 0', borderBottom: '1px solid #F5F5F5' }}>
            <a onClick={() => { onApply(v.config); setOpen(false); }} style={{ flex: 1 }}>
              {v.is_default ? <StarOutlined style={{ color: '#FAAD14', marginRight: 4 }} /> : null}
              {v.name}
            </a>
            <Popconfirm title="删除此视图？" onConfirm={() => handleDelete(v.id)} okText="是" cancelText="否">
              <Button type="text" size="small" danger icon={<DeleteOutlined />} />
            </Popconfirm>
          </div>
        ))
      )}
      <div style={{ marginTop: 8, display: 'flex', gap: 6 }}>
        <Input size="small" placeholder="新视图名称..." value={newName} onChange={(e) => setNewName(e.target.value)} onPressEnter={handleSave} />
        <Button size="small" type="primary" icon={<PlusOutlined />} onClick={handleSave} loading={saving}>保存</Button>
      </div>
    </div>
  );

  return (
    <Dropdown dropdownRender={() => dropdownContent} trigger={['click']} open={open} onOpenChange={setOpen} placement="bottomRight">
      <Button icon={<BookOutlined />} size="small">
        视图 {views.length > 0 ? `(${views.length})` : ''}
      </Button>
    </Dropdown>
  );
};

export default SavedViews;
