export const FINANCIAL_COLORS = {
  income: '#00B894',
  expense: '#FF6B6B',
  transfer: '#4ECDC4',
  refund: '#FFA502',
  balancePositive: '#00B894',
  balanceNegative: '#FF6B6B',
} as const;

export const CATEGORY_ICON_COLORS = [
  '#FF6B6B', // operating expenses
  '#FFA502', // procurement cost
  '#FECA57', // logistics
  '#00B894', // main revenue
  '#4ECDC4', // refund/tax rebate
  '#1890FF', // platform fees
  '#6C5CE7', // HR cost
  '#A29BFE', // admin/office
  '#FDA7DF', // marketing
  '#78E08F', // interest/investment
  '#82CCDD', // tax
  '#B8B8B8', // other
] as const;

export type TransactionColorType = keyof typeof FINANCIAL_COLORS;

export function getTransactionColor(type: string): string {
  switch (type) {
    case 'income':
      return FINANCIAL_COLORS.income;
    case 'expense':
      return FINANCIAL_COLORS.expense;
    case 'transfer':
      return FINANCIAL_COLORS.transfer;
    case 'refund':
      return FINANCIAL_COLORS.refund;
    default:
      return '#6B7B8D';
  }
}

export function getBalanceColor(amount: number): string {
  return amount >= 0 ? FINANCIAL_COLORS.balancePositive : FINANCIAL_COLORS.balanceNegative;
}

export function formatAmount(
  value: number,
  options?: { currency?: string; showSign?: boolean; decimals?: number }
): string {
  const { currency = '¥', showSign = false, decimals = 2 } = options ?? {};
  const abs = Math.abs(value);
  const formatted = abs.toLocaleString('en-US', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  });
  const sign = showSign ? (value > 0 ? '+' : value < 0 ? '-' : '') : value < 0 ? '-' : '';
  return `${sign}${currency}${formatted}`;
}
