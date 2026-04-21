import React from 'react';

type BadgeVariant = 'draft' | 'submitted' | 'running' | 'failed' | 'success' | 'linked' | 'partial' | 'idle' | 'retry';

const variantConfig: Record<BadgeVariant, { dotColor: string; textColor: string; bgColor: string; label: string }> = {
  draft: { dotColor: '#A0AEC0', textColor: '#6B7B8D', bgColor: '#F5F7FA', label: '草稿' },
  submitted: { dotColor: '#52C41A', textColor: '#389E0D', bgColor: '#F6FFED', label: '已提交' },
  running: { dotColor: '#1890FF', textColor: '#096DD9', bgColor: '#E6F7FF', label: '运行中' },
  failed: { dotColor: '#FF4D4F', textColor: '#CF1322', bgColor: '#FFF1F0', label: '失败' },
  success: { dotColor: '#52C41A', textColor: '#389E0D', bgColor: '#F6FFED', label: '成功' },
  linked: { dotColor: '#00B894', textColor: '#00B894', bgColor: '#E8FBF5', label: '已关联' },
  partial: { dotColor: '#FAAD14', textColor: '#D48806', bgColor: '#FFFBE6', label: '部分' },
  idle: { dotColor: '#A0AEC0', textColor: '#6B7B8D', bgColor: '#F5F7FA', label: '空闲' },
  retry: { dotColor: '#FAAD14', textColor: '#D48806', bgColor: '#FFFBE6', label: '重试' },
};

interface StatusBadgeProps {
  status: BadgeVariant;
  label?: string;
  pulse?: boolean;
}

const StatusBadge: React.FC<StatusBadgeProps> = ({ status, label, pulse }) => {
  const config = variantConfig[status] ?? variantConfig.draft;
  const showPulse = pulse ?? status === 'running';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 500,
        color: config.textColor,
        backgroundColor: config.bgColor,
        lineHeight: '20px',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: config.dotColor,
          flexShrink: 0,
          animation: showPulse ? 'pulse 1.5s ease-in-out infinite' : undefined,
        }}
      />
      {label ?? config.label}
      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }`}</style>
    </span>
  );
};

export default StatusBadge;
