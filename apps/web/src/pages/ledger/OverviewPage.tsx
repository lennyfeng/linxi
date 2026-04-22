import React, { useEffect, useState } from 'react';
import { Card, Col, Progress, Row, Space, Spin, Statistic, Typography } from 'antd';
import {
  ArrowUpOutlined,
  ArrowDownOutlined,
  CalendarOutlined,
  UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import apiClient from '@/api/client';

const { Text } = Typography;

/* ─── Types ─── */
interface TodaySummary { income: number; expense: number; balance: number }
interface PeriodSummaries { week: { income: number; expense: number }; month: { income: number; expense: number }; year: { income: number; expense: number } }
interface DailyTrendItem { date: string; income: number; expense: number }
interface CategoryRankItem { id: number; name: string; amount: number; count: number; percentage: number }
interface CategoryRanking { totalExpense: number; totalCount: number; items: CategoryRankItem[] }
interface IncomeItem { id: number; name: string; amount: number; count: number }
interface IncomeBreakdown { totalIncome: number; totalCount: number; items: IncomeItem[] }
interface UserStat { userId: string; userName: string; income: number; expense: number }

interface OverviewData {
  todaySummary: TodaySummary;
  periodSummaries: PeriodSummaries;
  dailyTrend: DailyTrendItem[];
  categoryRanking: CategoryRanking;
  incomeBreakdown: IncomeBreakdown;
  userStats: UserStat[];
}

const fmtAmt = (n: number) =>
  Math.abs(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const OverviewPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<OverviewData | null>(null);
  const [TrendChart, setTrendChart] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    apiClient.get('/ledger/overview').then((r) => {
      setData(r.data?.data ?? r.data);
    }).finally(() => setLoading(false));
  }, []);

  // Lazy load chart component
  useEffect(() => {
    import('@ant-design/charts').then((mod) => {
      setTrendChart(() => (mod as any).Line ?? (mod as any).default?.Line);
    }).catch(() => {
      // Charts not available
    });
  }, []);

  if (loading) {
    return <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}><Spin size="large" /></div>;
  }
  if (!data) {
    return <div style={{ padding: 40, textAlign: 'center' }}>加载总览数据失败</div>;
  }

  const { todaySummary, periodSummaries, dailyTrend, categoryRanking, incomeBreakdown, userStats } = data;

  // Chart data
  const chartData = dailyTrend.flatMap((d) => [
    { date: dayjs(d.date).format('MM/DD'), type: '收入', value: d.income },
    { date: dayjs(d.date).format('MM/DD'), type: '支出', value: d.expense },
  ]);

  return (
    <div style={{ padding: 24, background: '#F5F7FA', minHeight: 'calc(100vh - 64px)', overflowY: 'auto' }}>
      <Row gutter={[24, 24]}>
        {/* ── Left Column ── */}
        <Col xs={24} lg={14}>
          {/* Today's Summary */}
          <Card
            style={{ background: 'linear-gradient(135deg, #FF8C42 0%, #FF6B35 100%)', borderRadius: 12, marginBottom: 24 }}
            bodyStyle={{ color: '#fff' }}
            bordered={false}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <Text style={{ color: 'rgba(255,255,255,0.85)', fontSize: 14 }}>
                  <CalendarOutlined /> 今日 ({dayjs().format('YYYY-MM-DD')})
                </Text>
                <div style={{ fontSize: 36, fontWeight: 700, color: '#fff', fontFamily: 'DIN Alternate, monospace', marginTop: 4 }}>
                  ¥{fmtAmt(todaySummary.balance)}
                </div>
              </div>
              <Space size={32}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>收入</div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 18, fontFamily: 'DIN Alternate, monospace' }}>
                    ¥{fmtAmt(todaySummary.income)}
                  </div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }}>支出</div>
                  <div style={{ color: '#fff', fontWeight: 600, fontSize: 18, fontFamily: 'DIN Alternate, monospace' }}>
                    ¥{fmtAmt(todaySummary.expense)}
                  </div>
                </div>
              </Space>
            </div>
          </Card>

          {/* Monthly Trend Chart */}
          <Card title={`${dayjs().format('YYYY-MM')} 月度趋势`} style={{ borderRadius: 12, marginBottom: 24 }}>
            {TrendChart ? (
              <TrendChart
                data={chartData}
                xField="date"
                yField="value"
                seriesField="type"
                color={['#FF8C42', '#52C41A']}
                height={280}
                smooth
                point={{ size: 3 }}
                legend={{ position: 'top-right' }}
                yAxis={{ label: { formatter: (v: string) => `¥${Number(v).toLocaleString()}` } }}
                tooltip={{ formatter: (datum: any) => ({ name: datum.type, value: `¥${fmtAmt(datum.value)}` }) }}
              />
            ) : (
              <div style={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#999' }}>
                {dailyTrend.length === 0 ? '本月无数据' : (
                  <div style={{ width: '100%' }}>
                    {dailyTrend.map((d) => (
                      <div key={d.date} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, padding: '2px 0' }}>
                        <span>{dayjs(d.date).format('MM/DD')}</span>
                        <span style={{ color: '#FF8C42' }}>+¥{fmtAmt(d.income)}</span>
                        <span style={{ color: '#52C41A' }}>-¥{fmtAmt(d.expense)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </Card>

          {/* Income Breakdown */}
          <Card title="本月收入" extra={<Text type="secondary">{incomeBreakdown.totalCount} 笔 | ¥{fmtAmt(incomeBreakdown.totalIncome)}</Text>} style={{ borderRadius: 12, marginBottom: 24 }}>
            {incomeBreakdown.items.length === 0 ? (
              <Text type="secondary">本月无收入</Text>
            ) : (
              incomeBreakdown.items.map((item) => (
                <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F0F2F5' }}>
                  <div>
                    <Text strong>{item.name}</Text>
                    <Text type="secondary" style={{ marginLeft: 8, fontSize: 12 }}>{item.count} 笔</Text>
                  </div>
                  <Text style={{ color: '#FF8C42', fontWeight: 600, fontFamily: 'DIN Alternate, monospace' }}>
                    ¥{fmtAmt(item.amount)}
                  </Text>
                </div>
              ))
            )}
          </Card>
        </Col>

        {/* ── Right Column ── */}
        <Col xs={24} lg={10}>
          {/* Period Summary Cards */}
          <Card style={{ borderRadius: 12, marginBottom: 24 }} bodyStyle={{ padding: 0 }}>
            {[
              { label: '本周', data: periodSummaries.week, range: `${dayjs().startOf('week').add(1, 'day').format('MM/DD')} - ${dayjs().endOf('week').add(1, 'day').format('MM/DD')}` },
              { label: '本月', data: periodSummaries.month, range: `${dayjs().startOf('month').format('MM/DD')} - ${dayjs().endOf('month').format('MM/DD')}` },
              { label: '本年', data: periodSummaries.year, range: dayjs().format('YYYY') },
            ].map((period, idx) => (
              <div
                key={period.label}
                style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '14px 20px',
                  borderBottom: idx < 2 ? '1px solid #F0F2F5' : undefined,
                }}
              >
                <div>
                  <Text strong>{period.label}</Text>
                  <div style={{ fontSize: 12, color: '#999' }}>{period.range}</div>
                </div>
                <Space size={20}>
                  <Statistic
                    value={period.data.income}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#FF8C42', fontSize: 14, fontFamily: 'DIN Alternate, monospace' }}
                    suffix={<ArrowUpOutlined style={{ fontSize: 10 }} />}
                  />
                  <Statistic
                    value={period.data.expense}
                    precision={2}
                    prefix="¥"
                    valueStyle={{ color: '#52C41A', fontSize: 14, fontFamily: 'DIN Alternate, monospace' }}
                    suffix={<ArrowDownOutlined style={{ fontSize: 10 }} />}
                  />
                </Space>
              </div>
            ))}
          </Card>

          {/* Category Expense Ranking */}
          <Card
            title="分类支出排行"
            extra={<Text type="secondary">{categoryRanking.totalCount} 笔 | ¥{fmtAmt(categoryRanking.totalExpense)}</Text>}
            style={{ borderRadius: 12, marginBottom: 24 }}
          >
            {categoryRanking.items.length === 0 ? (
              <Text type="secondary">本月无支出</Text>
            ) : (
              categoryRanking.items.map((item, idx) => (
                <div key={item.id} style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <Space>
                      <span style={{ display: 'inline-block', width: 20, textAlign: 'center', fontWeight: 600, color: idx < 3 ? '#FF8C42' : '#999' }}>
                        {idx + 1}
                      </span>
                      <Text>{item.name}</Text>
                    </Space>
                    <Space>
                      <Text type="secondary" style={{ fontSize: 12 }}>{item.percentage}%</Text>
                      <Text strong style={{ fontFamily: 'DIN Alternate, monospace' }}>¥{fmtAmt(item.amount)}</Text>
                    </Space>
                  </div>
                  <Progress
                    percent={item.percentage}
                    showInfo={false}
                    strokeColor={idx === 0 ? '#FF8C42' : idx === 1 ? '#FF6B35' : idx === 2 ? '#FFA502' : '#D9D9D9'}
                    size="small"
                  />
                </div>
              ))
            )}
          </Card>

          {/* Per-User Stats */}
          <Card
            title={<><UserOutlined /> 本月成员统计</>}
            style={{ borderRadius: 12, marginBottom: 24 }}
          >
            {userStats.length === 0 ? (
              <Text type="secondary">无数据</Text>
            ) : (
              userStats.map((u) => (
                <div key={u.userId || u.userName} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderBottom: '1px solid #F0F2F5' }}>
                  <Space>
                    <div style={{ width: 32, height: 32, borderRadius: '50%', background: '#FF8C42', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: 600, fontSize: 14 }}>
                      {(u.userName || '?')[0]}
                    </div>
                    <Text strong>{u.userName}</Text>
                  </Space>
                  <Space size={16}>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#999' }}>收入</div>
                      <Text style={{ color: '#FF8C42', fontFamily: 'DIN Alternate, monospace' }}>¥{fmtAmt(u.income)}</Text>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 11, color: '#999' }}>支出</div>
                      <Text style={{ color: '#52C41A', fontFamily: 'DIN Alternate, monospace' }}>¥{fmtAmt(u.expense)}</Text>
                    </div>
                  </Space>
                </div>
              ))
            )}
          </Card>
        </Col>
      </Row>
    </div>
  );
};

export default OverviewPage;
