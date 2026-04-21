import React from 'react';
import { FINANCIAL_COLORS } from '@/theme/financial';
import type { TransactionType } from '@internal-platform/shared';

const typeConfig: Record<TransactionType, { label: string; color: string }> = {
  income: { label: '收入', color: FINANCIAL_COLORS.income },
  expense: { label: '支出', color: FINANCIAL_COLORS.expense },
  transfer: { label: '转账', color: FINANCIAL_COLORS.transfer },
  refund: { label: '退款', color: FINANCIAL_COLORS.refund },
};

interface TransactionTypeTagProps {
  type: TransactionType;
}

const TransactionTypeTag: React.FC<TransactionTypeTagProps> = ({ type }) => {
  const config = typeConfig[type] ?? typeConfig.expense;

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '2px 8px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 500,
        color: config.color,
        backgroundColor: `${config.color}1A`,
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          backgroundColor: config.color,
        }}
      />
      {config.label}
    </span>
  );
};

export default TransactionTypeTag;
