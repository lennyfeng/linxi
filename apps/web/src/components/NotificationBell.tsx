import React, { useEffect, useState } from 'react';
import { Badge, Dropdown, List, Button, Typography } from 'antd';
import { BellOutlined, CheckOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import apiClient from '@/api/client';

interface NotificationItem {
  id: number;
  type: string;
  title: string;
  content: string | null;
  link: string | null;
  is_read: number;
  created_at: string;
}

const NotificationBell: React.FC = () => {
  const navigate = useNavigate();
  const [count, setCount] = useState(0);
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [open, setOpen] = useState(false);

  const loadCount = async () => {
    try {
      const res = await apiClient.get('/notifications/unread-count');
      setCount(res.data?.data?.count ?? 0);
    } catch { /* ignore */ }
  };

  const loadRecent = async () => {
    try {
      const res = await apiClient.get('/notifications?pageSize=5');
      setItems(res.data?.data?.items ?? []);
    } catch { /* ignore */ }
  };

  useEffect(() => {
    loadCount();
    const timer = setInterval(loadCount, 30000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (open) loadRecent();
  }, [open]);

  const handleMarkRead = async (id: number) => {
    try { await apiClient.put(`/notifications/${id}/read`); loadCount(); loadRecent(); } catch { /* ignore */ }
  };

  const dropdownContent = (
    <div style={{ width: 360, background: '#FFF', borderRadius: 8, boxShadow: '0 6px 16px rgba(0,0,0,0.08)', padding: 0 }}>
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0F0F0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography.Text strong>通知</Typography.Text>
        <Button size="small" type="link" onClick={() => { setOpen(false); navigate('/notifications'); }}>查看全部</Button>
      </div>
      <List
        size="small"
        dataSource={items}
        locale={{ emptyText: '暂无通知' }}
        renderItem={(n) => (
          <List.Item style={{ padding: '10px 16px' }} actions={
            n.is_read ? [] : [<Button key="r" size="small" type="text" icon={<CheckOutlined />} onClick={() => handleMarkRead(n.id)} />]
          }>
            <List.Item.Meta
              title={<span style={{ fontWeight: n.is_read ? 400 : 600 }}>{n.title}</span>}
              description={<span style={{ fontSize: 11, color: '#8C8C8C' }}>{n.created_at?.replace('T', ' ').slice(0, 16)}</span>}
            />
          </List.Item>
        )}
      />
    </div>
  );

  return (
    <Dropdown dropdownRender={() => dropdownContent} trigger={['click']} open={open} onOpenChange={setOpen} placement="bottomRight">
      <Badge count={count} size="small" offset={[-2, 2]}>
        <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
      </Badge>
    </Dropdown>
  );
};

export default NotificationBell;
