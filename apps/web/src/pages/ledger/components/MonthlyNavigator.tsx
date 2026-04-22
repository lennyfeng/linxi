import React, { useEffect, useState } from 'react';
import { Collapse, Spin } from 'antd';
import apiClient from '@/api/client';

interface MonthlySummaryItem {
  year: number;
  month: number;
  income: number;
  expense: number;
  balance: number;
}

interface MonthlyNavigatorProps {
  activeYear: number;
  activeMonth: number;
  onMonthSelect: (year: number, month: number) => void;
}

const fmt = (n: number) =>
  Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const MonthlyNavigator: React.FC<MonthlyNavigatorProps> = ({ activeYear, activeMonth, onMonthSelect }) => {
  const [data, setData] = useState<MonthlySummaryItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    apiClient
      .get('/ledger/monthly-summary')
      .then((res) => setData(res.data?.data ?? res.data ?? []))
      .finally(() => setLoading(false));
  }, []);

  const grouped = data.reduce<Record<number, MonthlySummaryItem[]>>((acc, item) => {
    (acc[item.year] ??= []).push(item);
    return acc;
  }, {});

  const years = Object.keys(grouped)
    .map(Number)
    .sort((a, b) => b - a);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center' }}>
        <Spin size="small" />
      </div>
    );
  }

  return (
    <div style={{ height: '100%', overflowY: 'auto', background: '#fff', borderRight: '1px solid #F0F2F5' }}>
      <Collapse
        ghost
        defaultActiveKey={[String(activeYear)]}
        expandIconPosition="start"
        style={{ background: 'transparent' }}
        items={years.map((year) => {
          const months = grouped[year] ?? [];
          return {
            key: String(year),
            label: <span style={{ fontWeight: 600, fontSize: 14 }}>{year}</span>,
            children: (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {months
                  .sort((a, b) => b.month - a.month)
                  .map((item) => {
                    const isActive = item.year === activeYear && item.month === activeMonth;
                    return (
                      <div
                        key={`${item.year}-${item.month}`}
                        onClick={() => onMonthSelect(item.year, item.month)}
                        style={{
                          padding: '10px 12px',
                          borderRadius: 8,
                          cursor: 'pointer',
                          borderLeft: isActive ? '3px solid #00B894' : '3px solid transparent',
                          background: isActive ? '#E8FBF5' : 'transparent',
                          transition: 'all 0.2s',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 600, fontSize: 14 }}>
                            {item.month}月
                          </span>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 600,
                              color: item.balance >= 0 ? '#00B894' : '#FF6B6B',
                            }}
                          >
                            ¥{fmt(item.balance)}
                          </span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 4, fontSize: 12 }}>
                          <span style={{ color: '#00B894' }}>¥{fmt(item.income)}</span>
                          <span style={{ color: '#FF6B6B' }}>¥{fmt(item.expense)}</span>
                        </div>
                      </div>
                    );
                  })}
              </div>
            ),
          };
        })}
      />
    </div>
  );
};

export default MonthlyNavigator;
