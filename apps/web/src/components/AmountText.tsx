import React from 'react';
import { formatAmount, getTransactionColor, getBalanceColor } from '@/theme/financial';

interface AmountTextProps {
  value: number;
  type?: 'income' | 'expense' | 'transfer' | 'refund' | 'balance';
  currency?: string;
  showSign?: boolean;
  size?: 'small' | 'default' | 'large' | 'hero';
  style?: React.CSSProperties;
}

const sizeMap = {
  small: { fontSize: 12, fontWeight: 500 },
  default: { fontSize: 14, fontWeight: 600 },
  large: { fontSize: 20, fontWeight: 600 },
  hero: { fontSize: 30, fontWeight: 700 },
};

const AmountText: React.FC<AmountTextProps> = ({
  value,
  type,
  currency = '¥',
  showSign = false,
  size = 'default',
  style,
}) => {
  const color = type === 'balance' ? getBalanceColor(value) : type ? getTransactionColor(type) : '#1A2332';
  const { fontSize, fontWeight } = sizeMap[size];

  return (
    <span
      className="amount-text"
      style={{
        color,
        fontSize,
        fontWeight,
        fontFamily: "var(--font-amount)",
        fontVariantNumeric: 'tabular-nums',
        textAlign: 'right',
        display: 'inline-block',
        ...style,
      }}
    >
      {formatAmount(value, { currency, showSign })}
    </span>
  );
};

export default AmountText;
