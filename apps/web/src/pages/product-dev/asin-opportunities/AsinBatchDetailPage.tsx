import React, { useEffect, useMemo, useState } from 'react';
import { Button, Card, Col, Descriptions, Dropdown, Empty, Modal, Input, Progress, Row, Select, Space, Spin, Statistic, Table, Tabs, Tag, Typography, message } from 'antd';
import { BellOutlined, CalendarOutlined, CheckCircleOutlined, CopyOutlined, DownloadOutlined, DownOutlined, LinkOutlined, ReloadOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import type { ColumnsType } from 'antd/es/table';
import type { SorterResult } from 'antd/es/table/interface';
import asinOpportunityApi from '@/api/asinOpportunities';
import { useAuthStore } from '@/stores/authStore';
import AsinReportDrawer from './AsinReportDrawer';
import DesignEvaluationModal from './DesignEvaluationModal';
import SampleEvaluationModal from './SampleEvaluationModal';
import type { BatchDecisionAction, BatchDetail, BatchMetrics, ItemListFilters, ItemReport, ItemRow } from './types';

const workflowStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '待分析', color: 'default' },
  analyzing: { label: '分析中', color: 'processing' },
  analysis_failed: { label: '分析失败', color: 'error' },
  review_required: { label: '待人工复核', color: 'warning' },
  design_evaluation: { label: '待设计评估', color: 'blue' },
  design_submitted: { label: '设计已提交', color: 'purple' },
  design_rework: { label: '设计需修改', color: 'orange' },
  cost_evaluation: { label: '待成本评估', color: 'cyan' },
  sampling: { label: '打样中', color: 'geekblue' },
  project_approved: { label: '已立项', color: 'success' },
  rejected_round_1: { label: '一轮淘汰', color: 'red' },
  design_rejected: { label: '设计淘汰', color: 'red' },
  terminated: { label: '已终止', color: 'red' },
};

const recommendationLabels: Record<string, { label: string; color: string }> = {
  recommend_next_round: { label: '推荐进入下一轮', color: 'success' },
  manual_review: { label: '需要人工复核', color: 'warning' },
  reject: { label: '建议淘汰', color: 'error' },
};

