import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, DatePicker, Drawer, Dropdown, Empty, Input, Modal, Progress, Row, Select, Space, Spin, Statistic, Table, Tag, Tooltip, Typography, message, Radio } from 'antd';
import { PlusOutlined, ReloadOutlined, DownloadOutlined, InboxOutlined, LineChartOutlined, BellOutlined, CalendarOutlined, CheckCircleOutlined, DownOutlined, SaveOutlined, DeleteOutlined, StarOutlined, StarFilled } from '@ant-design/icons';
import { Line } from '@ant-design/plots';
import { useNavigate } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import asinOpportunityApi from '@/api/asinOpportunities';
import type { BatchDecisionAction, BatchRow, SavedView } from './types';

const batchStatusLabels: Record<string, { label: string; color: string }> = {
  submitted: { label: '已提交', color: 'default' },
  analyzing: { label: '分析中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  partially_failed: { label: '部分失败', color: 'warning' },
  cancelled: { label: '已取消', color: 'red' },
};

const batchStatusOptions = Object.entries(batchStatusLabels).map(([value, meta]) => ({ value, label: meta.label }));

const sortFieldLabels: Record<string, string> = {
  recommendedRate: '推荐率',
  analyzedRate: '分析率',
  recommendedCount: '推荐数',
  createdAt: '创建时间',
  healthScore: '健康分',
};

const batchConclusionLabels: Record<string, { label: string; color: string }> = {
  completeAnalysis: { label: '先补齐分析', color: 'warning' },
  push: { label: '建议推进', color: 'success' },
  review: { label: '建议复盘', color: 'error' },
  observe: { label: '观察沉淀', color: 'blue' },
  insufficient: { label: '数据不足', color: 'default' },
};

const batchDecisionActionLabels: Record<string, { label: string; color: string }> = {
  create_meeting: { label: '已建会议', color: 'blue' },
  mark_decision: { label: '已标记决策', color: 'success' },
  notify_owner: { label: '已通知', color: 'purple' },
};

const batchDecisionStatusLabels: Record<string, { label: string; color: string }> = {
  open: { label: '待处理', color: 'warning' },
  done: { label: '已完成', color: 'success' },
  cancelled: { label: '已取消', color: 'default' },
  notified: { label: '已通知', color: 'purple' },
};

const AsinBatchListPage: React.FC = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [status, setStatus] = useState<string>();
  const [data, setData] = useState<BatchRow[]>([]);
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [exporting, setExporting] = useState(false);
  const [sortBy, setSortBy] = useState<string | null>(null);
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc' | null>(null);
  const [dateRange, setDateRange] = useState<[string, string] | null>(null);
  const [healthLevel, setHealthLevel] = useState<string>();
  const [batchConclusion, setBatchConclusion] = useState<string>();
  const [healthTrendData, setHealthTrendData] = useState<any[]>([]);
  const [trendLoading, setTrendLoading] = useState(false);
  const [trendGroupBy, setTrendGroupBy] = useState<'day' | 'week' | 'month'>('day');
  const [batchAlerts, setBatchAlerts] = useState<any[]>([]);
  const [alertsLoading, setAlertsLoading] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchActioning, setBatchActioning] = useState(false);
  const [actionSummary, setActionSummary] = useState({ openTotal: 0, overdueTotal: 0 });
  const [actionFilter, setActionFilter] = useState<'open' | 'overdue'>();
  const [actionDrawerOpen, setActionDrawerOpen] = useState(false);
  const [actionDrawerMode, setActionDrawerMode] = useState<'open' | 'overdue'>('open');
  const [actionItems, setActionItems] = useState<BatchDecisionAction[]>([]);
  const [actionItemsLoading, setActionItemsLoading] = useState(false);
  const [savedViews, setSavedViews] = useState<SavedView[]>([]);
  const [savedViewsLoaded, setSavedViewsLoaded] = useState(false);
  const [saveViewName, setSaveViewName] = useState('');

  const loadSavedViews = async () => {
    if (savedViewsLoaded) return;
    try {
      const res = await asinOpportunityApi.listSavedViews({ moduleKey: 'asin-opportunities-list' });
      setSavedViews(res.data?.data ?? []);
      setSavedViewsLoaded(true);
    } catch { /* ignore */ }
  };

  const doSaveView = async () => {
    if (!saveViewName.trim()) { message.warning('请输入视图名称'); return; }
    try {
      await asinOpportunityApi.createSavedView({
        moduleKey: 'asin-opportunities-list',
        viewName: saveViewName.trim(),
        viewConfigJson: JSON.stringify({ keyword, status, healthLevel, batchConclusion, sortBy, sortOrder }),
        isDefault: false,
      });
      message.success('视图已保存');
      setSaveViewName('');
      setSavedViewsLoaded(false);
      await loadSavedViews();
    } catch { message.error('保存视图失败'); }
  };

  const applySavedView = (view: SavedView) => {
    try {
      const config = JSON.parse(view.viewConfigJson || '{}');
      if (config.keyword !== undefined) setKeyword(config.keyword);
      if (config.status !== undefined) setStatus(config.status);
      if (config.healthLevel !== undefined) setHealthLevel(config.healthLevel);
      if (config.batchConclusion !== undefined) setBatchConclusion(config.batchConclusion);
      if (config.sortBy !== undefined) setSortBy(config.sortBy);
      if (config.sortOrder !== undefined) setSortOrder(config.sortOrder);
      load(config.keyword ?? keyword, config.status ?? status, 1, pagination.pageSize, config.sortBy ?? sortBy, config.sortOrder ?? sortOrder, dateRange, config.healthLevel ?? healthLevel, config.batchConclusion ?? batchConclusion);
      message.info(`已切换到视图：${view.viewName}`);
    } catch { message.error('视图配置解析失败'); }
  };

  const removeSavedView = async (viewId: number) => {
    try {
      await asinOpportunityApi.deleteSavedView(viewId);
      message.success('视图已删除');
      setSavedViewsLoaded(false);
      await loadSavedViews();
    } catch { message.error('删除失败'); }
  };

  const summary = useMemo(() => {
    const totalAsins = data.reduce((sum, item) => sum + item.totalCount, 0);
    const analyzedAsins = data.reduce((sum, item) => sum + item.analyzedCount, 0);
    const recommendedAsins = data.reduce((sum, item) => sum + item.recommendedCount, 0);
    const rejectedAsins = data.reduce((sum, item) => sum + item.rejectedCount, 0);
    const lowEfficiencyBatches = data.filter((item) => item.totalCount > 0 && item.analyzedCount === item.totalCount && item.recommendedCount / item.totalCount < 0.1).length;
    const opportunityRate = totalAsins ? Math.round((recommendedAsins / totalAsins) * 100) : 0;
    return { totalAsins, analyzedAsins, recommendedAsins, rejectedAsins, opportunityRate, lowEfficiencyBatches };
  }, [data]);

  const displayData = useMemo(() => {
    if (!actionFilter) return data;
    return data.filter((item) => {
      const action = item.latestDecisionAction;
      if (!action) return false;
      if (actionFilter === 'open') return action.status === 'open';
      return action.status === 'open' && !!action.dueAt && new Date(action.dueAt).getTime() < Date.now();
    });
  }, [data, actionFilter]);

  const activeFilterTags = useMemo(() => {
    const tags: Array<{ key: 'keyword' | 'status' | 'dateRange' | 'sort' | 'healthLevel' | 'batchConclusion'; label: string }> = [];
    if (keyword) tags.push({ key: 'keyword', label: `关键词：${keyword}` });
    if (status) tags.push({ key: 'status', label: `批次状态：${batchStatusLabels[status]?.label || status}` });
    if (dateRange) tags.push({ key: 'dateRange', label: `创建时间：${dateRange[0]} ~ ${dateRange[1]}` });
    if (healthLevel) tags.push({ key: 'healthLevel', label: `健康度：${healthLevel === 'healthy' ? '健康' : '需复盘'}` });
    if (batchConclusion) tags.push({ key: 'batchConclusion', label: `批次结论：${batchConclusionLabels[batchConclusion]?.label || batchConclusion}` });
    if (sortBy) tags.push({ key: 'sort', label: `排序：${sortFieldLabels[sortBy] || sortBy} ${sortOrder === 'asc' ? '升序' : '降序'}` });
    return tags;
  }, [keyword, status, dateRange, healthLevel, batchConclusion, sortBy, sortOrder]);

  const load = async (nextKeyword = keyword, nextStatus = status, nextPage = pagination.page, nextPageSize = pagination.pageSize, nextSortBy = sortBy, nextSortOrder = sortOrder, nextDateRange = dateRange, nextHealthLevel = healthLevel, nextBatchConclusion = batchConclusion) => {
    setLoading(true);
    try {
      const res = await asinOpportunityApi.listBatches({
        keyword: nextKeyword,
        status: nextStatus,
        page: nextPage,
        pageSize: nextPageSize,
        ...(nextSortBy ? { sortBy: nextSortBy, sortOrder: nextSortOrder || 'desc' } : {}),
        ...(nextDateRange ? { createdFrom: nextDateRange[0], createdTo: nextDateRange[1] } : {}),
        ...(nextHealthLevel ? { healthLevel: nextHealthLevel } : {}),
        ...(nextBatchConclusion ? { batchConclusion: nextBatchConclusion } : {}),
      });
      const payload = res.data?.data;
      setData(payload?.items ?? []);
      setPagination({
        page: payload?.page ?? nextPage,
        pageSize: payload?.pageSize ?? nextPageSize,
        total: payload?.total ?? 0,
      });
    } catch {
      message.error('加载 ASIN 批次失败');
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const loadHealthTrend = async () => {
    setTrendLoading(true);
    try {
      const res = await asinOpportunityApi.getHealthTrend({
        groupBy: trendGroupBy,
        dateFrom: dateRange ? dateRange[0] : undefined,
        dateTo: dateRange ? dateRange[1] : undefined,
      });
      setHealthTrendData(res.data?.data || []);
    } catch {
      setHealthTrendData([]);
    }
    setTrendLoading(false);
  };

  useEffect(() => { loadHealthTrend(); }, [trendGroupBy, dateRange]);

  const loadBatchAlerts = async () => {
    setAlertsLoading(true);
    try {
      const res = await asinOpportunityApi.getBatchAlerts();
      setBatchAlerts(res.data?.data || []);
    } catch {
      setBatchAlerts([]);
    }
    setAlertsLoading(false);
  };

  useEffect(() => { loadBatchAlerts(); }, []);

  const loadActionSummary = async () => {
    try {
      const res = await asinOpportunityApi.listBatchDecisionActions({ pageSize: 1 });
      setActionSummary(res.data?.data?.summary || { openTotal: 0, overdueTotal: 0 });
    } catch {
      setActionSummary({ openTotal: 0, overdueTotal: 0 });
    }
  };

  useEffect(() => { loadActionSummary(); }, []);

  const loadActionItems = async (mode = actionDrawerMode) => {
    setActionItemsLoading(true);
    try {
      const res = await asinOpportunityApi.listBatchDecisionActions({
        pageSize: 50,
        ...(mode === 'overdue' ? { overdue: true } : { status: 'open' }),
      });
      setActionItems(res.data?.data?.items || []);
    } catch {
      setActionItems([]);
    } finally {
      setActionItemsLoading(false);
    }
  };

  const openActionDrawer = async (mode: 'open' | 'overdue') => {
    setActionDrawerMode(mode);
    setActionDrawerOpen(true);
    await loadActionItems(mode);
  };

  const removeFilter = (key: 'keyword' | 'status' | 'dateRange' | 'sort' | 'healthLevel' | 'batchConclusion') => {
    const nextKeyword = key === 'keyword' ? '' : keyword;
    const nextStatus = key === 'status' ? undefined : status;
    const nextDateRange = key === 'dateRange' ? null : dateRange;
    const nextSortBy = key === 'sort' ? null : sortBy;
    const nextSortOrder = key === 'sort' ? null : sortOrder;
    const nextHealthLevel = key === 'healthLevel' ? undefined : healthLevel;
    const nextBatchConclusion = key === 'batchConclusion' ? undefined : batchConclusion;
    setKeyword(nextKeyword);
    setStatus(nextStatus);
    if (key === 'dateRange') setDateRange(null);
    if (key === 'sort') {
      setSortBy(null);
      setSortOrder(null);
    }
    if (key === 'healthLevel') setHealthLevel(undefined);
    if (key === 'batchConclusion') setBatchConclusion(undefined);
    load(nextKeyword, nextStatus, 1, pagination.pageSize, nextSortBy, nextSortOrder, nextDateRange, nextHealthLevel, nextBatchConclusion);
  };

  const clearFilters = () => {
    setKeyword('');
    setStatus(undefined);
    setSortBy(null);
    setSortOrder(null);
    setDateRange(null);
    setHealthLevel(undefined);
    setBatchConclusion(undefined);
    load('', undefined, 1, pagination.pageSize, null, null, null, undefined, undefined);
  };

  const getColumnSortOrder = (field: string) => {
    if (sortBy !== field) return undefined;
    return sortOrder === 'asc' ? 'ascend' as const : 'descend' as const;
  };

  const renderBatchStatus = (value: string) => {
    const meta = batchStatusLabels[value] || { label: value, color: 'default' };
    return <Tag color={meta.color}>{meta.label}</Tag>;
  };

  const renderBatchProgress = (record: BatchRow) => {
    if (!record.totalCount) return '-';
    const analyzedRate = Math.round((record.analyzedCount / record.totalCount) * 100);
    const recommendedRate = Math.round((record.recommendedCount / record.totalCount) * 100);
    const pendingReview = Math.max(0, record.analyzedCount - record.recommendedCount - record.rejectedCount);
    const unanalyzed = Math.max(0, record.totalCount - record.analyzedCount);
    const tooltipContent = (
      <div style={{ fontSize: 12 }}>
        <div>总数: {record.totalCount}</div>
        <div>已分析: {record.analyzedCount}（{analyzedRate}%）</div>
        <div style={{ color: '#52c41a' }}>推荐: {record.recommendedCount}（{recommendedRate}%）</div>
        <div style={{ color: '#ff4d4f' }}>淘汰: {record.rejectedCount}</div>
        <div style={{ color: '#fa8c16' }}>待复核: {pendingReview}</div>
        {unanalyzed > 0 && <div style={{ color: '#1890ff' }}>未分析: {unanalyzed}</div>}
      </div>
    );
    return (
      <Tooltip title={tooltipContent}>
        <Space direction="vertical" size={0} style={{ width: 160 }}>
          <Typography.Text type="secondary">分析 {analyzedRate}%</Typography.Text>
          <Progress percent={analyzedRate} size="small" showInfo={false} status={analyzedRate < 100 ? 'active' : 'success'} />
          <Typography.Text type="secondary">推荐 {recommendedRate}%</Typography.Text>
          <Progress percent={recommendedRate} size="small" showInfo={false} strokeColor="#52c41a" />
        </Space>
      </Tooltip>
    );
  };

  const renderAttentionTags = (record: BatchRow) => {
    const pendingReview = Math.max(0, record.analyzedCount - record.recommendedCount - record.rejectedCount);
    const unanalyzed = Math.max(0, record.totalCount - record.analyzedCount);
    const recommendedRate = record.totalCount ? Math.round((record.recommendedCount / record.totalCount) * 100) : 0;
    const tags: Array<{ label: string; color: string }> = [];
    if (pendingReview >= 10) tags.push({ label: `待复核 ${pendingReview}`, color: 'orange' });
    if (unanalyzed > 0) tags.push({ label: `未分析 ${unanalyzed}`, color: 'blue' });
    if (record.totalCount > 0 && record.analyzedCount === record.totalCount && recommendedRate < 10) tags.push({ label: '推荐率低', color: 'red' });
    if (recommendedRate >= 30) tags.push({ label: '高产出', color: 'green' });
    return tags.length ? <Space wrap size={[0, 4]}>{tags.map((tag) => <Tag key={tag.label} color={tag.color}>{tag.label}</Tag>)}</Space> : <Typography.Text type="secondary">正常</Typography.Text>;
  };

  const getBatchHealth = (record: BatchRow) => {
    if (!record.totalCount) return { score: 0, label: '无数据', color: 'default' };
    const analyzedRate = Math.round((record.analyzedCount / record.totalCount) * 100);
    const recommendedRate = Math.round((record.recommendedCount / record.totalCount) * 100);
    const rejectedRate = Math.round((record.rejectedCount / record.totalCount) * 100);
    const pendingReview = Math.max(0, record.analyzedCount - record.recommendedCount - record.rejectedCount);
    let score = 100;
    score -= Math.round((100 - analyzedRate) * 0.4);
    if (record.analyzedCount === record.totalCount && recommendedRate < 10) score -= 30;
    if (pendingReview > 0) score -= Math.min(25, Math.round((pendingReview / record.totalCount) * 100));
    if (rejectedRate >= 50) score -= 15;
    score = Math.max(0, Math.min(100, score));
    if (score >= 80) return { score, label: '健康', color: 'success' };
    if (score >= 60) return { score, label: '关注', color: 'warning' };
    return { score, label: '需复盘', color: 'error' };
  };

  const renderBatchHealth = (record: BatchRow) => {
    const health = getBatchHealth(record);
    return (
      <Space direction="vertical" size={0} style={{ width: 90 }}>
        <Tag color={health.color}>{health.label}</Tag>
        <Progress percent={health.score} size="small" showInfo={false} strokeColor={health.score >= 80 ? '#52c41a' : health.score >= 60 ? '#faad14' : '#ff4d4f'} />
      </Space>
    );
  };

  const getBatchConclusion = (record: BatchRow) => {
    const health = getBatchHealth(record);
    const analyzedRate = record.totalCount ? Math.round((record.analyzedCount / record.totalCount) * 100) : 0;
    const rejectedRate = record.totalCount ? Math.round((record.rejectedCount / record.totalCount) * 100) : 0;
    const pendingReview = Math.max(0, record.analyzedCount - record.recommendedCount - record.rejectedCount);
    if (record.totalCount === 0) return { key: 'insufficient', ...batchConclusionLabels.insufficient };
    if (analyzedRate < 100) return { key: 'completeAnalysis', ...batchConclusionLabels.completeAnalysis };
    if (record.recommendedCount > 0 && health.score >= 75) return { key: 'push', ...batchConclusionLabels.push };
    if (pendingReview > 0 || health.score < 70 || rejectedRate >= 50) return { key: 'review', ...batchConclusionLabels.review };
    return { key: 'observe', ...batchConclusionLabels.observe };
  };

  const renderBatchConclusion = (record: BatchRow) => {
    const conclusion = getBatchConclusion(record);
    return <Tag color={conclusion.color}>{conclusion.label}</Tag>;
  };

  const renderLatestDecisionAction = (record: BatchRow) => {
    const action = record.latestDecisionAction;
    if (!action) return <Typography.Text type="secondary">未处理</Typography.Text>;
    const meta = batchDecisionActionLabels[action.actionType] || { label: action.actionType, color: 'default' };
    const isOverdue = action.dueAt && new Date(action.dueAt).getTime() < Date.now() && action.status === 'open';
    return (
      <Space direction="vertical" size={0}>
        <Tag color={isOverdue ? 'red' : meta.color}>{isOverdue ? '已超时' : meta.label}</Tag>
        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
          {action.meetingType || action.summary || '-'}
        </Typography.Text>
      </Space>
    );
  };

  const getAlertOperationAdvice = (alert: { alertReasons?: string[]; alertLevel?: string }) => {
    const reasons = alert.alertReasons || [];
    if (reasons.includes('分析率不足')) return '优先补齐待分析 ASIN，并在补齐后重新刷新批次结论。';
    if (reasons.includes('推荐率过低')) return '建议发起复盘会，重点检查关键词来源、类目假设和评分阈值。';
    if (reasons.includes('淘汰率过高')) return '建议复盘淘汰原因分布，判断是否需要调整选品方向或供应链假设。';
    if (reasons.includes('健康分过低')) return '建议先通知负责人，并将该批次纳入本周运营复盘清单。';
    if (alert.alertLevel === 'high') return '高风险批次建议 24 小时内完成责任人确认。';
    return '建议持续观察，并在下次批次复盘中同步。';
  };

  const runBatchDecisionAction = async (actionType: 'create_meeting' | 'mark_decision' | 'notify_owner') => {
    if (!selectedRowKeys.length) {
      message.warning('请先选择批次');
      return;
    }
    const titleMap = {
      create_meeting: '创建批次会议',
      mark_decision: '批量标记决策',
      notify_owner: '通知负责人',
    };
    Modal.confirm({
      title: `${titleMap[actionType]}（${selectedRowKeys.length} 个批次）`,
      content: '系统将按当前批次结论生成动作记录，并用于列表时效追踪。',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        setBatchActioning(true);
        try {
          const res = await asinOpportunityApi.createBatchDecisionActions({
            batchIds: selectedRowKeys,
            actionType,
            conclusion: batchConclusion || undefined,
          });
          message.success(`已处理 ${res.data?.data?.total || selectedRowKeys.length} 个批次`);
          setSelectedRowKeys([]);
          await load();
          await loadActionSummary();
        } catch {
          message.error('批次动作处理失败');
        } finally {
          setBatchActioning(false);
        }
      },
    });
  };

  const completeLatestAction = async (record: BatchRow) => {
    if (!record.latestDecisionAction || record.latestDecisionAction.status !== 'open') return;
    try {
      await asinOpportunityApi.updateBatchDecisionActionStatus(record.latestDecisionAction.id, { status: 'done' });
      message.success('已完成该批次最新待办');
      await load();
      await loadActionSummary();
      if (actionDrawerOpen) await loadActionItems(actionDrawerMode);
    } catch {
      message.error('更新待办状态失败');
    }
  };

  const updateActionStatus = async (actionId: number, nextStatus: 'done' | 'cancelled') => {
    try {
      await asinOpportunityApi.updateBatchDecisionActionStatus(actionId, { status: nextStatus });
      message.success(nextStatus === 'done' ? '待办已完成' : '待办已取消');
      await loadActionItems(actionDrawerMode);
      await loadActionSummary();
      await load();
    } catch {
      message.error('更新待办状态失败');
    }
  };

  const exportSingleBatch = async (batchId: number) => {
    try {
      const res = await asinOpportunityApi.exportBatchItems(batchId);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `asin-batch-${batchId}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success('批次 ASIN 导出成功');
    } catch {
      message.error('导出失败');
    }
  };

  const exportBatches = async () => {
    setExporting(true);
    try {
      const res = await asinOpportunityApi.exportBatches({
        keyword,
        status,
        ...(sortBy ? { sortBy, sortOrder: sortOrder || 'desc' } : {}),
        ...(dateRange ? { createdFrom: dateRange[0], createdTo: dateRange[1] } : {}),
        ...(healthLevel ? { healthLevel } : {}),
        ...(batchConclusion ? { batchConclusion } : {}),
      });
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'asin-opportunity-batches.csv';
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success('批次导出成功');
    } catch {
      message.error('批次导出失败');
    }
    setExporting(false);
  };

  const confirmExportBatches = () => {
    Modal.confirm({
      title: activeFilterTags.length ? '导出当前筛选批次' : '导出全部批次',
      content: (
        <div>
          {activeFilterTags.length ? (
            <>
              <Typography.Paragraph>当前已应用以下筛选条件，导出结果仅包含匹配批次：</Typography.Paragraph>
              <Space wrap>{activeFilterTags.map((tag) => <Tag key={tag.key}>{tag.label}</Tag>)}</Space>
            </>
          ) : (
            <Typography.Paragraph>当前未应用筛选条件，将导出全部批次。</Typography.Paragraph>
          )}
          <Typography.Paragraph style={{ marginTop: 12 }} type="secondary">当前命中 {pagination.total} 个批次，当前页推荐机会数 {summary.recommendedAsins}，低效批次 {summary.lowEfficiencyBatches} 个。</Typography.Paragraph>
          <Typography.Paragraph type="secondary">导出文件将包含健康分、健康等级、分析率、推荐率、待复核、未分析和关注原因，适合用于批次周会复盘。</Typography.Paragraph>
        </div>
      ),
      okText: '确认导出',
      cancelText: '取消',
      onOk: exportBatches,
    });
  };

  const columns: ColumnsType<BatchRow> = [
    { title: '批次号', dataIndex: 'batchNo', key: 'batchNo', width: 180 },
    { title: '名称', dataIndex: 'name', key: 'name' },
    { title: '站点', dataIndex: 'marketplace', key: 'marketplace', width: 90 },
    { title: '状态', dataIndex: 'status', key: 'status', width: 120, render: renderBatchStatus },
    { title: '批次结论', key: 'batchConclusion', width: 110, render: (_: unknown, record: BatchRow) => renderBatchConclusion(record) },
    { title: '最新动作', key: 'latestDecisionAction', width: 130, render: (_: unknown, record: BatchRow) => renderLatestDecisionAction(record) },
    { title: '健康度', key: 'healthScore', dataIndex: 'healthScore', width: 100, sorter: true, sortOrder: getColumnSortOrder('healthScore'), render: (_: unknown, record: BatchRow) => renderBatchHealth(record) },
    { title: '关注原因', key: 'attention', width: 150, render: (_: unknown, record: BatchRow) => renderAttentionTags(record) },
    { title: '总数', dataIndex: 'totalCount', key: 'totalCount', width: 80, sorter: true, sortOrder: getColumnSortOrder('totalCount') },
    { title: '已分析', dataIndex: 'analyzedCount', key: 'analyzedCount', width: 90, sorter: true, sortOrder: getColumnSortOrder('analyzedCount') },
    { title: '推荐', dataIndex: 'recommendedCount', key: 'recommendedCount', width: 90, sorter: true, sortOrder: getColumnSortOrder('recommendedCount') },
    { title: '淘汰', dataIndex: 'rejectedCount', key: 'rejectedCount', width: 90, sorter: true, sortOrder: getColumnSortOrder('rejectedCount') },
    { title: '推荐率', key: 'recommendedRate', width: 80, sorter: true, sortOrder: getColumnSortOrder('recommendedRate'), render: (_: unknown, record: BatchRow) => { const rate = record.totalCount ? Math.round((record.recommendedCount / record.totalCount) * 100) : 0; return <Typography.Text style={{ color: rate >= 30 ? '#3f8600' : rate >= 10 ? undefined : '#cf1322' }}>{rate}%</Typography.Text>; } },
    { title: '待复核', key: 'pendingReview', width: 80, render: (_: unknown, record: BatchRow) => { const v = Math.max(0, record.analyzedCount - record.recommendedCount - record.rejectedCount); return v > 0 ? <Typography.Text style={{ color: '#fa8c16' }}>{v}</Typography.Text> : '-'; } },
    { title: '未分析', key: 'unanalyzed', width: 80, render: (_: unknown, record: BatchRow) => { const v = Math.max(0, record.totalCount - record.analyzedCount); return v > 0 ? <Typography.Text style={{ color: '#1890ff' }}>{v}</Typography.Text> : '-'; } },
    { title: '运营进度', key: 'progressRate', width: 190, render: (_: unknown, record: BatchRow) => renderBatchProgress(record) },
    { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 120, sorter: true, sortOrder: getColumnSortOrder('createdAt'), render: (v: string) => v?.split('T')[0] ?? '-' },
    { title: '操作', key: 'actions', width: 200, render: (_: unknown, record: BatchRow) => (<Space><Button size="small" type="link" onClick={(e) => { e.stopPropagation(); navigate(`/product-dev/asin-opportunities/${record.id}`); }}>详情</Button><Button size="small" type="link" onClick={(e) => { e.stopPropagation(); exportSingleBatch(record.id); }}>导出</Button>{record.latestDecisionAction?.status === 'open' && <Button size="small" type="link" onClick={(e) => { e.stopPropagation(); completeLatestAction(record); }}>完成待办</Button>}</Space>) },
  ];

  return (
    <div style={{ padding: 24 }}>
      <Card>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Typography.Title level={4} style={{ margin: 0 }}>ASIN机会分析</Typography.Title>
          <Space>
            <Input.Search
              placeholder="搜索批次"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onSearch={(value) => {
                setKeyword(value);
                load(value, status, 1, pagination.pageSize);
              }}
              allowClear
              style={{ width: 220 }}
            />
            <Select
              allowClear
              placeholder="批次状态"
              value={status}
              options={batchStatusOptions}
              style={{ width: 140 }}
              onChange={(value) => {
                setStatus(value);
                load(keyword, value, 1, pagination.pageSize);
              }}
            />
            <DatePicker.RangePicker
              style={{ width: 240 }}
              placeholder={['创建开始', '创建结束']}
              onChange={(_dates, dateStrings) => {
                const range = dateStrings[0] && dateStrings[1] ? [dateStrings[0], dateStrings[1]] as [string, string] : null;
                setDateRange(range);
                load(keyword, status, 1, pagination.pageSize, sortBy, sortOrder, range);
              }}
            />
            <Dropdown menu={{ items: savedViews.map((v) => ({
              key: String(v.id),
              label: (
                <Space size={4}>
                  {v.isDefault ? <StarFilled style={{ color: '#faad14' }} /> : <StarOutlined />}
                  <span>{v.viewName}</span>
                  <DeleteOutlined style={{ color: '#ff4d4f' }} onClick={(e) => { e.stopPropagation(); Modal.confirm({ title: '删除视图', content: `确认删除"${v.viewName}"？`, okText: '删除', okButtonProps: { danger: true }, cancelText: '取消', onOk: () => removeSavedView(v.id) }); }} />
                </Space>
              ),
              onClick: () => applySavedView(v),
            })) }} trigger={['click']}>
              <Button size="small" icon={<DownOutlined />} onClick={loadSavedViews}>已保存视图</Button>
            </Dropdown>
            <Input size="small" placeholder="视图名称" value={saveViewName} onChange={(e) => setSaveViewName(e.target.value)} style={{ width: 100 }} onPressEnter={doSaveView} />
            <Button size="small" icon={<SaveOutlined />} onClick={doSaveView}>保存</Button>
            <Button icon={<ReloadOutlined />} onClick={() => load(keyword, status, pagination.page, pagination.pageSize)}>刷新</Button>
            <Button icon={<DownloadOutlined />} loading={exporting} onClick={confirmExportBatches}>导出</Button>
            <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/product-dev/asin-opportunities/new')}>新建批次</Button>
          </Space>
        </div>
        <div style={{ marginBottom: 16 }}>
          {activeFilterTags.length ? (
            <Space wrap>
              <Typography.Text type="secondary">已应用筛选：</Typography.Text>
              {activeFilterTags.map((item) => (
                <Tag key={item.key} closable onClose={(event) => { event.preventDefault(); removeFilter(item.key); }}>
                  {item.label}
                </Tag>
              ))}
              <Button size="small" type="link" onClick={clearFilters}>清空筛选</Button>
            </Space>
          ) : (
            <Typography.Text type="secondary">当前未应用筛选，导出将包含全部批次。</Typography.Text>
          )}
        </div>
        <Space wrap style={{ marginBottom: 8 }}>
          <Typography.Text type="secondary">批次状态：</Typography.Text>
          <Button size="small" type={!status ? 'primary' : 'default'} onClick={() => { setStatus(undefined); load(keyword, undefined, 1, pagination.pageSize, sortBy, sortOrder, dateRange); }}>全部</Button>
          {batchStatusOptions.map((opt) => (
            <Button key={opt.value} size="small" type={status === opt.value ? 'primary' : 'default'} onClick={() => { setStatus(opt.value); load(keyword, opt.value, 1, pagination.pageSize, sortBy, sortOrder, dateRange); }}>{opt.label}</Button>
          ))}
        </Space>
        <Space wrap style={{ marginBottom: 8 }}>
          <Typography.Text type="secondary">健康度：</Typography.Text>
          <Button size="small" type={!healthLevel ? 'primary' : 'default'} onClick={() => { setHealthLevel(undefined); load(keyword, status, 1, pagination.pageSize, sortBy, sortOrder, dateRange, undefined, batchConclusion); }}>全部</Button>
          <Button size="small" type={healthLevel === 'healthy' ? 'primary' : 'default'} onClick={() => { setHealthLevel('healthy'); load(keyword, status, 1, pagination.pageSize, sortBy, sortOrder, dateRange, 'healthy', batchConclusion); }}>健康</Button>
          <Button size="small" type={healthLevel === 'review' ? 'primary' : 'default'} onClick={() => { setHealthLevel('review'); load(keyword, status, 1, pagination.pageSize, sortBy, sortOrder, dateRange, 'review', batchConclusion); }}>需复盘</Button>
        </Space>
        <Space wrap style={{ marginBottom: 8 }}>
          <Typography.Text type="secondary">批次结论：</Typography.Text>
          <Button size="small" type={!batchConclusion ? 'primary' : 'default'} onClick={() => { setBatchConclusion(undefined); load(keyword, status, 1, pagination.pageSize, sortBy, sortOrder, dateRange, healthLevel, undefined); }}>全部</Button>
          {Object.entries(batchConclusionLabels).map(([value, meta]) => (
            <Button key={value} size="small" type={batchConclusion === value ? 'primary' : 'default'} onClick={() => { setBatchConclusion(value); load(keyword, status, 1, pagination.pageSize, sortBy, sortOrder, dateRange, healthLevel, value); }}>{meta.label}</Button>
          ))}
        </Space>
        <Space wrap style={{ marginBottom: 12 }}>
          <Typography.Text type="secondary">快捷排序：</Typography.Text>
          <Button size="small" type={sortBy === 'healthScore' && sortOrder === 'asc' ? 'primary' : 'default'} onClick={() => { setSortBy('healthScore'); setSortOrder('asc'); load(keyword, status, 1, pagination.pageSize, 'healthScore', 'asc'); }}>需复盘优先</Button>
          <Button size="small" type={sortBy === 'recommendedRate' && sortOrder === 'desc' ? 'primary' : 'default'} onClick={() => { setSortBy('recommendedRate'); setSortOrder('desc'); load(keyword, status, 1, pagination.pageSize, 'recommendedRate', 'desc'); }}>推荐率优先</Button>
          <Button size="small" type={sortBy === 'recommendedRate' && sortOrder === 'asc' ? 'primary' : 'default'} onClick={() => { setSortBy('recommendedRate'); setSortOrder('asc'); load(keyword, status, 1, pagination.pageSize, 'recommendedRate', 'asc'); }}>低效批次优先</Button>
          <Button size="small" type={sortBy === 'analyzedRate' && sortOrder === 'asc' ? 'primary' : 'default'} onClick={() => { setSortBy('analyzedRate'); setSortOrder('asc'); load(keyword, status, 1, pagination.pageSize, 'analyzedRate', 'asc'); }}>待分析优先</Button>
          <Button size="small" type={sortBy === 'recommendedCount' && sortOrder === 'desc' ? 'primary' : 'default'} onClick={() => { setSortBy('recommendedCount'); setSortOrder('desc'); load(keyword, status, 1, pagination.pageSize, 'recommendedCount', 'desc'); }}>推荐数优先</Button>
          <Button size="small" type={sortBy === 'createdAt' && sortOrder === 'desc' ? 'primary' : 'default'} onClick={() => { setSortBy('createdAt'); setSortOrder('desc'); load(keyword, status, 1, pagination.pageSize, 'createdAt', 'desc'); }}>最新创建</Button>
          {sortBy && <Button size="small" type="link" onClick={() => { setSortBy(null); setSortOrder(null); load(keyword, status, 1, pagination.pageSize, null, null, dateRange); }}>清除排序</Button>}
        </Space>
        <Typography.Text type="secondary">下方汇总基于当前页批次计算，用于快速判断当前筛选结果质量。</Typography.Text>
        {summary.lowEfficiencyBatches > 0 && (
          <Typography.Paragraph type="warning" style={{ marginTop: 8, marginBottom: 0 }}>
            当前页有 {summary.lowEfficiencyBatches} 个低效批次（分析完成且推荐率低于 10%），建议优先复盘选品方向、关键词来源或类目假设。
          </Typography.Paragraph>
        )}
        <Row gutter={16} style={{ marginBottom: 16, marginTop: 8 }}>
          <Col span={6}><Card size="small"><Statistic title="当前命中批次" value={pagination.total} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="当前页已分析" value={summary.analyzedAsins} suffix={`/ ${summary.totalAsins}`} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="推荐机会数" value={summary.recommendedAsins} valueStyle={{ color: '#3f8600' }} suffix={`/${summary.opportunityRate}%`} /></Card></Col>
          <Col span={6}><Card size="small"><Statistic title="淘汰 ASIN 数" value={summary.rejectedAsins} valueStyle={{ color: '#cf1322' }} /></Card></Col>
        </Row>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={6}><Card size="small" hoverable onClick={() => openActionDrawer('open')}><Statistic title="开放运营待办" value={actionSummary.openTotal} valueStyle={{ color: actionSummary.openTotal ? '#fa8c16' : undefined }} /></Card></Col>
          <Col span={6}><Card size="small" hoverable onClick={() => openActionDrawer('overdue')}><Statistic title="已超时待办" value={actionSummary.overdueTotal} valueStyle={{ color: actionSummary.overdueTotal ? '#cf1322' : undefined }} /></Card></Col>
          <Col span={12}>
            <Card size="small">
              <Space wrap>
                <Typography.Text type="secondary">待办视图：</Typography.Text>
                <Button size="small" type={!actionFilter ? 'primary' : 'default'} onClick={() => setActionFilter(undefined)}>全部</Button>
                <Button size="small" type={actionFilter === 'open' ? 'primary' : 'default'} onClick={() => setActionFilter('open')}>开放待办</Button>
                <Button size="small" type={actionFilter === 'overdue' ? 'primary' : 'default'} danger={actionSummary.overdueTotal > 0} onClick={() => setActionFilter('overdue')}>超时待办</Button>
                <Typography.Text type="secondary">用于快速定位需要推进会议、复盘或通知闭环的批次。</Typography.Text>
              </Space>
            </Card>
          </Col>
        </Row>
        <Card 
          title={
            <Space>
              <LineChartOutlined />
              <span>健康度趋势分析</span>
              <Radio.Group size="small" value={trendGroupBy} onChange={(e) => setTrendGroupBy(e.target.value)}>
                <Radio.Button value="day">按日</Radio.Button>
                <Radio.Button value="week">按周</Radio.Button>
                <Radio.Button value="month">按月</Radio.Button>
              </Radio.Group>
            </Space>
          }
          size="small"
          style={{ marginBottom: 16 }}
        >
          {trendLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spin size="large" /></div>
          ) : healthTrendData.length > 0 ? (
            <Line
              data={healthTrendData.map(item => ({
                date: item.date,
                总批次: item.totalBatches,
                健康批次: item.healthyBatches,
                需复盘批次: item.reviewBatches,
                平均健康分: item.avgHealthScore,
              }))}
              xField="date"
              yField="总批次"
              series={[
                { type: 'line', smooth: true, color: '#1890ff', name: '总批次' },
                { type: 'line', smooth: true, color: '#52c41a', name: '健康批次' },
                { type: 'line', smooth: true, color: '#faad14', name: '需复盘批次' },
                { type: 'line', smooth: true, color: '#722ed1', name: '平均健康分' },
              ]}
              height={200}
              point={{ size: 3 }}
              tooltip={{ shared: true }}
            />
          ) : (
            <Empty description="暂无健康度趋势数据" />
          )}
        </Card>
        {batchAlerts.length > 0 && (
          <Card 
            title={
              <Space>
                <span style={{ color: '#ff4d4f' }}>⚠️ 批次健康预警</span>
                <Tag color="red">{batchAlerts.length} 个批次需要关注</Tag>
              </Space>
            }
            size="small"
            style={{ marginBottom: 16 }}
          >
            {alertsLoading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spin size="small" /></div>
            ) : (
              <div>
                {batchAlerts.slice(0, 5).map(alert => (
                  <div key={alert.batchId} style={{ 
                    padding: '8px 12px', 
                    marginBottom: 8, 
                    border: '1px solid #ffccc7', 
                    borderRadius: 6,
                    backgroundColor: alert.alertLevel === 'high' ? '#fff2f0' : alert.alertLevel === 'medium' ? '#fff7e6' : '#f6ffed'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <Typography.Text strong>{alert.batchNo}</Typography.Text>
                        <Typography.Text style={{ marginLeft: 8, color: '#666' }}>{alert.batchName}</Typography.Text>
                        <div style={{ marginTop: 4 }}>
                          <Tag color={alert.alertLevel === 'high' ? 'red' : alert.alertLevel === 'medium' ? 'orange' : 'blue'}>
                            {alert.alertLevel === 'high' ? '高风险' : alert.alertLevel === 'medium' ? '中风险' : '低风险'}
                          </Tag>
                          <span style={{ marginLeft: 8, fontSize: 12, color: '#666' }}>
                            健康分: {alert.healthScore} | 分析率: {alert.analysisRate}% | 推荐率: {alert.recommendationRate}%
                          </span>
                        </div>
                      </div>
                      <Button 
                        size="small" 
                        type="link"
                        onClick={() => navigate(`/product-dev/asin-opportunities/${alert.batchId}`)}
                      >
                        查看详情
                      </Button>
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, color: '#ff4d4f' }}>
                      预警原因: {alert.alertReasons.join(', ')}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, color: '#595959' }}>
                      运营建议: {getAlertOperationAdvice(alert)}
                    </div>
                  </div>
                ))}
                {batchAlerts.length > 5 && (
                  <div style={{ textAlign: 'center', marginTop: 8 }}>
                    <Button size="small" type="link">
                      查看全部 {batchAlerts.length} 个预警批次
                    </Button>
                  </div>
                )}
              </div>
            )}
          </Card>
        )}
        {loading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spin size="large" /></div>
        ) : data.length === 0 || displayData.length === 0 ? (
          <Empty
            image={<InboxOutlined style={{ fontSize: 64, color: '#d9d9d9' }} />}
            description={
              <div>
                <Typography.Text type="secondary">{actionFilter ? '当前待办视图下暂无批次' : keyword || status ? '当前筛选条件下暂无 ASIN 批次' : '暂无 ASIN 批次'}</Typography.Text>
                <div style={{ marginTop: 16 }}>
                  {actionFilter ? (
                    <Button onClick={() => setActionFilter(undefined)}>返回全部批次</Button>
                  ) : (
                    <Button type="primary" icon={<PlusOutlined />} onClick={() => navigate('/product-dev/asin-opportunities/new')}>
                      创建第一个批次
                    </Button>
                  )}
                </div>
              </div>
            }
          />
        ) : (
          <>
          {selectedRowKeys.length > 0 && (
            <Card size="small" style={{ marginBottom: 12, background: '#f6ffed' }}>
              <Space wrap>
                <Typography.Text>已选 {selectedRowKeys.length} 个批次</Typography.Text>
                <Button size="small" type="primary" icon={<CalendarOutlined />} loading={batchActioning} onClick={() => runBatchDecisionAction('create_meeting')}>创建会议</Button>
                <Button size="small" icon={<CheckCircleOutlined />} loading={batchActioning} onClick={() => runBatchDecisionAction('mark_decision')}>标记决策</Button>
                <Button size="small" icon={<BellOutlined />} loading={batchActioning} onClick={() => runBatchDecisionAction('notify_owner')}>通知负责人</Button>
                <Button size="small" type="link" onClick={() => setSelectedRowKeys([])}>取消选择</Button>
              </Space>
            </Card>
          )}
          <Table
            dataSource={displayData}
            columns={columns}
            rowKey="id"
            size="small"
            rowSelection={{
              selectedRowKeys,
              onChange: setSelectedRowKeys,
            }}
            pagination={{
              current: pagination.page,
              pageSize: pagination.pageSize,
              total: pagination.total,
              showSizeChanger: true,
              showTotal: (total) => `共 ${total} 个批次`,
            }}
            onChange={(nextPagination, _filters, sorter) => {
              const activeSorter = (Array.isArray(sorter) ? sorter[0] : sorter) as SorterResult<BatchRow>;
              const nextSortBy = activeSorter?.order ? String(activeSorter.field || activeSorter.columnKey) : null;
              const nextSortOrder = activeSorter?.order === 'ascend' ? 'asc' as const : activeSorter?.order === 'descend' ? 'desc' as const : null;
              setSortBy(nextSortBy);
              setSortOrder(nextSortOrder);
              load(keyword, status, nextPagination.current || 1, nextPagination.pageSize || pagination.pageSize, nextSortBy, nextSortOrder, dateRange);
            }}
            onRow={(record) => {
              const pendingReview = Math.max(0, record.analyzedCount - record.recommendedCount - record.rejectedCount);
              const recRate = record.totalCount ? record.recommendedCount / record.totalCount : 0;
              const needsAttention = pendingReview >= 10 || (record.analyzedCount === record.totalCount && recRate < 0.1 && record.totalCount > 0);
              return { onClick: () => navigate(`/product-dev/asin-opportunities/${record.id}`), style: { cursor: 'pointer', ...(needsAttention ? { backgroundColor: '#fff7e6' } : {}) } };
            }}
          />
          </>
        )}
      </Card>
      <Drawer
        title={actionDrawerMode === 'overdue' ? '超时运营待办' : '开放运营待办'}
        open={actionDrawerOpen}
        onClose={() => setActionDrawerOpen(false)}
        width={560}
        extra={<Button size="small" icon={<ReloadOutlined />} onClick={() => loadActionItems(actionDrawerMode)}>刷新</Button>}
      >
        {actionItemsLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><Spin /></div>
        ) : actionItems.length === 0 ? (
          <Empty description={actionDrawerMode === 'overdue' ? '暂无超时待办' : '暂无开放待办'} />
        ) : (
          <Space direction="vertical" style={{ width: '100%' }} size={12}>
            {actionItems.map((action) => {
              const meta = batchDecisionActionLabels[action.actionType] || { label: action.actionType, color: 'default' };
              const statusMeta = batchDecisionStatusLabels[action.status] || { label: action.status, color: 'default' };
              const isOverdue = action.status === 'open' && !!action.dueAt && new Date(action.dueAt).getTime() < Date.now();
              return (
                <Card key={action.id} size="small">
                  <Space direction="vertical" style={{ width: '100%' }} size={6}>
                    <Space wrap>
                      <Tag color={isOverdue ? 'red' : meta.color}>{isOverdue ? '已超时' : meta.label}</Tag>
                      {action.conclusion && <Tag>{batchConclusionLabels[action.conclusion]?.label || action.conclusion}</Tag>}
                      <Tag color={statusMeta.color}>{statusMeta.label}</Tag>
                    </Space>
                    <Typography.Text strong>{action.batchNo || `批次 ${action.batchId}`}</Typography.Text>
                    {action.batchName && <Typography.Text>{action.batchName}</Typography.Text>}
                    <Typography.Text type="secondary">{action.summary || action.meetingType || '暂无摘要'}</Typography.Text>
                    <Typography.Text type={isOverdue ? 'danger' : 'secondary'}>
                      到期时间：{action.dueAt ? action.dueAt.replace('T', ' ').slice(0, 16) : '未设置'}
                    </Typography.Text>
                    <Space>
                      <Button size="small" type="link" onClick={() => navigate(`/product-dev/asin-opportunities/${action.batchId}`)}>查看批次</Button>
                      {action.status === 'open' && <Button size="small" type="link" onClick={() => updateActionStatus(action.id, 'done')}>完成待办</Button>}
                      {action.status === 'open' && <Button size="small" type="link" danger onClick={() => updateActionStatus(action.id, 'cancelled')}>取消待办</Button>}
                    </Space>
                  </Space>
                </Card>
              );
            })}
          </Space>
        )}
      </Drawer>
    </div>
  );
};

export default AsinBatchListPage;
