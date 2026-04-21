import React from 'react';
import { Button, Typography } from 'antd';
import { Inbox } from 'lucide-react';

const { Title, Text } = Typography;

interface EmptyStateProps {
  title?: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
}

const EmptyState: React.FC<EmptyStateProps> = ({
  title = '暂无数据',
  description = '创建第一条记录开始使用。',
  actionLabel,
  onAction,
  icon,
}) => {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '64px 24px',
        textAlign: 'center',
      }}
    >
      <div style={{ marginBottom: 24, color: '#00B894', opacity: 0.6 }}>
        {icon ?? <Inbox size={64} strokeWidth={1} />}
      </div>
      <Title level={5} style={{ marginBottom: 8, color: '#1A2332' }}>
        {title}
      </Title>
      <Text style={{ color: '#6B7B8D', marginBottom: 24, maxWidth: 320 }}>
        {description}
      </Text>
      {actionLabel && onAction && (
        <Button type="primary" ghost onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;