const batchStatusLabels: Record<string, { label: string; color: string }> = {
  submitted: { label: '已提交', color: 'default' },
  analyzing: { label: '分析中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  partially_failed: { label: '部分失败', color: 'warning' },
  cancelled: { label: '已取消', color: 'red' },
};

const analysisStatusLabels: Record<string, { label: string; color: string }> = {
  pending: { label: '待分析', color: 'default' },
  analyzing: { label: '分析中', color: 'processing' },
  completed: { label: '已完成', color: 'success' },
  failed: { label: '分析失败', color: 'error' },
};

const analysisStatusOptions = Object.entries(analysisStatusLabels).map(([value, meta]) => ({ value, label: meta.label }));
const workflowStatusOptions = Object.entries(workflowStatusLabels).map(([value, meta]) => ({ value, label: meta.label }));
const recommendationOptions = Object.entries(recommendationLabels).map(([value, meta]) => ({ value, label: meta.label }));

const sortFieldLabels: Record<string, string> = {
  opportunityScore: '机会分',
  price: '价格',
  rating: '评分',
  reviewCount: '评分数',
  monthlySales: '月销量',
};

const operationPriorityLabels: Record<string, string> = {
  p0: 'P0 优先推进',
  p1Review: 'P1 重点复核',
  p1Normal: 'P1 正常跟进',
  p2: 'P2 建议淘汰',
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

const actionPermissions = {
  retry: 'asin-opportunities.analysis.retry',
  decision: 'asin-opportunities.decision.write',
  designSubmit: 'asin-opportunities.design.submit',
  designReview: 'asin-opportunities.design.review',
  sampleSubmit: 'asin-opportunities.sample.submit',
  projectCreate: 'product-dev.projects.write',
} as const;

const marketplaceDomains: Record<string, string> = {
  US: 'amazon.com',
  UK: 'amazon.co.uk',
  DE: 'amazon.de',
  FR: 'amazon.fr',
  IT: 'amazon.it',
  ES: 'amazon.es',
  JP: 'amazon.co.jp',
  CA: 'amazon.ca',
  AU: 'amazon.com.au',
  IN: 'amazon.in',
  MX: 'amazon.com.mx',
  BR: 'amazon.com.br',
  AE: 'amazon.ae',
};

const rejectReasonOptions = [
  { value: 'market_too_small', label: '市场容量不足' },
  { value: 'competition_too_high', label: '竞争过强' },
  { value: 'brand_monopoly', label: '品牌或头部 ASIN 垄断' },
  { value: 'no_design_space', label: '无明显设计差异化空间' },
  { value: 'compliance_risk', label: '合规或侵权风险高' },
  { value: 'cost_unworkable', label: '成本结构不可行' },
  { value: 'supply_chain_risk', label: '供应链风险高' },
];

const rejectReasonLabelMap = rejectReasonOptions.reduce<Record<string, string>>((acc, item) => {
  acc[item.value] = item.label;
  return acc;
}, { unknown: '未知原因' });

function renderScore(value: number | null) {
  return value != null ? Number(value).toFixed(1) : '-';
}

function optionLabel(options: Array<{ value: string; label: string }>, value?: string) {
  return options.find((item) => item.value === value)?.label || value || '';
}

function getBatchHealthScore(batch: BatchDetail) {
  const analyzedRate = batch.totalCount ? Math.round((batch.analyzedCount / batch.totalCount) * 100) : 0;
  const recommendedRate = batch.totalCount ? Math.round((batch.recommendedCount / batch.totalCount) * 100) : 0;
  const rejectedRate = batch.totalCount ? Math.round((batch.rejectedCount / batch.totalCount) * 100) : 0;
  const pendingReviewCount = Math.max(0, batch.analyzedCount - batch.recommendedCount - batch.rejectedCount);
  const pendingReviewRate = batch.totalCount ? Math.round((pendingReviewCount / batch.totalCount) * 100) : 0;
  const coveragePenalty = Math.round((100 - analyzedRate) * 0.4);
  const lowYieldPenalty = analyzedRate === 100 && recommendedRate < 10 ? 30 : 0;
  const reviewPenalty = pendingReviewCount > 0 ? Math.min(25, pendingReviewRate) : 0;
  const rejectionPenalty = rejectedRate >= 50 ? 15 : 0;
  return Math.max(0, Math.min(100, 100 - coveragePenalty - lowYieldPenalty - reviewPenalty - rejectionPenalty));
}

const AsinBatchDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const permissions = useAuthStore((s) => s.permissions);
  const [loading, setLoading] = useState(true);
  const [batch, setBatch] = useState<BatchDetail | null>(null);
  const [items, setItems] = useState<ItemRow[]>([]);
  const [metrics, setMetrics] = useState<BatchMetrics>({ rejectionReasonDistribution: [] });
  const [reportOpen, setReportOpen] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [reportData, setReportData] = useState<ItemReport | null>(null);
  const [designOpen, setDesignOpen] = useState(false);
  const [activeItemId, setActiveItemId] = useState<number | null>(null);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectComment, setRejectComment] = useState('');
  const [sampleOpen, setSampleOpen] = useState(false);
  const [filters, setFilters] = useState<ItemListFilters>({});
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0 });
  const [exporting, setExporting] = useState(false);
  const [retryingBatch, setRetryingBatch] = useState(false);
  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([]);
  const [batchActioning, setBatchActioning] = useState(false);
  const [decisionHistory, setDecisionHistory] = useState<Array<{ id: number; itemId: number; asin?: string; roundName: string; action: string; fromStatus: string | null; toStatus: string | null; reason: string | null; comment: string | null; createdAt: string }>>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyLoaded, setHistoryLoaded] = useState(false);
  const [historyActionFilter, setHistoryActionFilter] = useState<string | undefined>(undefined);
  const [batchActions, setBatchActions] = useState<BatchDecisionAction[]>([]);
  const [batchActionsLoading, setBatchActionsLoading] = useState(false);
  const [batchActionsLoaded, setBatchActionsLoaded] = useState(false);
  const [metaEditing, setMetaEditing] = useState(false);
  const [metaSaving, setMetaSaving] = useState(false);
  const [metaForm, setMetaForm] = useState({ productDirection: '', targetCategory: '', remark: '' });
  const [ssConfigured, setSsConfigured] = useState<boolean | null>(null);

  const canAction = (action: keyof typeof actionPermissions) => {
    if (!permissions.length || permissions.includes('*')) return true;
    return permissions.includes(actionPermissions[action]);
  };

  const load = async (nextFilters = filters, nextPage = pagination.page, nextPageSize = pagination.pageSize) => {
    if (!id) return;
    setLoading(true);
    try {
      const [batchRes, itemsRes] = await Promise.all([
        asinOpportunityApi.getBatch(id),
        asinOpportunityApi.listBatchItems(id, {
          page: nextPage,
          pageSize: nextPageSize,
          ...nextFilters,
        }),
      ]);
      setBatch(batchRes.data?.data ?? null);
      setItems(itemsRes.data?.data?.items ?? []);
      setPagination({
        page: itemsRes.data?.data?.page ?? nextPage,
        pageSize: itemsRes.data?.data?.pageSize ?? nextPageSize,
        total: itemsRes.data?.data?.total ?? 0,
      });
    } catch {
      message.error('加载批次详情失败');
    } finally {
      setLoading(false);
    }

    try {
      const metricsRes = await asinOpportunityApi.getBatchMetrics(id);
      setMetrics(metricsRes.data?.data ?? { rejectionReasonDistribution: [] });
    } catch {
      setMetrics({ rejectionReasonDistribution: [] });
    }
  };

  useEffect(() => { load(); }, [id]);

  useEffect(() => {
    asinOpportunityApi.getIntegrationStatus().then((res) => {
      setSsConfigured(res.data?.data?.sellerSpriteConfigured ?? false);
    }).catch(() => setSsConfigured(false));
  }, []);

  useEffect(() => {
    if (batch) setMetaForm({ productDirection: batch.productDirection || '', targetCategory: batch.targetCategory || '', remark: batch.remark || '' });
  }, [batch]);

  const applyFilters = (nextFilters: ItemListFilters) => {
    setFilters(nextFilters);
    load(nextFilters, 1, pagination.pageSize);
  };

  const handleTableChange = (nextPagination: { current?: number; pageSize?: number }, sorter: SorterResult<ItemRow> | SorterResult<ItemRow>[]) => {
    const activeSorter = Array.isArray(sorter) ? sorter[0] : sorter;
    const nextFilters = {
      ...filters,
      sortBy: activeSorter?.order ? String(activeSorter.field) : null,
      sortOrder: activeSorter?.order === 'ascend' ? 'asc' as const : activeSorter?.order === 'descend' ? 'desc' as const : null,
    };
    setFilters(nextFilters);
    load(nextFilters, nextPagination.current || 1, nextPagination.pageSize || pagination.pageSize);
  };

  const resetFilters = () => {
    setFilters({});
    load({}, 1, pagination.pageSize);
  };

  const removeFilter = (key: keyof ItemListFilters) => {
    const nextFilters = {
      ...filters,
      [key]: key.includes('OpportunityScore') ? null : undefined,
      ...(key === 'sortBy' ? { sortOrder: null } : {}),
    };
    applyFilters(nextFilters);
  };

  const applyOpportunityPreset = (presetFilters: ItemListFilters) => {
    const nextFilters = {
      ...filters,
      analysisStatus: undefined,
      minOpportunityScore: null,
      maxOpportunityScore: null,
      ...presetFilters,
    };
    applyFilters(nextFilters);
  };


  const exportItems = async () => {
    if (!id) return;
    setExporting(true);
    try {
      const res = await asinOpportunityApi.exportBatchItems(id, filters);
      const blob = new Blob([res.data], { type: 'text/csv;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `asin-opportunity-batch-${id}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
      message.success('导出成功');
    } catch {
      message.error('导出失败');
    }
    setExporting(false);
  };

  const retryBatchFailed = async () => {
    if (!id || !batch) return;
    const failedCount = items.filter((item) => ['pending', 'failed'].includes(item.analysisStatus) || item.analysisStatus === 'analyzing').length;
    Modal.confirm({
      title: '重试未完成/失败 ASIN',
      content: (
        <div>
          <Typography.Paragraph>系统将重新分析当前批次中尚未完成的 ASIN。</Typography.Paragraph>
          <Typography.Text type="secondary">当前批次未分析/失败数量约 {Math.max(0, batch.totalCount - batch.analyzedCount)} 个（本页可见 {failedCount} 个）</Typography.Text>
        </div>
      ),
      okText: '确认重试',
      cancelText: '取消',
      onOk: async () => {
        setRetryingBatch(true);
        try {
          const res = await asinOpportunityApi.retryBatchFailed(id);
          const retried = res.data?.data?.retried?.length ?? 0;
          const skipped = res.data?.data?.skipped ?? 0;
          if (retried > 0) {
            message.success(`已触发 ${retried} 个 ASIN 重新分析${skipped > 0 ? `，${skipped} 个已完成已跳过` : ''}`);
          } else {
            message.info('当前批次没有需要重试的 ASIN');
          }
          await load();
        } catch {
          message.error('批量重试失败');
        }
        setRetryingBatch(false);
      },
    });
  };

  const batchNextRound = async () => {
    const eligibleIds = items
      .filter((item) => selectedRowKeys.includes(item.id) && item.workflowStatus === 'review_required')
      .map((item) => item.id);
    if (!eligibleIds.length) {
      message.warning('当前选中行中没有处于"待人工复核"阶段的 ASIN，无法批量通过。');
      return;
    }
    Modal.confirm({
      title: `批量推进到下一轮（${eligibleIds.length} 个 ASIN）`,
      content: '确认将选中的待复核 ASIN 全部推进到下一轮？',
      okText: '确认',
      cancelText: '取消',
      onOk: async () => {
        setBatchActioning(true);
        let successCount = 0;
        for (const itemId of eligibleIds) {
          try {
            await asinOpportunityApi.makeDecision(itemId, { action: 'next_round', reason: null });
            successCount++;
          } catch { /* skip */ }
        }
        message.success(`已批量推进 ${successCount} 个 ASIN`);
        setSelectedRowKeys([]);
        setBatchActioning(false);
        await load();
      },
    });
  };

  const batchReject = async (reason: string) => {
    const eligibleIds = items
      .filter((item) => selectedRowKeys.includes(item.id) && ['review_required', 'design_evaluation'].includes(item.workflowStatus))
      .map((item) => item.id);
    if (!eligibleIds.length) {
      message.warning('当前选中行中没有可淘汰的 ASIN（需处于"待人工复核"或"设计评估"阶段）。');
      return;
    }
    setBatchActioning(true);
    let successCount = 0;
    for (const itemId of eligibleIds) {
      try {
        await asinOpportunityApi.makeDecision(itemId, { action: 'reject', reason });
        successCount++;
      } catch { /* skip */ }
    }
    message.success(`已批量淘汰 ${successCount} 个 ASIN（${rejectReasonLabelMap[reason] || reason}）`);
    setSelectedRowKeys([]);
    setBatchActioning(false);
    await load();
  };

  const loadDecisionHistory = async () => {
    if (!id || historyLoaded) return;
    setHistoryLoading(true);
    try {
      const res = await asinOpportunityApi.getBatchDecisionHistory(id, { pageSize: 200 });
      setDecisionHistory(res.data?.data?.items ?? []);
      setHistoryLoaded(true);
    } catch {
      setDecisionHistory([]);
      setHistoryLoaded(true);
    }
    setHistoryLoading(false);
  };

  const loadBatchActions = async () => {
    if (!id || batchActionsLoaded) return;
    setBatchActionsLoading(true);
    try {
      const res = await asinOpportunityApi.listBatchDecisionActions({ batchId: Number(id), pageSize: 50 });
      setBatchActions(res.data?.data?.items ?? []);
      setBatchActionsLoaded(true);
    } catch {
      setBatchActions([]);
      setBatchActionsLoaded(true);
    }
    setBatchActionsLoading(false);
  };

  const createBatchAction = async (actionType: string) => {
    if (!id) return;
    try {
      await asinOpportunityApi.createBatchDecisionActions({
        batchIds: [Number(id)],
        actionType,
        conclusion: batchConclusion.label === '建议推进' ? 'push' : batchConclusion.label === '建议复盘' ? 'review' : batchConclusion.label === '先补齐分析' ? 'completeAnalysis' : 'observe',
      });
      message.success('动作已创建');
      setBatchActionsLoaded(false);
      await loadBatchActions();
    } catch {
      message.error('创建动作失败');
    }
  };

  const completeBatchAction = async (actionId: number) => {
    try {
      await asinOpportunityApi.updateBatchDecisionActionStatus(actionId, { status: 'done' });
      message.success('待办已完成');
      setBatchActionsLoaded(false);
      await loadBatchActions();
    } catch {
      message.error('更新状态失败');
    }
  };

  const cancelBatchAction = async (actionId: number) => {
    try {
      await asinOpportunityApi.updateBatchDecisionActionStatus(actionId, { status: 'cancelled' });
      message.success('待办已取消');
      setBatchActionsLoaded(false);
      await loadBatchActions();
    } catch {
      message.error('更新状态失败');
    }
  };

  const saveMeta = async () => {
    if (!id) return;
    setMetaSaving(true);
    try {
      await asinOpportunityApi.updateBatchMeta(id, metaForm);
      message.success('批次信息已更新');
      setMetaEditing(false);
      await load();
    } catch {
      message.error('更新失败');
    }
    setMetaSaving(false);
  };


  const handleTabChange = (activeKey: string) => {
    if (activeKey === 'history') { loadDecisionHistory(); loadBatchActions(); }
    if (activeKey === 'actions') loadBatchActions();
  };

  const openReport = async (itemId: number) => {
    setReportOpen(true);
    setReportLoading(true);
    try {
      const res = await asinOpportunityApi.getItemReport(itemId);
      setReportData(res.data?.data ?? null);
    } catch {
      message.error('加载报告失败');
    }
    setReportLoading(false);
  };

  const doDecision = async (itemId: number, action: string, reason?: string) => {
    try {
      await asinOpportunityApi.makeDecision(itemId, { action, reason });
      message.success('操作成功');
      await load();
    } catch {
      message.error('操作失败');
    }
  };

  const createProjectFromItem = async (record: ItemRow) => {
    Modal.confirm({
      title: '转为产品开发项目',
      content: (
        <Space direction="vertical" size={4}>
          <Typography.Text>确认将该 ASIN 创建为产品开发项目？</Typography.Text>
          <Typography.Text type="secondary">{record.asin} · {record.productTitle || '-'}</Typography.Text>
        </Space>
      ),
      okText: '创建项目',
      cancelText: '取消',
      onOk: async () => {
        try {
          const res = await asinOpportunityApi.createProjectFromItem(record.id);
          const project = res.data?.data?.project;
          message.success(project?.projectCode ? `项目已创建：${project.projectCode}` : '项目已创建');
          if (project?.id) navigate(`/product-dev/projects/${project.id}`);
        } catch {
          message.error('创建项目失败');
        }
      },
    });
  };

  const reviewDesign = async (itemId: number, decision: string, comment?: string) => {
    try {
      await asinOpportunityApi.reviewDesignEvaluation(itemId, { decision, comment: comment || null });
      message.success('设计审核已更新');
      await load();
    } catch {
      message.error('设计审核失败');
    }
  };

  const renderWorkflowTag = (status: string) => {
    const meta = workflowStatusLabels[status] || { label: status, color: 'default' };
    return <Tag color={meta.color}>{meta.label}</Tag>;
  };

  const renderRecommendationTag = (recommendation: string | null) => {
    if (!recommendation) return '-';
    const meta = recommendationLabels[recommendation] || { label: recommendation, color: 'default' };
    return <Tag color={meta.color}>{meta.label}</Tag>;
  };

  const getColumnSortOrder = (field: string) => {
    if (filters.sortBy !== field) return undefined;
    return filters.sortOrder === 'asc' ? 'ascend' as const : filters.sortOrder === 'desc' ? 'descend' as const : undefined;
  };

  const opportunityDistribution = useMemo(() => {
    const result = {
      highPotential: 0,
      reviewable: 0,
      lowPotential: 0,
      pending: 0,
    };
    for (const item of items) {
      if (item.opportunityScore == null) {
        result.pending += 1;
      } else if (item.opportunityScore >= 70) {
        result.highPotential += 1;
      } else if (item.opportunityScore >= 50) {
        result.reviewable += 1;
      } else {
        result.lowPotential += 1;
      }
    }
    return result;
  }, [items]);

  const activeFilterTags = useMemo(() => {
    const tags: Array<{ key: keyof ItemListFilters; label: string }> = [];
    if (filters.keyword) tags.push({ key: 'keyword', label: `关键词：${filters.keyword}` });
    if (filters.analysisStatus) tags.push({ key: 'analysisStatus', label: `分析状态：${optionLabel(analysisStatusOptions, filters.analysisStatus)}` });
    if (filters.workflowStatus) tags.push({ key: 'workflowStatus', label: `流程阶段：${optionLabel(workflowStatusOptions, filters.workflowStatus)}` });
    if (filters.recommendation) tags.push({ key: 'recommendation', label: `系统推荐：${optionLabel(recommendationOptions, filters.recommendation)}` });
    if (filters.minOpportunityScore != null) tags.push({ key: 'minOpportunityScore', label: `最低机会分：${filters.minOpportunityScore}` });
    if (filters.maxOpportunityScore != null) tags.push({ key: 'maxOpportunityScore', label: `最高机会分：${filters.maxOpportunityScore}` });
    if (filters.operationPriority) tags.push({ key: 'operationPriority', label: `运营优先级：${operationPriorityLabels[filters.operationPriority] || filters.operationPriority}` });
    if (filters.sortBy) tags.push({ key: 'sortBy', label: `排序：${sortFieldLabels[filters.sortBy] || filters.sortBy} ${filters.sortOrder === 'asc' ? '升序' : '降序'}` });
    return tags;
  }, [filters]);

  const getOperationPriorityKind = (record: ItemRow) => {
    const score = record.opportunityScore ?? 0;
    const risk = record.riskScore ?? 0;
    if (record.recommendation === 'recommend_next_round' && score >= 75 && risk < 60) return 'p0';
    if (record.recommendation === 'manual_review' || risk >= 60 || ['review_required', 'design_rework'].includes(record.workflowStatus)) return 'p1Review';
    if (record.recommendation === 'reject' || score < 40 || ['rejected_round_1', 'design_rejected', 'terminated'].includes(record.workflowStatus)) return 'p2';
    return 'p1Normal';
  };

  const renderOperationPriority = (record: ItemRow) => {
    const kind = getOperationPriorityKind(record);
    if (kind === 'p0') return <Tag color="success">P0 优先推进</Tag>;
    if (kind === 'p1Review') return <Tag color="warning">P1 重点复核</Tag>;
    if (kind === 'p2') return <Tag color="error">P2 建议淘汰</Tag>;
    return <Tag color="blue">P1 正常跟进</Tag>;
  };

  const columns: ColumnsType<ItemRow> = [
    {
      title: 'ASIN',
      dataIndex: 'asin',
      key: 'asin',
      width: 140,
      render: (v: string, record: ItemRow) => {
        const domain = marketplaceDomains[(record.marketplace || batch?.marketplace || 'US').toUpperCase()] || 'amazon.com';
        return (
          <Space size={4}>
            {record.imageUrl ? <img src={record.imageUrl} alt="" style={{ width: 28, height: 28, objectFit: 'cover', borderRadius: 3 }} /> : null}
            <span>{v}</span>
            <a href={`https://www.${domain}/dp/${v}`} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
              <LinkOutlined style={{ color: '#1890ff', fontSize: 11 }} />
            </a>
          </Space>
        );
      },
    },
    { title: '标题', dataIndex: 'productTitle', key: 'productTitle', ellipsis: true, render: (v: string | null, record: ItemRow) => <span>{v || '-'}{record.brand ? <Typography.Text type="secondary" style={{ marginLeft: 6 }}>| {record.brand}</Typography.Text> : null}</span> },
    { title: '流程', dataIndex: 'workflowStatus', key: 'workflowStatus', width: 110, render: renderWorkflowTag },
    { title: '优先级', key: 'operationPriority', width: 100, render: (_: unknown, record: ItemRow) => renderOperationPriority(record) },
    { title: '机会分', dataIndex: 'opportunityScore', key: 'opportunityScore', width: 80, render: renderScore, sorter: true, sortOrder: getColumnSortOrder('opportunityScore') },
    { title: '推荐', dataIndex: 'recommendation', key: 'recommendation', width: 120, render: renderRecommendationTag },
    { title: '价格', dataIndex: 'price', key: 'price', width: 80, render: (v: number | null) => v != null ? `$${v}` : '-', sorter: true, sortOrder: getColumnSortOrder('price') },
    { title: '评分', dataIndex: 'rating', key: 'rating', width: 70, render: (v: number | null) => v != null ? v.toFixed(1) : '-', sorter: true, sortOrder: getColumnSortOrder('rating') },
    { title: '月销', dataIndex: 'monthlySales', key: 'monthlySales', width: 70, sorter: true, sortOrder: getColumnSortOrder('monthlySales') },
    {
      title: '操作', key: 'actions', width: 200, fixed: 'right' as const,
      render: (_: unknown, record: ItemRow) => (
        <Space size={4}>
          <Button size="small" type="link" style={{ padding: 0 }} onClick={() => openReport(record.id)}>详情</Button>
          {canAction('retry') && <Button size="small" type="link" style={{ padding: 0 }} onClick={() => asinOpportunityApi.retryAnalysis(record.id).then(() => load()).catch(() => message.error('重试失败'))}>重试</Button>}
          {canAction('decision') && record.workflowStatus === 'review_required' && <Button size="small" type="link" style={{ padding: 0 }} onClick={() => doDecision(record.id, 'next_round')}>通过</Button>}
          {canAction('decision') && ['review_required', 'design_evaluation'].includes(record.workflowStatus) && (
            <Dropdown menu={{ items: [...rejectReasonOptions.map((opt) => ({ key: opt.value, label: opt.label })), { type: 'divider' as const, key: 'divider' }, { key: '_custom', label: '自定义原因…' }], onClick: ({ key }) => { if (key === '_custom') { setActiveItemId(record.id); setRejectReason(''); setRejectComment(''); setRejectOpen(true); } else { doDecision(record.id, 'reject', key); } } }}>
              <Button size="small" type="link" danger style={{ padding: 0 }}>淘汰 <DownOutlined /></Button>
            </Dropdown>
          )}
          {canAction('projectCreate') && record.analysisStatus === 'completed' && <Button size="small" type="link" style={{ padding: 0 }} onClick={() => createProjectFromItem(record)}>转项目</Button>}
          {canAction('designSubmit') && ['design_evaluation', 'design_rework'].includes(record.workflowStatus) && <Button size="small" type="link" style={{ padding: 0 }} onClick={() => { setActiveItemId(record.id); setDesignOpen(true); }}>设计</Button>}
          {canAction('designReview') && record.workflowStatus === 'design_submitted' && <Button size="small" type="link" style={{ padding: 0 }} onClick={() => reviewDesign(record.id, 'approve')}>审核</Button>}
          {canAction('sampleSubmit') && record.workflowStatus === 'cost_evaluation' && <Button size="small" type="link" style={{ padding: 0 }} onClick={() => { setActiveItemId(record.id); setSampleOpen(true); }}>打样</Button>}
        </Space>
      ),
    },
  ];

  if (loading) return <div style={{ textAlign: 'center', padding: 80 }}><Spin size="large" /></div>;
  if (!batch) return <div style={{ padding: 24 }}><Typography.Text>未找到批次</Typography.Text></div>;
  const batchStatusMeta = batchStatusLabels[batch.status] || { label: batch.status, color: 'default' };
  const analyzedRate = batch.totalCount ? Math.round((batch.analyzedCount / batch.totalCount) * 100) : 0;
  const recommendedRate = batch.totalCount ? Math.round((batch.recommendedCount / batch.totalCount) * 100) : 0;
  const rejectedRate = batch.totalCount ? Math.round((batch.rejectedCount / batch.totalCount) * 100) : 0;
  const pendingReviewCount = Math.max(0, batch.analyzedCount - batch.recommendedCount - batch.rejectedCount);
  const pendingReviewRate = batch.analyzedCount ? Math.round((pendingReviewCount / batch.analyzedCount) * 100) : 0;
  const highRiskCount = items.filter((i) => (i.riskScore ?? 0) >= 60).length;
  const highRiskRate = items.length ? Math.round((highRiskCount / items.length) * 100) : 0;
  const batchHealthScore = getBatchHealthScore(batch);
  const batchHealthColor = batchHealthScore >= 80 ? '#52c41a' : batchHealthScore >= 70 ? '#faad14' : '#ff4d4f';
  const batchHealthLabel = batchHealthScore >= 80 ? '健康' : batchHealthScore >= 70 ? '需关注' : '需复盘';
  const priorityDistribution = items.reduce(
    (acc, item) => {
      acc[getOperationPriorityKind(item)] += 1;
      return acc;
    },
    { p0: 0, p1Review: 0, p1Normal: 0, p2: 0 },
  );
  const topRejectionReason = metrics.rejectionReasonDistribution.length ? [...metrics.rejectionReasonDistribution].sort((a, b) => b.count - a.count)[0] : null;
  const healthDiagnostics = [
    {
      key: 'analysis',
      title: '分析覆盖',
      value: `${analyzedRate}%`,
      status: analyzedRate >= 100 ? 'success' : 'warning',
      problem: analyzedRate >= 100 ? '已完成全部 ASIN 分析。' : `仍有 ${Math.max(0, batch.totalCount - batch.analyzedCount)} 个 ASIN 未分析。`,
      action: analyzedRate >= 100 ? '进入机会筛选与复核分流。' : '优先重试未完成或失败的 ASIN，避免批次判断样本不完整。',
      filter: analyzedRate >= 100 ? undefined : { analysisStatus: 'pending' },
    },
    {
      key: 'recommendation',
      title: '机会产出',
      value: `${recommendedRate}%`,
      status: recommendedRate >= 30 ? 'success' : recommendedRate >= 10 ? 'warning' : 'error',
      problem: recommendedRate >= 30 ? '推荐机会产出较好。' : recommendedRate >= 10 ? '推荐率处于中等区间。' : '推荐率偏低，可能存在选品方向或类目假设偏差。',
      action: recommendedRate >= 30 ? '优先推进 P0 和 P1 正常跟进 ASIN。' : '复盘关键词、价格带、类目口径和风险阈值，必要时拆分新批次验证。',
      filter: recommendedRate >= 30 ? { operationPriority: 'p0' } : undefined,
    },
    {
      key: 'review',
      title: '复核积压',
      value: `${pendingReviewCount}`,
      status: pendingReviewCount === 0 ? 'success' : pendingReviewRate >= 30 ? 'error' : 'warning',
      problem: pendingReviewCount === 0 ? '暂无明显复核积压。' : `有 ${pendingReviewCount} 个 ASIN 需要人工判断。`,
      action: pendingReviewCount === 0 ? '继续推进已明确结论的 ASIN。' : '优先处理 P1 重点复核，减少机会流失和流程阻塞。',
      filter: pendingReviewCount > 0 ? { operationPriority: 'p1Review' } : undefined,
    },
    {
      key: 'rejection',
      title: '淘汰结构',
      value: `${rejectedRate}%`,
      status: rejectedRate < 40 ? 'success' : rejectedRate < 60 ? 'warning' : 'error',
      problem: topRejectionReason ? `主要淘汰原因：${rejectReasonLabelMap[topRejectionReason.reason] || topRejectionReason.reason}。` : '暂无淘汰原因数据。',
      action: rejectedRate >= 50 ? '复盘高频淘汰原因，调整下一批次的关键词、价格带或供应链门槛。' : '持续沉淀淘汰原因，形成选品黑名单规则。',
      filter: rejectedRate > 0 ? { operationPriority: 'p2' } : undefined,
    },
    {
      key: 'risk',
      title: '风险暴露',
      value: `${highRiskRate}%`,
      status: highRiskRate < 20 ? 'success' : highRiskRate < 40 ? 'warning' : 'error',
      problem: highRiskCount ? `当前页有 ${highRiskCount} 个高风险 ASIN。` : '当前页暂无高风险 ASIN。',
      action: highRiskCount ? '先核查合规、侵权、供应链和品牌垄断风险，再决定是否推进。' : '可优先推进高机会低风险 ASIN。',
      filter: highRiskCount ? { operationPriority: 'p1Review' } : { operationPriority: 'p0' },
    },
  ];
  const operationSop = [
    ...(batch.totalCount - batch.analyzedCount > 0 ? [{
      key: 'complete-analysis',
      priority: 'P0',
      title: '补齐分析覆盖',
      reason: `当前仍有 ${batch.totalCount - batch.analyzedCount} 个 ASIN 未分析，批次结论尚不完整。`,
      action: '先重试未完成/失败项，再判断批次是否继续推进。',
      button: '查看待分析',
      filter: { analysisStatus: 'pending' as const },
      color: 'red',
    }] : []),
    ...(pendingReviewCount > 0 ? [{
      key: 'clear-review',
      priority: 'P0',
      title: '清理人工复核队列',
      reason: `有 ${pendingReviewCount} 个 ASIN 卡在复核判断，可能阻塞高潜机会流转。`,
      action: '优先处理 P1 重点复核，明确进入下一轮或淘汰。',
      button: '处理复核项',
      filter: { operationPriority: 'p1Review' as const },
      color: 'orange',
    }] : []),
    ...(priorityDistribution.p0 > 0 ? [{
      key: 'push-p0',
      priority: 'P1',
      title: '推进高潜低风险 ASIN',
      reason: `当前有 ${priorityDistribution.p0} 个 P0 ASIN，具备优先推进价值。`,
      action: '进入设计评估或样品/成本验证，尽快形成项目候选池。',
      button: '查看 P0',
      filter: { operationPriority: 'p0' as const },
      color: 'green',
    }] : []),
    ...(rejectedRate >= 50 ? [{
      key: 'review-rejection',
      priority: 'P1',
      title: '复盘淘汰原因',
      reason: `淘汰率达到 ${rejectedRate}%，说明当前筛选口径可能偏宽或类目假设偏差。`,
      action: topRejectionReason ? `优先复盘「${rejectReasonLabelMap[topRejectionReason.reason] || topRejectionReason.reason}」并反向优化选品规则。` : '补充淘汰原因标签，沉淀下一批次过滤规则。',
      button: '查看淘汰项',
      filter: { operationPriority: 'p2' as const },
      color: 'red',
    }] : []),
    ...(batchHealthScore >= 80 && priorityDistribution.p0 === 0 && pendingReviewCount === 0 ? [{
      key: 'archive-learning',
      priority: 'P2',
      title: '沉淀批次经验',
      reason: '当前批次健康度较好，但暂未形成明确 P0 机会。',
      action: '记录有效关键词、价格带和淘汰规则，用于下一批次提升命中率。',
      button: '查看全部 ASIN',
      filter: {},
      color: 'blue',
    }] : []),
  ];
  const batchConclusion = (() => {
    if (batch.totalCount === 0) {
      return {
        label: '数据不足',
        color: 'default',
        decision: '先补充 ASIN 数据后再进入机会判断。',
        meetingAction: '无需进入选品会，先由运营补齐批次数据。',
      };
    }
    if (analyzedRate < 100) {
      return {
        label: '先补齐分析',
        color: 'warning',
        decision: '当前批次尚未完成分析，不建议直接做推进或淘汰结论。',
        meetingAction: '先安排分析重试/补跑，完成后再进入复盘会。',
      };
    }
    if (priorityDistribution.p0 > 0 && batchHealthScore >= 75) {
      return {
        label: '建议推进',
        color: 'success',
        decision: `存在 ${priorityDistribution.p0} 个 P0 高潜 ASIN，批次具备推进价值。`,
        meetingAction: '进入选品推进会，重点评审 P0 的设计空间、成本结构和供应链可行性。',
      };
    }
    if (pendingReviewCount > 0 || batchHealthScore < 70 || rejectedRate >= 50) {
      return {
        label: '建议复盘',
        color: 'error',
        decision: '当前批次存在复核积压、健康度偏低或淘汰率偏高问题。',
        meetingAction: '进入选品复盘会，重点复盘关键词来源、类目假设、价格带和淘汰原因。',
      };
    }
    return {
      label: '观察沉淀',
      color: 'blue',
      decision: '当前批次无明显高优先级风险，但高潜机会也不突出。',
      meetingAction: '沉淀有效筛选规则，结合下一批次继续验证方向。',
    };
  })();
  const reviewSummary = [
    `[ASIN机会批次复盘] ${batch.name}`,
    `批次号: ${batch.batchNo} | 站点: ${batch.marketplace} | 状态: ${batchStatusMeta.label}`,
    `批次结论: ${batchConclusion.label} | ${batchConclusion.decision}`,
    `健康分: ${batchHealthScore}/100 (${batchHealthLabel})`,
    `核心指标: 总数 ${batch.totalCount}, 已分析 ${batch.analyzedCount} (${analyzedRate}%), 推荐 ${batch.recommendedCount} (${recommendedRate}%), 淘汰 ${batch.rejectedCount} (${rejectedRate}%), 待复核 ${pendingReviewCount}`,
    `运营优先级: P0 ${priorityDistribution.p0}, P1复核 ${priorityDistribution.p1Review}, P1正常 ${priorityDistribution.p1Normal}, P2 ${priorityDistribution.p2}`,
    topRejectionReason ? `主要淘汰原因: ${rejectReasonLabelMap[topRejectionReason.reason] || topRejectionReason.reason} (${topRejectionReason.count})` : '主要淘汰原因: 暂无',
    `关键诊断: ${healthDiagnostics.map((item) => `${item.title}-${item.problem}`).join('; ')}`,
    `会议建议: ${batchConclusion.meetingAction}`,
    operationSop.length ? `下一步动作: ${operationSop.map((item, index) => `${index + 1}. ${item.title}: ${item.action}`).join('; ')}` : '下一步动作: 暂无高优先级动作, 建议沉淀有效筛选规则。',
  ].join('\n');

  const copyReviewSummary = async () => {
    try {
      await navigator.clipboard.writeText(reviewSummary);
      message.success('批次复盘摘要已复制');
    } catch {
      message.error('复制失败，请手动复制');
    }
  };

  return (
    <div style={{ padding: 24 }}>
      {/* Compact header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <Space>
          <Button onClick={() => navigate('/product-dev/asin-opportunities')}>返回</Button>
          <Typography.Title level={4} style={{ margin: 0 }}>{batch.name}</Typography.Title>
          <Tag color={batchStatusMeta.color}>{batchStatusMeta.label}</Tag>
          {ssConfigured === true && <Tag color="green">SellerSprite</Tag>}
          {ssConfigured === false && <Tag color="orange">模拟数据</Tag>}
        </Space>
        <Space>
          {canAction('retry') && <Button icon={<ReloadOutlined />} loading={retryingBatch} onClick={retryBatchFailed}>重试失败</Button>}
          <Button icon={<CopyOutlined />} onClick={copyReviewSummary}>复制摘要</Button>
          <Button icon={<DownloadOutlined />} loading={exporting} onClick={exportItems}>导出</Button>
        </Space>
      </div>

      {/* Key metrics row */}
      <Row gutter={12} style={{ marginBottom: 16 }}>
        <Col span={4}><Card size="small" bodyStyle={{ padding: '8px 12px' }}><Statistic title="总数" value={batch.totalCount} valueStyle={{ fontSize: 20 }} /></Card></Col>
        <Col span={4}><Card size="small" bodyStyle={{ padding: '8px 12px' }}><Statistic title="已分析" value={batch.analyzedCount} suffix={<span style={{ fontSize: 12 }}>/ {analyzedRate}%</span>} valueStyle={{ fontSize: 20 }} /></Card></Col>
        <Col span={4}><Card size="small" bodyStyle={{ padding: '8px 12px' }} hoverable onClick={() => applyFilters({ operationPriority: 'p0' })}><Statistic title="P0 推进" value={priorityDistribution.p0} valueStyle={{ fontSize: 20, color: '#3f8600' }} /></Card></Col>
        <Col span={4}><Card size="small" bodyStyle={{ padding: '8px 12px' }} hoverable onClick={() => applyFilters({ operationPriority: 'p1Review' })}><Statistic title="P1 复核" value={priorityDistribution.p1Review} valueStyle={{ fontSize: 20, color: '#fa8c16' }} /></Card></Col>
        <Col span={4}><Card size="small" bodyStyle={{ padding: '8px 12px' }} hoverable onClick={() => applyFilters({ operationPriority: 'p2' })}><Statistic title="P2 淘汰" value={priorityDistribution.p2} valueStyle={{ fontSize: 20, color: '#cf1322' }} /></Card></Col>
        <Col span={4}><Card size="small" bodyStyle={{ padding: '8px 12px' }}><Statistic title="健康分" value={batchHealthScore} suffix="/100" valueStyle={{ fontSize: 20, color: batchHealthColor }} /></Card></Col>
      </Row>

      {/* Batch conclusion bar */}
      <Card size="small" style={{ marginBottom: 16, borderColor: batchConclusion.color === 'error' ? '#ffccc7' : batchConclusion.color === 'success' ? '#b7eb8f' : '#d9d9d9' }}>
        <Row gutter={16} align="middle">
          <Col><Tag color={batchConclusion.color === 'success' ? 'green' : batchConclusion.color === 'error' ? 'red' : 'blue'} style={{ fontSize: 14, padding: '2px 12px' }}>{batchConclusion.label}</Tag></Col>
          <Col flex="auto"><Typography.Text>{batchConclusion.decision}</Typography.Text></Col>
          <Col><Typography.Text type="secondary">{batchConclusion.meetingAction}</Typography.Text></Col>
        </Row>
      </Card>

      {/* Compact filter bar */}
      <Card size="small" style={{ marginBottom: 16 }}>
        <Space wrap>
          <Input allowClear placeholder="搜索 ASIN/标题/品牌" value={filters.keyword} style={{ width: 200 }} onChange={(e) => setFilters((prev) => ({ ...prev, keyword: e.target.value }))} onPressEnter={() => applyFilters(filters)} />
          <Select allowClear placeholder="流程阶段" value={filters.workflowStatus} options={workflowStatusOptions} style={{ width: 140 }} onChange={(value) => applyFilters({ ...filters, workflowStatus: value })} />
          <Select allowClear placeholder="推荐" value={filters.recommendation} options={recommendationOptions} style={{ width: 140 }} onChange={(value) => applyFilters({ ...filters, recommendation: value })} />
          <Button size="small" type={filters.minOpportunityScore === 70 ? 'primary' : 'default'} onClick={() => applyFilters({ minOpportunityScore: 70 })}>高潜</Button>
          <Button size="small" type={filters.workflowStatus === 'review_required' ? 'primary' : 'default'} onClick={() => applyFilters({ workflowStatus: 'review_required' })}>待复核</Button>
          <Button size="small" onClick={resetFilters}>重置</Button>
          <Typography.Text type="secondary">命中 {pagination.total}</Typography.Text>
          {activeFilterTags.length > 0 && <Space wrap size={4}>{activeFilterTags.map((item) => <Tag key={item.key} closable onClose={() => removeFilter(item.key)}>{item.label}</Tag>)}</Space>}
        </Space>
      </Card>

      <Tabs
        onChange={handleTabChange}
        items={[
          {
            key: 'analysis',
            label: `分析结果（${pagination.total}）`,
            children: (
              <Card>
                {selectedRowKeys.length > 0 && canAction('decision') && (() => {
                  const selectedItems = items.filter((item) => selectedRowKeys.includes(item.id));
                  const reviewCount = selectedItems.filter((i) => i.workflowStatus === 'review_required').length;
                  const designCount = selectedItems.filter((i) => ['review_required', 'design_evaluation'].includes(i.workflowStatus)).length;
                  return (
                    <Space style={{ marginBottom: 12 }} wrap>
                      <Typography.Text type="secondary">已选 {selectedRowKeys.length} 项</Typography.Text>
                      <Typography.Text type="secondary">（可通过: {reviewCount} · 可淘汰: {designCount}）</Typography.Text>
                      <Button size="small" type="primary" loading={batchActioning} disabled={!reviewCount} onClick={batchNextRound}>批量通过（{reviewCount}）</Button>
                      <Dropdown disabled={!designCount} menu={{ items: rejectReasonOptions.map((opt) => ({ key: opt.value, label: opt.label })), onClick: ({ key }) => { Modal.confirm({ title: `批量淘汰（${designCount} 个符合条件）`, content: `确认以"${rejectReasonLabelMap[key] || key}"为原因批量淘汰？仅对待复核/设计评估阶段的 ASIN 生效。`, okText: '确认淘汰', okButtonProps: { danger: true }, cancelText: '取消', onOk: () => batchReject(key) }); } }}>
                        <Button size="small" danger loading={batchActioning} disabled={!designCount}>批量淘汰（{designCount}）<DownOutlined /></Button>
                      </Dropdown>
                      <Button size="small" onClick={() => setSelectedRowKeys(items.map((i) => i.id))}>全选当前页</Button>
                      <Button size="small" onClick={() => setSelectedRowKeys([])}>取消选择</Button>
                    </Space>
                  );
                })()}
                <Table
                  dataSource={items}
                  columns={columns}
                  rowKey="id"
                  size="small"
                  rowSelection={{
                    selectedRowKeys,
                    onChange: (keys) => setSelectedRowKeys(keys),
                  }}
                  pagination={{
                    current: pagination.page,
                    pageSize: pagination.pageSize,
                    total: pagination.total,
                    showSizeChanger: true,
                    showTotal: (total) => `共 ${total} 个 ASIN`,
                  }}
                  expandable={{
                    expandedRowRender: (record: ItemRow) => (
                      <div style={{ padding: '8px 0' }}>
                        <Row gutter={24}>
                          <Col span={8}>
                            <Descriptions column={1} size="small">
                              <Descriptions.Item label="品牌">{record.brand || '-'}</Descriptions.Item>
                              <Descriptions.Item label="类目">{record.category || '-'}</Descriptions.Item>
                              <Descriptions.Item label="Review">{record.reviewCount ?? '-'}</Descriptions.Item>
                              <Descriptions.Item label="BSR">{record.bsr != null ? (record.bsr <= 1000 ? <Tag color="green">{record.bsr}</Tag> : record.bsr <= 10000 ? <Tag color="blue">{record.bsr}</Tag> : <Tag>{record.bsr}</Tag>) : '-'}</Descriptions.Item>
                            </Descriptions>
                          </Col>
                          <Col span={8}>
                            <Descriptions column={1} size="small">
                              <Descriptions.Item label="月销量">{record.monthlySales ?? '-'}</Descriptions.Item>
                              <Descriptions.Item label="月销售额">{record.monthlyRevenue != null ? `$${record.monthlyRevenue.toLocaleString()}` : '-'}</Descriptions.Item>
                              <Descriptions.Item label="卖家数">{record.sellers ?? '-'}</Descriptions.Item>
                              <Descriptions.Item label="LQS">{record.lqs ?? '-'}</Descriptions.Item>
                            </Descriptions>
                          </Col>
                          <Col span={8}>
                            <Descriptions column={1} size="small">
                              <Descriptions.Item label="市场分">{renderScore(record.marketScore)}</Descriptions.Item>
                              <Descriptions.Item label="竞争分">{renderScore(record.competitionScore)}</Descriptions.Item>
                              <Descriptions.Item label="设计分">{renderScore(record.designScore)}</Descriptions.Item>
                              <Descriptions.Item label="风险分">{renderScore(record.riskScore)}</Descriptions.Item>
                            </Descriptions>
                          </Col>
                        </Row>
                        {(record.riskScore ?? 0) >= 60 && <Typography.Text type="danger" style={{ marginTop: 4, display: 'block' }}>风险提示：风险评分 {renderScore(record.riskScore)}，建议重点关注合规性和供应链可行性</Typography.Text>}
                        {record.recommendationReason && <Typography.Text type="secondary" style={{ fontSize: 12 }}>推荐原因：{record.recommendationReason}</Typography.Text>}
                      </div>
                    ),
                    rowExpandable: (record: ItemRow) => record.analysisStatus === 'completed',
                  }}
                  onChange={(nextPagination, _filters, sorter) => handleTableChange(nextPagination, sorter)}
                  onRow={(record) => {
                    const kind = getOperationPriorityKind(record);
                    const backgroundColor = kind === 'p0' ? '#f6ffed' : kind === 'p1Review' ? '#fffbe6' : kind === 'p2' ? '#fff1f0' : undefined;
                    return { style: backgroundColor ? { backgroundColor } : undefined };
                  }}
                  scroll={{ x: 1200 }}
                  locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无 ASIN 分析结果" /> }}
                />
              </Card>
            ),
          },
          {
            key: 'design',
            label: `设计评估（${items.filter((item) => ['design_evaluation', 'design_submitted', 'design_rework', 'cost_evaluation'].includes(item.workflowStatus)).length}）`,
            children: (() => {
              const designItems = items.filter((item) => ['design_evaluation', 'design_submitted', 'design_rework', 'cost_evaluation'].includes(item.workflowStatus));
              const waitDesign = designItems.filter((i) => i.workflowStatus === 'design_evaluation').length;
              const submitted = designItems.filter((i) => i.workflowStatus === 'design_submitted').length;
              const rework = designItems.filter((i) => i.workflowStatus === 'design_rework').length;
              const costEval = designItems.filter((i) => i.workflowStatus === 'cost_evaluation').length;
              return (
                <Card>
                  <Space style={{ marginBottom: 12 }} wrap>
                    <Tag color="blue">待设计: {waitDesign}</Tag>
                    <Tag color="purple">已提交: {submitted}</Tag>
                    <Tag color="orange">需修改: {rework}</Tag>
                    <Tag color="cyan">待成本评估: {costEval}</Tag>
                  </Space>
                  <Table
                    dataSource={designItems}
                    columns={columns}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 20 }}
                    expandable={{
                      expandedRowRender: (record: ItemRow) => (
                        <Space direction="vertical" size={4}>
                          <Typography.Text><b>机会分</b>: {renderScore(record.opportunityScore)} · 市场 {renderScore(record.marketScore)} · 竞争 {renderScore(record.competitionScore)} · 设计 {renderScore(record.designScore)}</Typography.Text>
                          {record.brand && <Typography.Text type="secondary">品牌: {record.brand}{record.category ? ` · 类目: ${record.category}` : ''}</Typography.Text>}
                          {record.price != null && <Typography.Text type="secondary">售价: ${record.price}{record.monthlySales != null ? ` · 月销: ${record.monthlySales}` : ''}</Typography.Text>}
                        </Space>
                      ),
                      rowExpandable: () => true,
                    }}
                    scroll={{ x: 1200 }}
                    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无设计评估中的 ASIN" /> }}
                  />
                </Card>
              );
            })(),
          },
          {
            key: 'sample',
            label: `成本/打样（${items.filter((item) => ['cost_evaluation', 'sampling', 'project_approved', 'terminated'].includes(item.workflowStatus)).length}）`,
            children: (() => {
              const sampleItems = items.filter((item) => ['cost_evaluation', 'sampling', 'project_approved', 'terminated'].includes(item.workflowStatus));
              const costEvalCount = sampleItems.filter((i) => i.workflowStatus === 'cost_evaluation').length;
              const samplingCount = sampleItems.filter((i) => i.workflowStatus === 'sampling').length;
              const approvedCount = sampleItems.filter((i) => i.workflowStatus === 'project_approved').length;
              const terminatedCount = sampleItems.filter((i) => i.workflowStatus === 'terminated').length;
              return (
                <Card>
                  <Space style={{ marginBottom: 12 }} wrap>
                    <Tag color="cyan">待成本评估: {costEvalCount}</Tag>
                    <Tag color="geekblue">打样中: {samplingCount}</Tag>
                    <Tag color="success">已立项: {approvedCount}</Tag>
                    <Tag color="red">已终止: {terminatedCount}</Tag>
                  </Space>
                  <Table
                    dataSource={sampleItems}
                    columns={columns}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 20 }}
                    expandable={{
                      expandedRowRender: (record: ItemRow) => (
                        <Space direction="vertical" size={4}>
                          <Typography.Text><b>机会分</b>: {renderScore(record.opportunityScore)} · 市场 {renderScore(record.marketScore)} · 竞争 {renderScore(record.competitionScore)}</Typography.Text>
                          {record.price != null && <Typography.Text type="secondary">售价: ${record.price}{record.monthlySales != null ? ` · 月销: ${record.monthlySales}` : ''}{record.monthlyRevenue != null ? ` · 月收入: $${record.monthlyRevenue.toLocaleString()}` : ''}</Typography.Text>}
                          {record.brand && <Typography.Text type="secondary">品牌: {record.brand}{record.category ? ` · 类目: ${record.category}` : ''}</Typography.Text>}
                        </Space>
                      ),
                      rowExpandable: () => true,
                    }}
                    scroll={{ x: 1200 }}
                    locale={{ emptyText: <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无成本/打样评估中的 ASIN" /> }}
                  />
                </Card>
              );
            })(),
          },
          {
            key: 'pipeline',
            label: '管道看板',
            children: (() => {
              const pipelineStages = [
                { key: 'pending', label: '待分析', color: '#d9d9d9' },
                { key: 'analyzing', label: '分析中', color: '#1890ff' },
                { key: 'review_required', label: '待复核', color: '#fa8c16' },
                { key: 'design_evaluation', label: '设计评估', color: '#1677ff' },
                { key: 'design_submitted', label: '设计已提交', color: '#722ed1' },
                { key: 'cost_evaluation', label: '成本评估', color: '#13c2c2' },
                { key: 'sampling', label: '打样中', color: '#2f54eb' },
                { key: 'project_approved', label: '已立项', color: '#52c41a' },
                { key: 'terminated', label: '已终止', color: '#ff4d4f' },
              ];
              const pipelineMap = pipelineStages.reduce<Record<string, ItemRow[]>>((acc, stage) => {
                acc[stage.key] = items.filter((i) => i.workflowStatus === stage.key);
                return acc;
              }, {});
              const rejectedItems = items.filter((i) => ['rejected_round_1', 'design_rejected'].includes(i.workflowStatus));
              return (
                <div style={{ overflowX: 'auto', paddingBottom: 8 }}>
                  <Space size={12} align="start">
                    {pipelineStages.filter((s) => (pipelineMap[s.key] ?? []).length > 0 || ['review_required', 'design_evaluation', 'cost_evaluation'].includes(s.key)).map((stage) => {
                      const stageItems = pipelineMap[stage.key] ?? [];
                      return (
                      <div key={stage.key} style={{ minWidth: 200, maxWidth: 260, background: '#fafafa', borderRadius: 8, padding: 12 }}>
                        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography.Text strong style={{ color: stage.color }}>{stage.label}</Typography.Text>
                          <Tag color={stage.color}>{stageItems.length}</Tag>
                        </div>
                        <Space direction="vertical" style={{ width: '100%' }} size={6}>
                          {stageItems.map((item) => (
                            <Card key={item.id} size="small" hoverable style={{ borderLeft: `3px solid ${stage.color}` }} onClick={() => openReport(item.id)}>
                              <Typography.Text strong style={{ fontSize: 12 }}>{item.asin}</Typography.Text>
                              <Typography.Paragraph ellipsis style={{ fontSize: 11, marginBottom: 2, color: '#666' }}>{item.productTitle || '-'}</Typography.Paragraph>
                              <Space size={4} wrap>
                                {item.opportunityScore != null && <Tag style={{ fontSize: 10 }}>{item.opportunityScore}分</Tag>}
                                {item.brand && <Typography.Text style={{ fontSize: 10 }} type="secondary">{item.brand}</Typography.Text>}
                              </Space>
                            </Card>
                          ))}
                          {stageItems.length === 0 && <Typography.Text type="secondary" style={{ fontSize: 12 }}>暂无</Typography.Text>}
                        </Space>
                      </div>
                    );
                    })}
                    {rejectedItems.length > 0 && (
                      <div style={{ minWidth: 200, maxWidth: 260, background: '#fff1f0', borderRadius: 8, padding: 12 }}>
                        <div style={{ marginBottom: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography.Text strong style={{ color: '#ff4d4f' }}>已淘汰</Typography.Text>
                          <Tag color="error">{rejectedItems.length}</Tag>
                        </div>
                        <Space direction="vertical" style={{ width: '100%' }} size={6}>
                          {rejectedItems.map((item) => (
                            <Card key={item.id} size="small" hoverable style={{ borderLeft: '3px solid #ff4d4f', opacity: 0.7 }} onClick={() => openReport(item.id)}>
                              <Typography.Text strong style={{ fontSize: 12 }}>{item.asin}</Typography.Text>
                              <Typography.Paragraph ellipsis style={{ fontSize: 11, marginBottom: 2, color: '#666' }}>{item.productTitle || '-'}</Typography.Paragraph>
                            </Card>
                          ))}
                        </Space>
                      </div>
                    )}
                  </Space>
                </div>
              );
            })(),
          },
          {
            key: 'actions',
            label: `批次动作${batchActions.length ? `（${batchActions.filter((a) => a.status === 'open').length}/${batchActions.length}）` : ''}`,
            children: (
              <Card>
                <Space wrap style={{ marginBottom: 12 }}>
                  <Button size="small" type="primary" icon={<CalendarOutlined />} onClick={() => createBatchAction('create_meeting')}>创建会议</Button>
                  <Button size="small" icon={<CheckCircleOutlined />} onClick={() => createBatchAction('mark_decision')}>标记决策</Button>
                  <Button size="small" icon={<BellOutlined />} onClick={() => createBatchAction('notify_owner')}>通知负责人</Button>
                  <Button size="small" icon={<ReloadOutlined />} onClick={() => { setBatchActionsLoaded(false); loadBatchActions(); }}>刷新</Button>
                </Space>
                {batchActionsLoading ? (
                  <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
                ) : batchActions.length === 0 ? (
                  <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} description="暂无批次级运营动作" />
                ) : (
                  <Table
                    dataSource={batchActions}
                    rowKey="id"
                    size="small"
                    pagination={{ pageSize: 20 }}
                    columns={[
                      { title: '动作类型', dataIndex: 'actionType', key: 'actionType', width: 130, render: (v: string) => { const m = batchDecisionActionLabels[v] || { label: v, color: 'default' }; return <Tag color={m.color}>{m.label}</Tag>; } },
                      { title: '状态', dataIndex: 'status', key: 'status', width: 100, render: (v: string) => { const m = batchDecisionStatusLabels[v] || { label: v, color: 'default' }; return <Tag color={m.color}>{m.label}</Tag>; } },
                      { title: '结论', dataIndex: 'conclusion', key: 'conclusion', width: 120, render: (v: string | null) => v || '-' },
                      { title: '摘要', dataIndex: 'summary', key: 'summary', ellipsis: true, render: (v: string | null) => v || '-' },
                      { title: '到期时间', dataIndex: 'dueAt', key: 'dueAt', width: 160, render: (v: string | null, record: BatchDecisionAction) => { const overdue = record.status === 'open' && v && new Date(v).getTime() < Date.now(); return <Typography.Text type={overdue ? 'danger' : 'secondary'}>{v ? v.replace('T', ' ').slice(0, 16) : '未设置'}{overdue ? '（已超时）' : ''}</Typography.Text>; } },
                      { title: '创建时间', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: (v: string) => v?.replace('T', ' ').slice(0, 19) ?? '-' },
                      {
                        title: '操作', key: 'ops', width: 140, render: (_: unknown, record: BatchDecisionAction) => (
                          <Space size={4}>
                            {record.status === 'open' && <Button size="small" type="link" onClick={() => completeBatchAction(record.id)}>完成</Button>}
                            {record.status === 'open' && <Button size="small" type="link" danger onClick={() => cancelBatchAction(record.id)}>取消</Button>}
                          </Space>
                        ),
                      },
                    ]}
                  />
                )}
              </Card>
            ),
          },
          {
            key: 'history',
            label: `统一时间线${(decisionHistory.length + batchActions.length) ? `（${decisionHistory.length + batchActions.length}）` : ''}`,
            children: (() => {
              const itemEvents = decisionHistory.map((r) => ({
                id: `item-${r.id}`,
                eventType: 'item' as const,
                time: r.createdAt,
                action: r.action,
                asin: r.asin,
                itemId: r.itemId,
                roundName: r.roundName,
                fromStatus: r.fromStatus,
                toStatus: r.toStatus,
                reason: r.reason,
                comment: r.comment,
              }));
              const batchEvents = batchActions.map((a) => ({
                id: `batch-${a.id}`,
                eventType: 'batch' as const,
                time: a.createdAt,
                actionType: a.actionType,
                conclusion: a.conclusion,
                summary: a.summary,
                status: a.status,
                dueAt: a.dueAt,
                actionId: a.id,
              }));
              const allEvents = [...itemEvents, ...batchEvents].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());
              const filtered = historyActionFilter ? allEvents.filter((e) => e.eventType === 'batch' ? e.actionType === historyActionFilter : e.action === historyActionFilter) : allEvents;
              return (
                <Card>
                  {(historyLoading || batchActionsLoading) ? (
                    <div style={{ textAlign: 'center', padding: 40 }}><Spin /></div>
                  ) : allEvents.length === 0 ? (
                    <Typography.Paragraph type="secondary">暂无操作记录。ASIN 决策和批次级动作将在此统一展示。</Typography.Paragraph>
                  ) : (
                    <>
                      <Space wrap style={{ marginBottom: 12 }}>
                        <Typography.Text type="secondary">来源筛选：</Typography.Text>
                        <Button size="small" type={!historyActionFilter ? 'primary' : 'default'} onClick={() => setHistoryActionFilter(undefined)}>全部（{allEvents.length}）</Button>
                        <Button size="small" type={historyActionFilter === '_item' ? 'primary' : 'default'} onClick={() => setHistoryActionFilter('_item')}>ASIN 决策（{itemEvents.length}）</Button>
                        <Button size="small" type={historyActionFilter === '_batch' ? 'primary' : 'default'} onClick={() => setHistoryActionFilter('_batch')}>批次动作（{batchEvents.length}）</Button>
                      </Space>
                      <Table
                        dataSource={filtered}
                        rowKey="id"
                        size="small"
                        pagination={{ pageSize: 20 }}
                        columns={[
                          { title: '来源', dataIndex: 'eventType', key: 'eventType', width: 90, render: (v: string) => v === 'batch' ? <Tag color="purple">批次</Tag> : <Tag color="blue">ASIN</Tag> },
                          {
                            title: '操作', key: 'actionLabel', width: 140,
                            render: (_: unknown, record: typeof allEvents[number]) => {
                              if (record.eventType === 'batch') {
                                const m = batchDecisionActionLabels[record.actionType] || { label: record.actionType, color: 'default' };
                                return <Tag color={m.color}>{m.label}</Tag>;
                              }
                              const v = record.action;
                              return v === 'next_round' ? <Tag color="success">通过</Tag> : v === 'reject' ? <Tag color="error">淘汰</Tag> : v === 'approve' ? <Tag color="blue">审核通过</Tag> : v === 'request_changes' ? <Tag color="warning">退回修改</Tag> : <Tag>{v}</Tag>;
                            },
                          },
                          {
                            title: '对象', key: 'target', width: 150,
                            render: (_: unknown, record: typeof allEvents[number]) => {
                              if (record.eventType === 'batch') return <Typography.Text type="secondary">{record.conclusion || record.summary || '-'}</Typography.Text>;
                              return record.asin ? <Button type="link" size="small" style={{ padding: 0 }} onClick={() => openReport(record.itemId)}>{record.asin}</Button> : String(record.itemId);
                            },
                          },
                          {
                            title: '状态/变更', key: 'statusChange', width: 200,
                            render: (_: unknown, record: typeof allEvents[number]) => {
                              if (record.eventType === 'batch') {
                                const sm = batchDecisionStatusLabels[record.status] || { label: record.status, color: 'default' };
                                const overdue = record.status === 'open' && record.dueAt && new Date(record.dueAt).getTime() < Date.now();
                                return <Space size={4}><Tag color={sm.color}>{sm.label}</Tag>{overdue && <Tag color="red">超时</Tag>}</Space>;
                              }
                              return <Typography.Text type="secondary">{record.fromStatus ? (workflowStatusLabels[record.fromStatus]?.label || record.fromStatus) : '-'} → {record.toStatus ? (workflowStatusLabels[record.toStatus]?.label || record.toStatus) : '-'}</Typography.Text>;
                            },
                          },
                          {
                            title: '原因/备注', key: 'detail', ellipsis: true,
                            render: (_: unknown, record: typeof allEvents[number]) => {
                              if (record.eventType === 'batch') return record.summary || '-';
                              return record.reason ? (rejectReasonLabelMap[record.reason] || record.reason) : (record.comment || '-');
                            },
                          },
                          {
                            title: '操作', key: 'ops', width: 100,
                            render: (_: unknown, record: typeof allEvents[number]) => {
                              if (record.eventType === 'batch' && record.status === 'open') {
                                return <Space size={4}><Button size="small" type="link" onClick={() => completeBatchAction(record.actionId)}>完成</Button></Space>;
                              }
                              return null;
                            },
                          },
                          { title: '时间', dataIndex: 'time', key: 'time', width: 170, render: (v: string) => v?.replace('T', ' ').slice(0, 19) ?? '-' },
                        ]}
                      />
                    </>
                  )}
                </Card>
              );
            })(),
          },
          {
            key: 'diagnostics',
            label: '诊断与SOP',
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                {/* Health diagnostics */}
                <Card size="small" title={<Space><span>健康诊断</span><Tag color={batchHealthScore >= 80 ? 'success' : batchHealthScore >= 70 ? 'warning' : 'error'}>{batchHealthLabel} {batchHealthScore}/100</Tag></Space>}>
                  <Row gutter={[12, 12]}>
                    {healthDiagnostics.map((item) => (
                      <Col span={12} key={item.key}>
                        <Card size="small" bordered style={{ height: '100%' }}>
                          <Space direction="vertical" size={4} style={{ width: '100%' }}>
                            <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                              <Typography.Text strong>{item.title}</Typography.Text>
                              <Tag color={item.status === 'success' ? 'success' : item.status === 'warning' ? 'warning' : 'error'}>{item.value}</Tag>
                            </Space>
                            <Typography.Text type={item.status === 'error' ? 'danger' : item.status === 'warning' ? 'warning' : 'secondary'}>{item.problem}</Typography.Text>
                            <Typography.Text type="secondary">{item.action}</Typography.Text>
                            {item.filter && <Button size="small" type="link" style={{ padding: 0 }} onClick={() => applyFilters({ ...filters, ...item.filter })}>查看对应 ASIN</Button>}
                          </Space>
                        </Card>
                      </Col>
                    ))}
                  </Row>
                </Card>

                {/* Operation SOP */}
                <Card size="small" title="下一步运营 SOP">
                  {operationSop.length ? (
                    <Space direction="vertical" style={{ width: '100%' }} size={8}>
                      {operationSop.map((item, index) => (
                        <Row key={item.key} gutter={12} align="middle" style={{ padding: '4px 0', borderBottom: '1px solid #f0f0f0' }}>
                          <Col span={2}><Tag color={item.color}>{item.priority}</Tag></Col>
                          <Col span={5}><Typography.Text strong>{index + 1}. {item.title}</Typography.Text></Col>
                          <Col span={10}><Typography.Text type="secondary">{item.reason}</Typography.Text></Col>
                          <Col span={5}><Typography.Text type="secondary">{item.action}</Typography.Text></Col>
                          <Col span={2} style={{ textAlign: 'right' }}><Button size="small" type="primary" ghost onClick={() => applyFilters({ ...filters, ...item.filter })}>{item.button}</Button></Col>
                        </Row>
                      ))}
                    </Space>
                  ) : (
                    <Typography.Text type="secondary">暂无高优先级运营动作。</Typography.Text>
                  )}
                </Card>

                {/* Rejection distribution */}
                <Card size="small" title="淘汰原因分布">
                  {metrics.rejectionReasonDistribution.length ? (() => {
                    const totalRejected = metrics.rejectionReasonDistribution.reduce((sum, item) => sum + item.count, 0);
                    return (
                      <Space direction="vertical" style={{ width: '100%' }}>
                        <Typography.Text type="secondary">淘汰总数：{totalRejected}（占批次 {batch.totalCount ? Math.round((totalRejected / batch.totalCount) * 100) : 0}%）</Typography.Text>
                        {metrics.rejectionReasonDistribution.sort((a, b) => b.count - a.count).map((item) => {
                          const pct = totalRejected ? Math.round((item.count / totalRejected) * 100) : 0;
                          return (
                            <div key={item.reason} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }} onClick={() => applyFilters({ ...filters, workflowStatus: 'rejected_round_1' })}>
                              <Typography.Text style={{ width: 140, flexShrink: 0 }}>{rejectReasonLabelMap[item.reason] || item.reason}</Typography.Text>
                              <Progress percent={pct} size="small" strokeColor="#ff4d4f" style={{ flex: 1 }} format={() => `${item.count}（${pct}%）`} />
                            </div>
                          );
                        })}
                      </Space>
                    );
                  })() : <Typography.Text type="secondary">暂无淘汰原因数据</Typography.Text>}
                </Card>

                {/* Opportunity distribution */}
                <Card size="small" title="机会质量分布">
                  <Row gutter={16}>
                    <Col span={6}><Statistic title="高潜（≥70分）" value={opportunityDistribution.highPotential} valueStyle={{ color: '#3f8600' }} /><Button size="small" type="link" style={{ padding: 0 }} onClick={() => applyOpportunityPreset({ minOpportunityScore: 70 })}>查看</Button></Col>
                    <Col span={6}><Statistic title="可复核（50-69分）" value={opportunityDistribution.reviewable} valueStyle={{ color: '#fa8c16' }} /><Button size="small" type="link" style={{ padding: 0 }} onClick={() => applyOpportunityPreset({ minOpportunityScore: 50, maxOpportunityScore: 69 })}>查看</Button></Col>
                    <Col span={6}><Statistic title="低潜（＜50分）" value={opportunityDistribution.lowPotential} valueStyle={{ color: '#cf1322' }} /><Button size="small" type="link" danger style={{ padding: 0 }} onClick={() => applyOpportunityPreset({ maxOpportunityScore: 49 })}>查看</Button></Col>
                    <Col span={6}><Statistic title="待分析" value={opportunityDistribution.pending} /><Button size="small" type="link" style={{ padding: 0 }} onClick={() => applyOpportunityPreset({ analysisStatus: 'pending' })}>查看</Button></Col>
                  </Row>
                </Card>
              </Space>
            ),
          },
          {
            key: 'info',
            label: '批次信息',
            children: (
              <Space direction="vertical" style={{ width: '100%' }} size={16}>
                <Card size="small" extra={canAction('decision') && <Button size="small" type="link" onClick={() => setMetaEditing(true)}>编辑</Button>}>
                  {metaEditing ? (
                    <Space direction="vertical" style={{ width: '100%' }} size={12}>
                      <Row gutter={16}>
                        <Col span={8}><Typography.Text type="secondary">批次号</Typography.Text><div>{batch.batchNo}</div></Col>
                        <Col span={8}><Typography.Text type="secondary">站点</Typography.Text><div>{batch.marketplace}</div></Col>
                        <Col span={8}><Typography.Text type="secondary">创建时间</Typography.Text><div>{batch.createdAt?.replace('T', ' ').slice(0, 19) ?? '-'}</div></Col>
                      </Row>
                      <Row gutter={16}>
                        <Col span={8}><Typography.Text type="secondary">产品方向</Typography.Text><Input value={metaForm.productDirection} onChange={(e) => setMetaForm((prev) => ({ ...prev, productDirection: e.target.value }))} placeholder="如：家居收纳" /></Col>
                        <Col span={8}><Typography.Text type="secondary">目标类目</Typography.Text><Input value={metaForm.targetCategory} onChange={(e) => setMetaForm((prev) => ({ ...prev, targetCategory: e.target.value }))} placeholder="如：Home & Kitchen" /></Col>
                        <Col span={8}><Typography.Text type="secondary">备注</Typography.Text><Input value={metaForm.remark} onChange={(e) => setMetaForm((prev) => ({ ...prev, remark: e.target.value }))} placeholder="批次备注" /></Col>
                      </Row>
                      <Space><Button size="small" type="primary" loading={metaSaving} onClick={saveMeta}>保存</Button><Button size="small" onClick={() => setMetaEditing(false)}>取消</Button></Space>
                    </Space>
                  ) : (
                    <Descriptions column={3} bordered size="small">
                      <Descriptions.Item label="批次号">{batch.batchNo}</Descriptions.Item>
                      <Descriptions.Item label="站点">{batch.marketplace}</Descriptions.Item>
                      <Descriptions.Item label="创建时间">{batch.createdAt?.replace('T', ' ').slice(0, 19) ?? '-'}</Descriptions.Item>
                      <Descriptions.Item label="产品方向">{batch.productDirection || '-'}</Descriptions.Item>
                      <Descriptions.Item label="目标类目">{batch.targetCategory || '-'}</Descriptions.Item>
                      <Descriptions.Item label="备注">{batch.remark || '-'}</Descriptions.Item>
                    </Descriptions>
                  )}
                </Card>
                <Card size="small" title="复盘摘要" extra={<Button size="small" type="link" icon={<CopyOutlined />} onClick={copyReviewSummary}>复制</Button>}>
                  <Typography.Paragraph type="secondary" style={{ whiteSpace: 'pre-wrap', marginBottom: 0 }}>{reviewSummary}</Typography.Paragraph>
                </Card>
              </Space>
            ),
          },
        ]}
      />

      <AsinReportDrawer
        open={reportOpen}
        loading={reportLoading}
        report={reportData}
        onClose={() => setReportOpen(false)}
      />

      <DesignEvaluationModal
        open={designOpen}
        onCancel={() => setDesignOpen(false)}
        onOk={async (values) => {
          if (activeItemId == null) return;
          try {
            await asinOpportunityApi.saveDesignEvaluation(activeItemId, values);
            message.success('设计评估已提交');
            setDesignOpen(false);
            await load();
          } catch {
            message.error('提交失败');
          }
        }}
      />

      <SampleEvaluationModal
        open={sampleOpen}
        onCancel={() => setSampleOpen(false)}
        onOk={async (values) => {
          if (activeItemId == null) return;
          try {
            await asinOpportunityApi.saveSampleEvaluation(activeItemId, values);
            message.success('成本/打样评估已提交');
            setSampleOpen(false);
            await load();
          } catch {
            message.error('提交失败');
          }
        }}
      />

      <Modal
        open={rejectOpen}
        title="淘汰 ASIN"
        onCancel={() => setRejectOpen(false)}
        onOk={async () => {
          if (activeItemId == null) return;
          if (!rejectReason) {
            message.warning('请选择淘汰原因');
            return;
          }
          await doDecision(activeItemId, 'reject', rejectReason);
          setRejectOpen(false);
        }}
        okText="确认"
        cancelText="取消"
      >
        <Space direction="vertical" style={{ width: '100%' }}>
          <Select
            value={rejectReason || undefined}
            onChange={setRejectReason}
            options={rejectReasonOptions}
            placeholder="请选择结构化淘汰原因"
            style={{ width: '100%' }}
          />
          <Input.TextArea value={rejectComment} onChange={(e) => setRejectComment(e.target.value)} rows={4} placeholder="补充说明，可选" />
        </Space>
      </Modal>
    </div>
  );
};

export default AsinBatchDetailPage;
