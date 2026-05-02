import { AppError } from '../../../common/errors.js';
import type { JsonBody } from '../../../common/types.js';
import { appendAuditLog } from '../../../common/audit.js';
import type { RequestContext } from '../../../common/context.js';
import { analyzeAsinWithSellerSprite, isRealAnalysisAvailable } from '../../../integrations/sellersprite/scoring.js';
import { createProject } from '../../product-dev/service/product-dev.service.js';
import {
  createBatchRaw,
  createReviewRaw,
  createSnapshotRaw,
  createItemRaw,
  countBatchDecisionActionsRaw,
  countBatchesRaw,
  countItemsByBatchIdRaw,
  createBatchDecisionActionRaw,
  getBatchRaw,
  getLatestBatchDecisionActionsRaw,
  getDesignEvaluationRaw,
  getItemRaw,
  listBatchDecisionActionsRaw,
  getSampleEvaluationRaw,
  listBatchesRaw,
  listItemsByBatchIdRaw,
  listRejectionReasonDistributionByBatchIdRaw,
  listReviewsByBatchIdRaw,
  listReviewsByItemIdRaw,
  listSnapshotsByItemIdRaw,
  updateBatchCountersRaw,
  updateBatchDecisionActionStatusRaw,
  updateBatchMetaRaw,
  updateItemRaw,
  upsertDesignEvaluationRaw,
  upsertSampleEvaluationRaw,
  getHealthTrendRaw,
  getHealthAlertConfigs,
  createHealthAlertConfig,
  getBatchAlerts,
  listSavedViewsRaw,
  createSavedViewRaw,
  updateSavedViewRaw,
  deleteSavedViewRaw,
} from '../repository/asin-opportunities.repository.js';

function parseBatchNo() {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const rand = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
  return `ASIN${yyyy}${mm}${dd}${rand}`;
}

function toMysqlDateTime(date = new Date()) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function normalizeMarketplace(value: unknown) {
  return String(value || 'US').toUpperCase();
}

function toStringOrNull(value: unknown) {
  if (value == null || value === '') return null;
  return String(value);
}

function toNumberOrNull(value: unknown) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function getSearchNumber(searchParams: URLSearchParams, ...keys: string[]) {
  for (const key of keys) {
    const value = searchParams.get(key);
    if (value != null && value !== '') return toNumberOrNull(value);
  }
  return null;
}

function parseItemListFilters(searchParams: URLSearchParams) {
  return {
    analysisStatus: searchParams.get('analysis_status') || searchParams.get('analysisStatus'),
    workflowStatus: searchParams.get('workflow_status') || searchParams.get('workflowStatus'),
    recommendation: searchParams.get('recommendation'),
    keyword: searchParams.get('keyword'),
    minOpportunityScore: getSearchNumber(searchParams, 'min_opportunity_score', 'minOpportunityScore'),
    maxOpportunityScore: getSearchNumber(searchParams, 'max_opportunity_score', 'maxOpportunityScore'),
    operationPriority: searchParams.get('operation_priority') || searchParams.get('operationPriority'),
    sortBy: searchParams.get('sort_by') || searchParams.get('sortBy'),
    sortOrder: searchParams.get('sort_order') || searchParams.get('sortOrder'),
  };
}

function parseBatchListFilters(searchParams: URLSearchParams) {
  return {
    status: searchParams.get('status'),
    keyword: searchParams.get('keyword'),
    sortBy: searchParams.get('sort_by') || searchParams.get('sortBy'),
    sortOrder: searchParams.get('sort_order') || searchParams.get('sortOrder'),
    createdFrom: searchParams.get('created_from') || searchParams.get('createdFrom'),
    createdTo: searchParams.get('created_to') || searchParams.get('createdTo'),
    healthLevel: searchParams.get('health_level') || searchParams.get('healthLevel'),
    batchConclusion: searchParams.get('batch_conclusion') || searchParams.get('batchConclusion'),
  };
}

function escapeCsv(value: unknown) {
  if (value == null) return '';
  const text = String(value);
  if (/[",\r\n]/.test(text)) return `"${text.replace(/"/g, '""')}"`;
  return text;
}

function getOperationPriorityLabel(item: { recommendation: string | null; opportunityScore: number | null; riskScore: number | null; workflowStatus: string }) {
  const score = item.opportunityScore ?? 0;
  const risk = item.riskScore ?? 0;
  if (item.recommendation === 'recommend_next_round' && score >= 75 && risk < 60) return 'P0 优先推进';
  if (item.recommendation === 'manual_review' || risk >= 60 || ['review_required', 'design_rework'].includes(item.workflowStatus)) return 'P1 重点复核';
  if (item.recommendation === 'reject' || score < 40 || ['rejected_round_1', 'design_rejected', 'terminated'].includes(item.workflowStatus)) return 'P2 建议淘汰';
  return 'P1 正常跟进';
}

function getBatchAttentionReason(batch: { totalCount: number; analyzedCount: number; recommendedCount: number; rejectedCount: number }) {
  const pendingReview = Math.max(0, batch.analyzedCount - batch.recommendedCount - batch.rejectedCount);
  const unanalyzed = Math.max(0, batch.totalCount - batch.analyzedCount);
  const recommendedRate = batch.totalCount ? Math.round((batch.recommendedCount / batch.totalCount) * 100) : 0;
  const reasons: string[] = [];
  if (pendingReview >= 10) reasons.push(`待复核 ${pendingReview}`);
  if (unanalyzed > 0) reasons.push(`未分析 ${unanalyzed}`);
  if (batch.totalCount > 0 && batch.analyzedCount === batch.totalCount && recommendedRate < 10) reasons.push('推荐率低');
  if (recommendedRate >= 30) reasons.push('高产出');
  return reasons.length ? reasons.join('; ') : '正常';
}

function getBatchHealth(batch: { totalCount: number; analyzedCount: number; recommendedCount: number; rejectedCount: number }) {
  if (!batch.totalCount) return { score: 0, label: '无数据' };
  const analyzedRate = Math.round((batch.analyzedCount / batch.totalCount) * 100);
  const recommendedRate = Math.round((batch.recommendedCount / batch.totalCount) * 100);
  const rejectedRate = Math.round((batch.rejectedCount / batch.totalCount) * 100);
  const pendingReview = Math.max(0, batch.analyzedCount - batch.recommendedCount - batch.rejectedCount);
  let score = 100;
  score -= Math.round((100 - analyzedRate) * 0.4);
  if (batch.analyzedCount === batch.totalCount && recommendedRate < 10) score -= 30;
  if (pendingReview > 0) score -= Math.min(25, Math.round((pendingReview / batch.totalCount) * 100));
  if (rejectedRate >= 50) score -= 15;
  score = Math.max(0, Math.min(100, score));
  if (score >= 80) return { score, label: '健康' };
  if (score >= 60) return { score, label: '关注' };
  return { score, label: '需复盘' };
}

function getBatchConclusionLabel(batch: { totalCount: number; analyzedCount: number; recommendedCount: number; rejectedCount: number }) {
  if (batch.totalCount === 0) return '数据不足';
  const analyzedRate = Math.round((batch.analyzedCount / batch.totalCount) * 100);
  const rejectedRate = Math.round((batch.rejectedCount / batch.totalCount) * 100);
  const pendingReview = Math.max(0, batch.analyzedCount - batch.recommendedCount - batch.rejectedCount);
  const health = getBatchHealth(batch);
  if (analyzedRate < 100) return '先补齐分析';
  if (batch.recommendedCount > 0 && health.score >= 75) return '建议推进';
  if (pendingReview > 0 || health.score < 70 || rejectedRate >= 50) return '建议复盘';
  return '观察沉淀';
}

function getBatchConclusionKey(batch: { totalCount: number; analyzedCount: number; recommendedCount: number; rejectedCount: number }) {
  if (batch.totalCount === 0) return 'insufficient';
  const analyzedRate = Math.round((batch.analyzedCount / batch.totalCount) * 100);
  const rejectedRate = Math.round((batch.rejectedCount / batch.totalCount) * 100);
  const pendingReview = Math.max(0, batch.analyzedCount - batch.recommendedCount - batch.rejectedCount);
  const health = getBatchHealth(batch);
  if (analyzedRate < 100) return 'completeAnalysis';
  if (batch.recommendedCount > 0 && health.score >= 75) return 'push';
  if (pendingReview > 0 || health.score < 70 || rejectedRate >= 50) return 'review';
  return 'observe';
}

function getMeetingType(conclusion: string) {
  if (conclusion === 'push') return '推进会';
  if (conclusion === 'review') return '复盘会';
  if (conclusion === 'completeAnalysis') return '分析补齐会';
  if (conclusion === 'observe') return '观察同步';
  return '数据核查';
}

function getDueAtByAction(actionType: string) {
  const due = new Date();
  if (actionType === 'create_meeting') due.setDate(due.getDate() + 2);
  else if (actionType === 'notify_owner') due.setDate(due.getDate() + 1);
  else due.setDate(due.getDate() + 3);
  return toMysqlDateTime(due);
}

function parseAsinInput(input: unknown) {
  const text = String(input || '');
  const parts = text
    .split(/[\s,;，；]+/)
    .map((v) => v.trim())
    .filter(Boolean);
  const validAsins: string[] = [];
  const invalidItems: string[] = [];
  let duplicateCount = 0;

  for (const part of parts) {
    const matched = part.match(/(?:\/dp\/|\/gp\/product\/)([A-Z0-9]{10})/i) || part.match(/\b([A-Z0-9]{10})\b/i);
    if (!matched) {
      invalidItems.push(part);
      continue;
    }

    const asin = matched[1].toUpperCase();
    if (validAsins.includes(asin)) {
      duplicateCount += 1;
      continue;
    }
    validAsins.push(asin);
  }

  return { validAsins, invalidItems, duplicateCount };
}

function scoreItem(item: { asin: string }) {
  const seed = item.asin.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  const marketScore = 60 + (seed % 21);
  const competitionScore = 40 + (seed % 31);
  const designScore = 50 + (seed % 26);
  const riskScore = 20 + (seed % 41);
  const opportunityScore = Math.max(0, Math.min(100, marketScore * 0.35 + competitionScore * 0.2 + designScore * 0.3 - riskScore * 0.15));
  let recommendation = 'manual_review';
  let recommendationReason = 'mock_scoring';
  if (opportunityScore >= 55 && riskScore < 35) { recommendation = 'recommend_next_round'; recommendationReason = 'mock_recommendation'; }
  else if (opportunityScore < 45 || riskScore >= 80) { recommendation = 'reject'; recommendationReason = 'mock_reject'; }
  return { marketScore, competitionScore, designScore, riskScore, opportunityScore, recommendation, recommendationReason };
}

function makeReportPayload(item: unknown, snapshots: unknown[], reviews: unknown[], designEvaluation: unknown, sampleEvaluation: unknown) {
  return { item, snapshots, reviews, designEvaluation, sampleEvaluation };
}

const transitionRules: Record<string, Record<string, string[]>> = {
  next_round: { review_required: ['design_evaluation'] },
  override_next_round: { rejected_round_1: ['design_evaluation'], terminated: ['design_evaluation'] },
  reject: { review_required: ['rejected_round_1'], design_evaluation: ['rejected_round_1'] },
  terminate: { review_required: ['terminated'], design_evaluation: ['terminated'], cost_evaluation: ['terminated'], sampling: ['terminated'] },
  hold: { pending: ['review_required'], analyzing: ['review_required'], design_evaluation: ['review_required'] },
  submit_design: { design_evaluation: ['design_submitted'], design_rework: ['design_submitted'] },
  approve_design: { design_submitted: ['cost_evaluation'] },
  reject_design: { design_submitted: ['design_rejected'] },
  request_design_changes: { design_submitted: ['design_rework'] },
  approve_sampling: { cost_evaluation: ['sampling'] },
  reject_cost: { cost_evaluation: ['terminated'] },
  hold_cost: { cost_evaluation: ['cost_evaluation'] },
};

function assertTransition(fromStatus: string, action: string, toStatus: string) {
  const allowedTargets = transitionRules[action]?.[fromStatus] || [];
  if (!allowedTargets.includes(toStatus)) {
    throw new AppError(400, 'invalid_workflow_transition', { fromStatus, action, toStatus });
  }
}

function requireReason(action: string, reason: string | null) {
  if (['reject', 'override_next_round', 'terminate', 'reject_design', 'request_design_changes', 'reject_cost', 'hold_cost'].includes(action) && !reason) {
    throw new AppError(400, 'invalid_request', { field: 'reason', reason: 'required' });
  }
}

export async function listBatches(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const pageSize = Math.max(1, Number(searchParams.get('page_size') || searchParams.get('pageSize') || 20));
  const offset = (page - 1) * pageSize;
  const filters = parseBatchListFilters(searchParams);
  const [items, total] = await Promise.all([listBatchesRaw(pageSize, offset, filters), countBatchesRaw(filters)]);
  const latestActions = await getLatestBatchDecisionActionsRaw(items.map((item) => item.id));
  const latestActionMap = new Map(latestActions.map((item) => [item.batchId, item]));
  return { items: items.map((item) => ({ ...item, latestDecisionAction: latestActionMap.get(item.id) || null })), page, pageSize, total };
}

export async function listBatchDecisionActions(searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const pageSize = Math.max(1, Number(searchParams.get('page_size') || searchParams.get('pageSize') || 100));
  const offset = (page - 1) * pageSize;
  const filters = {
    batchId: searchParams.get('batch_id') || searchParams.get('batchId') ? Number(searchParams.get('batch_id') || searchParams.get('batchId')) || null : null,
    actionType: searchParams.get('action_type') || searchParams.get('actionType'),
    status: searchParams.get('status'),
    overdue: (searchParams.get('overdue') || '').toLowerCase() === 'true' ? true : null,
  };
  const [items, total, openTotal, overdueTotal] = await Promise.all([
    listBatchDecisionActionsRaw(pageSize, offset, filters),
    countBatchDecisionActionsRaw(filters),
    countBatchDecisionActionsRaw({ status: 'open' }),
    countBatchDecisionActionsRaw({ overdue: true }),
  ]);
  return { items, page, pageSize, total, summary: { openTotal, overdueTotal } };
}

export async function updateBatchDecisionActionStatusWithAudit(ctx: RequestContext, id: number, body: JsonBody) {
  const nextStatus = String(body.status || '');
  if (!['open', 'done', 'cancelled'].includes(nextStatus)) throw new AppError(400, 'invalid_request', { field: 'status', reason: 'invalid' });
  const updated = await updateBatchDecisionActionStatusRaw(id, nextStatus);
  if (!updated) throw new AppError(404, 'resource_not_found', { field: 'actionId' });
  appendAuditLog(ctx, {
    logType: 'write',
    moduleKey: 'asin-opportunities',
    objectType: 'asin_opportunity_batch_decision_actions',
    objectId: id,
    action: 'update_status',
    beforeSnapshot: null,
    afterSnapshot: updated,
  });
  return updated;
}

export async function updateBatchMetaWithAudit(ctx: RequestContext, id: number, body: JsonBody) {
  const meta: { productDirection?: string; targetCategory?: string; remark?: string } = {};
  if (body.productDirection !== undefined) meta.productDirection = String(body.productDirection);
  if (body.targetCategory !== undefined) meta.targetCategory = String(body.targetCategory);
  if (body.remark !== undefined) meta.remark = String(body.remark);
  if (!Object.keys(meta).length) throw new AppError(400, 'invalid_request', { reason: 'no_fields' });
  const before = await getBatchRaw(id);
  if (!before) throw new AppError(404, 'resource_not_found', { field: 'batchId' });
  const updated = await updateBatchMetaRaw(id, meta);
  appendAuditLog(ctx, {
    logType: 'write',
    moduleKey: 'asin-opportunities',
    objectType: 'asin_analysis_batches',
    objectId: id,
    action: 'update_meta',
    beforeSnapshot: before,
    afterSnapshot: updated,
  });
  return updated;
}

export async function createBatchDecisionActionsWithAudit(ctx: RequestContext, body: JsonBody) {
  const batchIds = Array.isArray(body.batchIds) ? body.batchIds.map((id) => Number(id)).filter((id) => Number.isFinite(id)) : [];
  const actionType = String(body.actionType || '');
  if (!batchIds.length) throw new AppError(400, 'invalid_request', { field: 'batchIds', reason: 'required' });
  if (!['create_meeting', 'mark_decision', 'notify_owner'].includes(actionType)) throw new AppError(400, 'invalid_request', { field: 'actionType', reason: 'invalid' });

  const created = [];
  for (const batchId of batchIds) {
    const batch = await getBatchRaw(batchId);
    if (!batch) continue;
    const conclusion = toStringOrNull(body.conclusion) || getBatchConclusionKey(batch);
    const meetingType = actionType === 'create_meeting' ? (toStringOrNull(body.meetingType) || getMeetingType(conclusion)) : null;
    const notifiedAt = actionType === 'notify_owner' ? toMysqlDateTime() : null;
    const summary = toStringOrNull(body.summary) || `${getBatchConclusionLabel(batch)}：${batch.name}`;
    const action = await createBatchDecisionActionRaw({
      batchId,
      actionType,
      conclusion,
      meetingType,
      status: actionType === 'notify_owner' ? 'notified' : 'open',
      ownerUserId: toNumberOrNull(body.ownerUserId),
      dueAt: getDueAtByAction(actionType),
      notifiedAt,
      notificationChannel: actionType === 'notify_owner' ? (toStringOrNull(body.notificationChannel) || 'internal') : null,
      summary,
      createdBy: ctx.operator?.id ?? null,
    });
    if (action) created.push(action);
  }

  appendAuditLog(ctx, {
    logType: 'write',
    moduleKey: 'asin-opportunities',
    objectType: 'asin_opportunity_batch_decision_actions',
    objectId: created[0]?.id ?? null,
    action: actionType,
    beforeSnapshot: null,
    afterSnapshot: { batchIds, createdCount: created.length },
  });
  return { items: created, total: created.length };
}

export async function exportBatchesCsv(searchParams: URLSearchParams) {
  const filters = parseBatchListFilters(searchParams);
  const total = await countBatchesRaw(filters);
  const batches = await listBatchesRaw(Math.min(total, 10000), 0, filters);
  const headers = ['批次号', '名称', '站点', '状态', '批次结论', '产品方向', '目标类目', 'ASIN总数', '已分析', '推荐', '淘汰', '待复核', '未分析', '分析率', '推荐率', '健康分', '健康等级', '关注原因', '创建时间', '备注'];
  const rows = batches.map((batch) => {
    const pendingReview = Math.max(0, batch.analyzedCount - batch.recommendedCount - batch.rejectedCount);
    const unanalyzed = Math.max(0, batch.totalCount - batch.analyzedCount);
    const analyzedRate = batch.totalCount ? `${Math.round((batch.analyzedCount / batch.totalCount) * 100)}%` : '0%';
    const recommendedRate = batch.totalCount ? `${Math.round((batch.recommendedCount / batch.totalCount) * 100)}%` : '0%';
    const health = getBatchHealth(batch);
    return [
      batch.batchNo,
      batch.name,
      batch.marketplace,
      batch.status,
      getBatchConclusionLabel(batch),
      batch.productDirection,
      batch.targetCategory,
      batch.totalCount,
      batch.analyzedCount,
      batch.recommendedCount,
      batch.rejectedCount,
      pendingReview,
      unanalyzed,
      analyzedRate,
      recommendedRate,
      health.score,
      health.label,
      getBatchAttentionReason(batch),
      batch.createdAt,
      batch.remark,
    ];
  });
  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n');
  return `\uFEFF${csv}`;
}

export async function getBatchById(id: number) {
  const batch = await getBatchRaw(id);
  if (!batch) throw new AppError(404, 'resource_not_found', { field: 'batchId' });
  const totalItems = await countItemsByBatchIdRaw(id);
  return { ...batch, totalItems };
}

export async function getBatchMetrics(batchId: number) {
  const batch = await getBatchRaw(batchId);
  if (!batch) throw new AppError(404, 'resource_not_found', { field: 'batchId' });
  const rejectionReasonDistribution = await listRejectionReasonDistributionByBatchIdRaw(batchId);
  return { rejectionReasonDistribution };
}

export async function getBatchDecisionHistory(batchId: number, searchParams: URLSearchParams) {
  const batch = await getBatchRaw(batchId);
  if (!batch) throw new AppError(404, 'resource_not_found', { field: 'batchId' });
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const pageSize = Math.max(1, Number(searchParams.get('page_size') || searchParams.get('pageSize') || 50));
  const offset = (page - 1) * pageSize;
  const reviews = await listReviewsByBatchIdRaw(batchId, pageSize, offset);
  return { items: reviews, page, pageSize };
}

export async function createBatch(body: JsonBody, createdBy: number | null) {
  const name = String(body.name || '').trim();
  const marketplace = normalizeMarketplace(body.marketplace);
  const asinInput = body.asin_input ?? body.asinInput ?? '';
  const productDirection = body.product_direction ?? body.productDirection ?? null;
  const targetCategory = body.target_category ?? body.targetCategory ?? null;
  const remark = body.remark == null ? null : String(body.remark);
  if (!name) throw new AppError(400, 'invalid_request', { field: 'name', reason: 'required' });
  const { validAsins, invalidItems, duplicateCount } = parseAsinInput(asinInput);
  if (!validAsins.length) throw new AppError(400, 'invalid_request', { field: 'asin_input', reason: 'no_valid_asin_found' });

  const batch = await createBatchRaw({
    batchNo: parseBatchNo(),
    name,
    marketplace,
    productDirection: productDirection ? String(productDirection) : null,
    targetCategory: targetCategory ? String(targetCategory) : null,
    status: 'submitted',
    totalCount: validAsins.length,
    analyzedCount: 0,
    recommendedCount: 0,
    rejectedCount: 0,
    createdBy,
    remark,
  });
  if (!batch) throw new AppError(500, 'internal_error', { field: 'batch' });

  for (const asin of validAsins) {
    await createItemRaw({ batchId: batch.id, asin, marketplace, analysisStatus: 'pending', workflowStatus: 'pending' });
  }
  return { ...batch, invalidItems, duplicateCount, validAsins };
}

export async function createBatchWithAudit(ctx: RequestContext, body: JsonBody) {
  const created = await createBatch(body, ctx.operator?.id ?? null);
  appendAuditLog(ctx, {
    logType: 'write',
    moduleKey: 'asin-opportunities',
    objectType: 'asin_opportunity_batch',
    objectId: created.id,
    action: 'create_batch',
    afterSnapshot: {
      id: created.id,
      batchNo: created.batchNo,
      marketplace: created.marketplace,
      totalCount: created.totalCount,
      invalidItems: created.invalidItems,
      duplicateCount: created.duplicateCount,
    },
  });
  return created;
}

export async function listBatchItems(batchId: number, searchParams: URLSearchParams) {
  const page = Math.max(1, Number(searchParams.get('page') || 1));
  const pageSize = Math.max(1, Number(searchParams.get('page_size') || searchParams.get('pageSize') || 20));
  const offset = (page - 1) * pageSize;
  const filters = parseItemListFilters(searchParams);
  const [items, total] = await Promise.all([listItemsByBatchIdRaw(batchId, pageSize, offset, filters), countItemsByBatchIdRaw(batchId, filters)]);
  return { items, page, pageSize, total };
}

export async function exportBatchItemsCsv(batchId: number, searchParams: URLSearchParams) {
  const batch = await getBatchRaw(batchId);
  if (!batch) throw new AppError(404, 'resource_not_found', { field: 'batchId' });
  const filters = parseItemListFilters(searchParams);
  const total = await countItemsByBatchIdRaw(batchId, filters);
  const items = await listItemsByBatchIdRaw(batchId, Math.min(total, 10000), 0, filters);
  const headers = ['ASIN', '标题', '品牌', '类目', '站点', '分析状态', '流程状态', '运营优先级', '机会分', '市场分', '竞争分', '设计分', '风险分', '推荐结论', '推荐原因', '价格', '评分', 'Review数', '月销量', '月销售额', 'BSR', '分析时间'];
  const rows = items.map((item) => [
    item.asin,
    item.productTitle,
    item.brand,
    item.category,
    item.marketplace,
    item.analysisStatus,
    item.workflowStatus,
    getOperationPriorityLabel(item),
    item.opportunityScore,
    item.marketScore,
    item.competitionScore,
    item.designScore,
    item.riskScore,
    item.recommendation,
    item.recommendationReason,
    item.price,
    item.rating,
    item.reviewCount,
    item.monthlySales,
    item.monthlyRevenue,
    item.bsr,
    item.analyzedAt,
  ]);
  const csv = [headers, ...rows].map((row) => row.map(escapeCsv).join(',')).join('\r\n');
  return `\uFEFF${csv}`;
}

export async function getItemReport(itemId: number) {
  const item = await getItemRaw(itemId);
  if (!item) throw new AppError(404, 'resource_not_found', { field: 'itemId' });
  const [snapshots, reviews, designEvaluation, sampleEvaluation] = await Promise.all([
    listSnapshotsByItemIdRaw(itemId),
    listReviewsByItemIdRaw(itemId),
    getDesignEvaluationRaw(itemId),
    getSampleEvaluationRaw(itemId),
  ]);
  return makeReportPayload(item, snapshots, reviews, designEvaluation, sampleEvaluation);
}

export async function retryItemAnalysis(itemId: number) {
  const item = await getItemRaw(itemId);
  if (!item) throw new AppError(404, 'resource_not_found', { field: 'itemId' });

  let scored: { marketScore: number; competitionScore: number; designScore: number; riskScore: number; opportunityScore: number; recommendation: string; recommendationReason: string };
  let snapshotSource = 'mcp-mock';
  let productTitle: string | null = item.productTitle;
  let brand: string | null = item.brand;
  let imageUrl: string | null = item.imageUrl;
  let price: number | null = item.price;
  let rating: number | null = item.rating;
  let reviewCount: number | null = item.reviewCount;
  let bsr: number | null = item.bsr;
  let category: string | null = item.category;
  let monthlySales: number | null = item.monthlySales;
  let monthlyRevenue: number | null = item.monthlyRevenue;
  let lastError: string | null = null;

  if (isRealAnalysisAvailable()) {
    try {
      const result = await analyzeAsinWithSellerSprite(item.asin, item.marketplace || 'US');
      scored = {
        marketScore: result.marketScore,
        competitionScore: result.competitionScore,
        designScore: result.designScore,
        riskScore: result.riskScore,
        opportunityScore: result.opportunityScore,
        recommendation: result.recommendation,
        recommendationReason: result.recommendationReason,
      };
      snapshotSource = 'sellersprite';
      productTitle = result.productTitle ?? productTitle;
      brand = result.brand ?? brand;
      imageUrl = result.imageUrl ?? imageUrl;
      price = result.price ?? price;
      rating = result.rating ?? rating;
      reviewCount = result.reviewCount ?? reviewCount;
      bsr = result.bsr ?? bsr;
      category = result.category ?? category;
      monthlySales = result.monthlySales ?? monthlySales;
      monthlyRevenue = result.monthlyRevenue ?? monthlyRevenue;
    } catch (err) {
      lastError = `sellersprite_error: ${(err as Error).message}`;
      scored = scoreItem(item as { asin: string });
    }
  } else {
    scored = scoreItem(item as { asin: string });
  }

  const updated = await updateItemRaw(itemId, {
    analysisStatus: 'completed',
    workflowStatus: scored.recommendation === 'recommend_next_round' ? 'design_evaluation' : scored.recommendation === 'reject' ? 'rejected_round_1' : 'review_required',
    productTitle,
    brand,
    imageUrl,
    price,
    rating,
    reviewCount,
    bsr,
    category,
    monthlySales,
    monthlyRevenue,
    marketScore: scored.marketScore,
    competitionScore: scored.competitionScore,
    designScore: scored.designScore,
    riskScore: scored.riskScore,
    opportunityScore: scored.opportunityScore,
    recommendation: scored.recommendation,
    recommendationReason: scored.recommendationReason,
    analyzedAt: toMysqlDateTime(),
    lastError,
  });
  await createSnapshotRaw({ itemId, source: snapshotSource, payloadJson: scored });
  await createReviewRaw({
    itemId,
    reviewerId: null,
    roundName: 'analysis',
    action: 'analyzed',
    fromStatus: item.workflowStatus,
    toStatus: updated?.workflowStatus || item.workflowStatus,
    reason: null,
    comment: 'analysis completed',
  });
  const batchId = updated?.batchId;
  if (batchId) {
    const batch = await getBatchRaw(batchId);
    if (batch) {
      const items = await listItemsByBatchIdRaw(batch.id, 1000, 0);
      const analyzedCount = items.filter((x) => x.analysisStatus === 'completed').length;
      const recommendedCount = items.filter((x) => x.recommendation === 'recommend_next_round').length;
      const rejectedCount = items.filter((x) => x.recommendation === 'reject').length;
      await updateBatchCountersRaw(batch.id, {
        status: analyzedCount === items.length ? 'completed' : 'partially_failed',
        analyzedCount,
        recommendedCount,
        rejectedCount,
      });
    }
  }
  return updated;
}

export async function retryItemAnalysisWithAudit(ctx: RequestContext, itemId: number) {
  const before = await getItemRaw(itemId);
  const updated = await retryItemAnalysis(itemId);
  appendAuditLog(ctx, {
    logType: 'write',
    moduleKey: 'asin-opportunities',
    objectType: 'asin_opportunity_item',
    objectId: itemId,
    action: 'retry_analysis',
    beforeSnapshot: before,
    afterSnapshot: updated,
  });
  return updated;
}

export async function createProjectFromAsinItemWithAudit(ctx: RequestContext, itemId: number) {
  const item = await getItemRaw(itemId);
  if (!item) throw new AppError(404, 'resource_not_found', { field: 'itemId' });

  const project = await createProject({
    productName: item.productTitle || `Amazon ASIN ${item.asin}`,
    sku: `ASIN-${item.asin}`,
    targetPlatform: `Amazon ${item.marketplace || 'US'}`,
    targetMarket: item.category || item.marketplace || 'US',
    targetPrice: item.price,
    grossMarginTarget: 30,
    projectStatus: '待调研',
  });

  await createReviewRaw({
    itemId,
    reviewerId: null,
    roundName: 'project',
    action: 'create_project',
    fromStatus: item.workflowStatus,
    toStatus: item.workflowStatus,
    reason: null,
    comment: project ? `created product project ${project.projectCode}` : 'created product project',
  });

  appendAuditLog(ctx, {
    logType: 'write',
    moduleKey: 'asin-opportunities',
    objectType: 'asin_opportunity_item',
    objectId: itemId,
    action: 'create_project_from_asin',
    beforeSnapshot: item,
    afterSnapshot: project,
  });

  return { itemId, project };
}

export async function retryBatchFailedItems(batchId: number) {
  const items = await listItemsByBatchIdRaw(batchId, 1000, 0);
  const retried: number[] = [];
  for (const item of items) {
    if (item.analysisStatus !== 'completed') {
      await retryItemAnalysis(item.id);
      retried.push(item.id);
    }
  }
  return { batchId, retried };
}

export async function retryBatchFailedItemsWithAudit(ctx: RequestContext, batchId: number) {
  const batch = await getBatchRaw(batchId);
  const result = await retryBatchFailedItems(batchId);
  appendAuditLog(ctx, {
    logType: 'write',
    moduleKey: 'asin-opportunities',
    objectType: 'asin_opportunity_batch',
    objectId: batchId,
    action: 'retry_failed_items',
    beforeSnapshot: batch,
    afterSnapshot: result,
  });
  return result;
}

export async function makeDecision(itemId: number, body: JsonBody, reviewerId: number | null) {
  const item = await getItemRaw(itemId);
  if (!item) throw new AppError(404, 'resource_not_found', { field: 'itemId' });
  const action = String(body.action || '');
  const reason = body.reason == null ? null : String(body.reason);
  const comment = body.comment == null ? null : String(body.comment);
  const fromStatus = item.workflowStatus;
  let toStatus = fromStatus;
  if (action === 'next_round' || action === 'override_next_round') toStatus = 'design_evaluation';
  else if (action === 'reject') toStatus = 'rejected_round_1';
  else if (action === 'terminate') toStatus = 'terminated';
  else if (action === 'hold') toStatus = 'review_required';
  requireReason(action, reason);
  assertTransition(fromStatus, action, toStatus);
  const updated = await updateItemRaw(itemId, { workflowStatus: toStatus, recommendationReason: reason ?? item.recommendationReason });
  await createReviewRaw({ itemId, reviewerId, roundName: 'round_1', action, fromStatus, toStatus, reason, comment });
  return { item: updated };
}

export async function makeDecisionWithAudit(ctx: RequestContext, itemId: number, body: JsonBody) {
  const before = await getItemRaw(itemId);
  const result = await makeDecision(itemId, body, ctx.operator?.id ?? null);
  appendAuditLog(ctx, {
    logType: 'write',
    moduleKey: 'asin-opportunities',
    objectType: 'asin_opportunity_item',
    objectId: itemId,
    action: 'make_decision',
    beforeSnapshot: before,
    afterSnapshot: result,
  });
  return result;
}

export async function saveDesignEvaluation(itemId: number, body: JsonBody, designerId: number | null) {
  const item = await getItemRaw(itemId);
  if (!item) throw new AppError(404, 'resource_not_found', { field: 'itemId' });
  assertTransition(item.workflowStatus, 'submit_design', 'design_submitted');
  const evaluation = await upsertDesignEvaluationRaw({
    itemId,
    designerId,
    targetUser: toStringOrNull(body.target_user ?? body.targetUser),
    usageScenario: toStringOrNull(body.usage_scenario ?? body.usageScenario),
    painPoints: toStringOrNull(body.pain_points ?? body.painPoints),
    designDirection: toStringOrNull(body.design_direction ?? body.designDirection),
    materialSuggestion: toStringOrNull(body.material_suggestion ?? body.materialSuggestion),
    structureSuggestion: toStringOrNull(body.structure_suggestion ?? body.structureSuggestion),
    packageSuggestion: toStringOrNull(body.package_suggestion ?? body.packageSuggestion),
    sellingPoints: toStringOrNull(body.selling_points ?? body.sellingPoints),
    attachmentsJson: body.attachments ?? body.attachmentsJson ?? [],
    status: 'submitted',
    reviewComment: null,
  });
  await updateItemRaw(itemId, { workflowStatus: 'design_submitted' });
  await createReviewRaw({ itemId, reviewerId: designerId, roundName: 'design', action: 'submit', fromStatus: item.workflowStatus, toStatus: 'design_submitted', reason: null, comment: 'design evaluation submitted' });
  return { evaluation };
}

export async function saveDesignEvaluationWithAudit(ctx: RequestContext, itemId: number, body: JsonBody) {
  const before = await getItemRaw(itemId);
  const result = await saveDesignEvaluation(itemId, body, ctx.operator?.id ?? null);
  appendAuditLog(ctx, {
    logType: 'write',
    moduleKey: 'asin-opportunities',
    objectType: 'asin_opportunity_item',
    objectId: itemId,
    action: 'submit_design_evaluation',
    beforeSnapshot: before,
    afterSnapshot: result,
  });
  return result;
}

export async function reviewDesignEvaluation(itemId: number, body: JsonBody, reviewerId: number | null) {
  const item = await getItemRaw(itemId);
  if (!item) throw new AppError(404, 'resource_not_found', { field: 'itemId' });
  const decision = String(body.decision || '');
  const comment = body.comment == null ? null : String(body.comment);
  const action = decision === 'approve' ? 'approve_design' : decision === 'request_changes' ? 'request_design_changes' : 'reject_design';
  const toStatus = decision === 'approve' ? 'cost_evaluation' : decision === 'request_changes' ? 'design_rework' : 'design_rejected';
  requireReason(action, comment);
  assertTransition(item.workflowStatus, action, toStatus);
  const evaluation = await upsertDesignEvaluationRaw({
    itemId,
    designerId: reviewerId,
    targetUser: null,
    usageScenario: null,
    painPoints: null,
    designDirection: null,
    materialSuggestion: null,
    structureSuggestion: null,
    packageSuggestion: null,
    sellingPoints: null,
    attachmentsJson: [],
    status: decision === 'approve' ? 'approved' : decision === 'request_changes' ? 'rework' : 'rejected',
    reviewComment: comment,
  });
  await updateItemRaw(itemId, { workflowStatus: toStatus });
  await createReviewRaw({ itemId, reviewerId, roundName: 'design_review', action, fromStatus: item.workflowStatus, toStatus, reason: comment, comment });
  return { evaluation };
}

export async function reviewDesignEvaluationWithAudit(ctx: RequestContext, itemId: number, body: JsonBody) {
  const before = await getItemRaw(itemId);
  const result = await reviewDesignEvaluation(itemId, body, ctx.operator?.id ?? null);
  appendAuditLog(ctx, {
    logType: 'write',
    moduleKey: 'asin-opportunities',
    objectType: 'asin_opportunity_item',
    objectId: itemId,
    action: 'review_design_evaluation',
    beforeSnapshot: before,
    afterSnapshot: result,
  });
  return result;
}

export async function saveSampleEvaluation(itemId: number, body: JsonBody, evaluatorId: number | null) {
  const item = await getItemRaw(itemId);
  if (!item) throw new AppError(404, 'resource_not_found', { field: 'itemId' });
  const evaluation = await upsertSampleEvaluationRaw({
    itemId,
    evaluatorId,
    targetPrice: toNumberOrNull(body.target_price ?? body.targetPrice),
    estimatedCost: toNumberOrNull(body.estimated_cost ?? body.estimatedCost),
    grossMargin: toNumberOrNull(body.gross_margin ?? body.grossMargin),
    moq: toNumberOrNull(body.moq),
    supplier: toStringOrNull(body.supplier),
    sampleCost: toNumberOrNull(body.sample_cost ?? body.sampleCost),
    sampleCycleDays: toNumberOrNull(body.sample_cycle_days ?? body.sampleCycleDays),
    decision: toStringOrNull(body.decision),
    comment: body.comment == null ? null : String(body.comment),
  });
  const decision = String(body.decision || '');
  const action = decision === 'approve_sampling' ? 'approve_sampling' : decision === 'reject' ? 'reject_cost' : 'hold_cost';
  const toStatus = decision === 'approve_sampling' ? 'sampling' : decision === 'reject' ? 'terminated' : 'cost_evaluation';
  const comment = body.comment == null ? null : String(body.comment);
  requireReason(action, comment);
  assertTransition(item.workflowStatus, action, toStatus);
  await updateItemRaw(itemId, { workflowStatus: toStatus });
  await createReviewRaw({ itemId, reviewerId: evaluatorId, roundName: 'sample', action, fromStatus: item.workflowStatus, toStatus, reason: comment, comment });
  return { evaluation };
}

export async function saveSampleEvaluationWithAudit(ctx: RequestContext, itemId: number, body: JsonBody) {
  const before = await getItemRaw(itemId);
  const result = await saveSampleEvaluation(itemId, body, ctx.operator?.id ?? null);
  appendAuditLog(ctx, {
    logType: 'write',
    moduleKey: 'asin-opportunities',
    objectType: 'asin_opportunity_item',
    objectId: itemId,
    action: 'submit_sample_evaluation',
    beforeSnapshot: before,
    afterSnapshot: result,
  });
  return result;
}

export async function getHealthTrend(ctx: RequestContext, searchParams: URLSearchParams) {
  const dateFrom = searchParams.get('date_from') || searchParams.get('dateFrom');
  const dateTo = searchParams.get('date_to') || searchParams.get('dateTo');
  const groupBy = (searchParams.get('group_by') || searchParams.get('groupBy') || 'day') as 'day' | 'week' | 'month';

  return await getHealthTrendRaw({ dateFrom, dateTo, groupBy });
}

export async function listHealthAlertConfigs(ctx: RequestContext, searchParams: URLSearchParams) {
  const isActive = searchParams.get('is_active') === 'true' ? true : searchParams.get('is_active') === 'false' ? false : undefined;
  return await getHealthAlertConfigs({ isActive });
}

export async function addHealthAlertConfig(ctx: RequestContext, body: JsonBody) {
  const config = {
    name: body.name as string,
    minHealthScore: Number(body.minHealthScore),
    minAnalysisRate: Number(body.minAnalysisRate),
    minRecommendationRate: Number(body.minRecommendationRate),
    maxRejectionRate: Number(body.maxRejectionRate),
    createdBy: ctx.operator?.id ?? null,
  };
  
  return await createHealthAlertConfig(config);
}

export async function listBatchAlerts(ctx: RequestContext, searchParams: URLSearchParams) {
  const configId = searchParams.get('configId');
  let config;
  if (configId) {
    const configs = await getHealthAlertConfigs({ isActive: true });
    config = configs.find((c: any) => c.id === Number(configId));
  }
  
  return await getBatchAlerts(config);
}

// =========================
// Saved Views
// =========================

export async function listSavedViews(ctx: RequestContext, searchParams: URLSearchParams) {
  const moduleKey = searchParams.get('module_key') || searchParams.get('moduleKey') || 'asin-opportunities';
  const userId = ctx.operator?.id;
  if (!userId) throw new AppError(401, 'unauthorized', { reason: 'no_operator' });
  return await listSavedViewsRaw(userId, moduleKey);
}

export async function createSavedView(ctx: RequestContext, body: JsonBody) {
  const userId = ctx.operator?.id;
  if (!userId) throw new AppError(401, 'unauthorized', { reason: 'no_operator' });
  const moduleKey = String(body.moduleKey || 'asin-opportunities');
  const viewName = String(body.viewName || '');
  const viewConfigJson = typeof body.viewConfigJson === 'string' ? body.viewConfigJson : JSON.stringify(body.viewConfigJson || {});
  const isDefault = Boolean(body.isDefault);
  if (!viewName) throw new AppError(400, 'invalid_request', { field: 'viewName', reason: 'required' });
  return await createSavedViewRaw(userId, moduleKey, viewName, viewConfigJson, isDefault);
}

export async function updateSavedView(ctx: RequestContext, id: number, body: JsonBody) {
  const viewName = body.viewName !== undefined ? String(body.viewName) : undefined;
  const viewConfigJson = body.viewConfigJson !== undefined ? (typeof body.viewConfigJson === 'string' ? body.viewConfigJson : JSON.stringify(body.viewConfigJson)) : undefined;
  const isDefault = body.isDefault !== undefined ? Boolean(body.isDefault) : undefined;
  const updated = await updateSavedViewRaw(id, viewName, viewConfigJson, isDefault);
  if (!updated) throw new AppError(404, 'resource_not_found', { field: 'savedViewId' });
  return updated;
}

export async function deleteSavedView(ctx: RequestContext, id: number) {
  await deleteSavedViewRaw(id);
  return { deleted: true };
}
