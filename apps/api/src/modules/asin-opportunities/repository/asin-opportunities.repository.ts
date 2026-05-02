import { query } from '../../../database/index.js';

export interface AsinAnalysisBatchRow {
  id: number;
  batchNo: string;
  name: string;
  marketplace: string;
  productDirection: string | null;
  targetCategory: string | null;
  status: string;
  totalCount: number;
  analyzedCount: number;
  recommendedCount: number;
  rejectedCount: number;
  createdBy: number | null;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AsinAnalysisItemRow {
  id: number;
  batchId: number;
  asin: string;
  marketplace: string;
  productTitle: string | null;
  brand: string | null;
  imageUrl: string | null;
  productUrl: string | null;
  category: string | null;
  price: number | null;
  rating: number | null;
  reviewCount: number | null;
  monthlySales: number | null;
  monthlyRevenue: number | null;
  bsr: number | null;
  analysisStatus: string;
  workflowStatus: string;
  marketScore: number | null;
  competitionScore: number | null;
  designScore: number | null;
  riskScore: number | null;
  opportunityScore: number | null;
  recommendation: string | null;
  recommendationReason: string | null;
  lastError: string | null;
  analyzedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AsinAnalysisSnapshotRow {
  id: number;
  itemId: number;
  source: string;
  payloadJson: unknown;
  createdAt: string;
}

export interface AsinAnalysisReviewRow {
  id: number;
  itemId: number;
  reviewerId: number | null;
  roundName: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  reason: string | null;
  comment: string | null;
  createdAt: string;
}

export interface RejectionReasonDistributionRow {
  reason: string;
  count: number;
}

export interface BatchDecisionActionRow {
  id: number;
  batchId: number;
  batchNo?: string;
  batchName?: string;
  actionType: string;
  conclusion: string | null;
  meetingType: string | null;
  status: string;
  ownerUserId: number | null;
  dueAt: string | null;
  notifiedAt: string | null;
  notificationChannel: string | null;
  summary: string | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface ProductDesignEvaluationRow {
  id: number;
  itemId: number;
  designerId: number | null;
  targetUser: string | null;
  usageScenario: string | null;
  painPoints: string | null;
  designDirection: string | null;
  materialSuggestion: string | null;
  structureSuggestion: string | null;
  packageSuggestion: string | null;
  sellingPoints: string | null;
  attachmentsJson: unknown;
  status: string;
  reviewComment: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface SampleEvaluationRow {
  id: number;
  itemId: number;
  evaluatorId: number | null;
  targetPrice: number | null;
  estimatedCost: number | null;
  grossMargin: number | null;
  moq: number | null;
  supplier: string | null;
  sampleCost: number | null;
  sampleCycleDays: number | null;
  decision: string | null;
  comment: string | null;
  createdAt: string;
  updatedAt: string;
}

function rowId<T extends { id: number }>(rows: T[]) {
  return rows[0] || null;
}

export interface BatchListFilters {
  status?: string | null;
  keyword?: string | null;
  sortBy?: string | null;
  sortOrder?: string | null;
  createdFrom?: string | null;
  createdTo?: string | null;
  healthLevel?: string | null;
  batchConclusion?: string | null;
}

export interface BatchDecisionActionFilters {
  batchId?: number | null;
  actionType?: string | null;
  status?: string | null;
  overdue?: boolean | null;
}

export interface HealthTrendFilters {
  dateFrom?: string | null;
  dateTo?: string | null;
  groupBy?: 'day' | 'week' | 'month';
}

export interface HealthTrendRow {
  date: string;
  totalBatches: number;
  healthyBatches: number;
  reviewBatches: number;
  avgHealthScore: number;
}

export interface HealthAlertConfig {
  id: number;
  name: string;
  minHealthScore: number;
  minAnalysisRate: number;
  minRecommendationRate: number;
  maxRejectionRate: number;
  isActive: boolean;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface HealthAlertFilters {
  isActive?: boolean;
}

export interface BatchAlertRow {
  batchId: number;
  batchNo: string;
  batchName: string;
  healthScore: number;
  analysisRate: number;
  recommendationRate: number;
  rejectionRate: number;
  alertReasons: string[];
  alertLevel: 'low' | 'medium' | 'high';
}

export interface ItemListFilters {
  analysisStatus?: string | null;
  workflowStatus?: string | null;
  recommendation?: string | null;
  keyword?: string | null;
  minOpportunityScore?: number | null;
  maxOpportunityScore?: number | null;
  operationPriority?: string | null;
  sortBy?: string | null;
  sortOrder?: string | null;
}

function buildBatchListWhere(filters: BatchListFilters = {}) {
  const clauses: string[] = [];
  const values: unknown[] = [];
  const healthScoreExpression = `GREATEST(0, LEAST(100,
      100
      - ROUND((100 - ROUND((analyzed_count / GREATEST(total_count, 1)) * 100)) * 0.4)
      - CASE WHEN analyzed_count = total_count AND ROUND((recommended_count / GREATEST(total_count, 1)) * 100) < 10 THEN 30 ELSE 0 END
      - CASE WHEN GREATEST(0, analyzed_count - recommended_count - rejected_count) > 0 THEN LEAST(25, ROUND((GREATEST(0, analyzed_count - recommended_count - rejected_count) / GREATEST(total_count, 1)) * 100)) ELSE 0 END
      - CASE WHEN ROUND((rejected_count / GREATEST(total_count, 1)) * 100) >= 50 THEN 15 ELSE 0 END
    ))`;
  if (filters.status) {
    clauses.push('status = ?');
    values.push(filters.status);
  }
  if (filters.keyword) {
    clauses.push('(batch_no LIKE ? OR name LIKE ? OR product_direction LIKE ? OR target_category LIKE ?)');
    const keyword = `%${filters.keyword}%`;
    values.push(keyword, keyword, keyword, keyword);
  }
  if (filters.createdFrom) {
    clauses.push('created_at >= ?');
    values.push(`${filters.createdFrom} 00:00:00`);
  }
  if (filters.createdTo) {
    clauses.push('created_at <= ?');
    values.push(`${filters.createdTo} 23:59:59`);
  }
  if (filters.healthLevel === 'healthy') {
    clauses.push(`${healthScoreExpression} >= 80`);
  } else if (filters.healthLevel === 'review') {
    clauses.push(`${healthScoreExpression} < 80`);
  }
  if (filters.batchConclusion === 'completeAnalysis') {
    clauses.push('total_count > 0 AND analyzed_count < total_count');
  } else if (filters.batchConclusion === 'push') {
    clauses.push(`total_count > 0 AND analyzed_count = total_count AND recommended_count > 0 AND ${healthScoreExpression} >= 75`);
  } else if (filters.batchConclusion === 'review') {
    clauses.push(`total_count > 0 AND analyzed_count = total_count AND (${healthScoreExpression} < 70 OR ROUND((rejected_count / GREATEST(total_count, 1)) * 100) >= 50 OR GREATEST(0, analyzed_count - recommended_count - rejected_count) > 0)`);
  } else if (filters.batchConclusion === 'observe') {
    clauses.push(`total_count > 0 AND analyzed_count = total_count AND recommended_count = 0 AND GREATEST(0, analyzed_count - recommended_count - rejected_count) = 0 AND ROUND((rejected_count / GREATEST(total_count, 1)) * 100) < 50 AND ${healthScoreExpression} >= 70`);
  } else if (filters.batchConclusion === 'insufficient') {
    clauses.push('total_count = 0');
  }
  return {
    whereSql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    values,
  };
}

const batchSortColumnMap: Record<string, string> = {
  totalCount: 'total_count',
  analyzedCount: 'analyzed_count',
  recommendedCount: 'recommended_count',
  rejectedCount: 'rejected_count',
  analyzedRate: '(analyzed_count / GREATEST(total_count, 1))',
  recommendedRate: '(recommended_count / GREATEST(total_count, 1))',
  healthScore: `GREATEST(0, LEAST(100,
    100
    - ROUND((100 - ROUND((analyzed_count / GREATEST(total_count, 1)) * 100)) * 0.4)
    - CASE WHEN analyzed_count = total_count AND ROUND((recommended_count / GREATEST(total_count, 1)) * 100) < 10 THEN 30 ELSE 0 END
    - CASE WHEN GREATEST(0, analyzed_count - recommended_count - rejected_count) > 0 THEN LEAST(25, ROUND((GREATEST(0, analyzed_count - recommended_count - rejected_count) / GREATEST(total_count, 1)) * 100)) ELSE 0 END
    - CASE WHEN ROUND((rejected_count / GREATEST(total_count, 1)) * 100) >= 50 THEN 15 ELSE 0 END
  ))`,
  createdAt: 'created_at',
};

function buildBatchListOrder(filters: BatchListFilters = {}): string {
  const col = filters.sortBy ? batchSortColumnMap[filters.sortBy] : null;
  if (!col) return 'ORDER BY id DESC';
  const dir = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
  return `ORDER BY ${col} ${dir}, id DESC`;
}

export async function listBatchesRaw(limit = 20, offset = 0, filters: BatchListFilters = {}): Promise<AsinAnalysisBatchRow[]> {
  const { whereSql, values } = buildBatchListWhere(filters);
  const orderSql = buildBatchListOrder(filters);
  return await query<AsinAnalysisBatchRow>(
    `SELECT
      id,
      batch_no AS batchNo,
      name,
      marketplace,
      product_direction AS productDirection,
      target_category AS targetCategory,
      status,
      total_count AS totalCount,
      analyzed_count AS analyzedCount,
      recommended_count AS recommendedCount,
      rejected_count AS rejectedCount,
      created_by AS createdBy,
      remark,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM asin_analysis_batches
    ${whereSql}
    ${orderSql}
    LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );
}

export async function countBatchesRaw(filters: BatchListFilters = {}): Promise<number> {
  const { whereSql, values } = buildBatchListWhere(filters);
  const rows = await query<{ total: number }>(`SELECT COUNT(1) AS total FROM asin_analysis_batches ${whereSql}`, values);
  return Number(rows[0]?.total || 0);
}

export async function createBatchDecisionActionRaw(payload: {
  batchId: number;
  actionType: string;
  conclusion: string | null;
  meetingType: string | null;
  status: string;
  ownerUserId: number | null;
  dueAt: string | null;
  notifiedAt: string | null;
  notificationChannel: string | null;
  summary: string | null;
  createdBy: number | null;
}): Promise<BatchDecisionActionRow | null> {
  const result = await query(
    `INSERT INTO asin_batch_decision_actions (
      batch_id, action_type, conclusion, meeting_type, status, owner_user_id, due_at, notified_at,
      notification_channel, summary, created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.batchId,
      payload.actionType,
      payload.conclusion,
      payload.meetingType,
      payload.status,
      payload.ownerUserId,
      payload.dueAt,
      payload.notifiedAt,
      payload.notificationChannel,
      payload.summary,
      payload.createdBy,
    ],
  );
  const rows = await query<BatchDecisionActionRow>(
    `SELECT id, batch_id AS batchId, action_type AS actionType, conclusion, meeting_type AS meetingType, status,
      owner_user_id AS ownerUserId, due_at AS dueAt, notified_at AS notifiedAt, notification_channel AS notificationChannel,
      summary, created_by AS createdBy, created_at AS createdAt, updated_at AS updatedAt
     FROM asin_batch_decision_actions WHERE id = ?`,
    [(result as any).insertId],
  );
  return rowId(rows);
}

export async function getLatestBatchDecisionActionsRaw(batchIds: number[]): Promise<BatchDecisionActionRow[]> {
  if (!batchIds.length) return [];
  const placeholders = batchIds.map(() => '?').join(',');
  return await query<BatchDecisionActionRow>(
    `SELECT a.id, a.batch_id AS batchId, a.action_type AS actionType, a.conclusion, a.meeting_type AS meetingType, a.status,
      a.owner_user_id AS ownerUserId, a.due_at AS dueAt, a.notified_at AS notifiedAt, a.notification_channel AS notificationChannel,
      a.summary, a.created_by AS createdBy, a.created_at AS createdAt, a.updated_at AS updatedAt
     FROM asin_batch_decision_actions a
     INNER JOIN (
       SELECT batch_id, MAX(id) AS max_id
       FROM asin_batch_decision_actions
       WHERE batch_id IN (${placeholders})
       GROUP BY batch_id
     ) latest ON latest.max_id = a.id
     ORDER BY a.id DESC`,
    batchIds,
  );
}

function buildBatchDecisionActionWhere(filters: BatchDecisionActionFilters = {}) {
  const clauses: string[] = [];
  const values: unknown[] = [];
  if (filters.batchId) {
    clauses.push('a.batch_id = ?');
    values.push(filters.batchId);
  }
  if (filters.actionType) {
    clauses.push('a.action_type = ?');
    values.push(filters.actionType);
  }
  if (filters.status) {
    clauses.push('a.status = ?');
    values.push(filters.status);
  }
  if (filters.overdue === true) {
    clauses.push("a.status = 'open' AND a.due_at IS NOT NULL AND a.due_at < NOW()");
  }
  return {
    whereSql: clauses.length ? `WHERE ${clauses.join(' AND ')}` : '',
    values,
  };
}

export async function listBatchDecisionActionsRaw(limit = 100, offset = 0, filters: BatchDecisionActionFilters = {}): Promise<BatchDecisionActionRow[]> {
  const { whereSql, values } = buildBatchDecisionActionWhere(filters);
  return await query<BatchDecisionActionRow>(
    `SELECT a.id, a.batch_id AS batchId, b.batch_no AS batchNo, b.name AS batchName, a.action_type AS actionType,
      a.conclusion, a.meeting_type AS meetingType, a.status, a.owner_user_id AS ownerUserId, a.due_at AS dueAt,
      a.notified_at AS notifiedAt, a.notification_channel AS notificationChannel, a.summary, a.created_by AS createdBy,
      a.created_at AS createdAt, a.updated_at AS updatedAt
     FROM asin_batch_decision_actions a
     INNER JOIN asin_analysis_batches b ON b.id = a.batch_id
     ${whereSql}
     ORDER BY a.id DESC
     LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );
}

export async function countBatchDecisionActionsRaw(filters: BatchDecisionActionFilters = {}): Promise<number> {
  const { whereSql, values } = buildBatchDecisionActionWhere(filters);
  const rows = await query<{ total: number }>(
    `SELECT COUNT(1) AS total
     FROM asin_batch_decision_actions a
     INNER JOIN asin_analysis_batches b ON b.id = a.batch_id
     ${whereSql}`,
    values,
  );
  return Number(rows[0]?.total || 0);
}

export async function updateBatchDecisionActionStatusRaw(id: number, status: string): Promise<BatchDecisionActionRow | null> {
  await query('UPDATE asin_batch_decision_actions SET status = ? WHERE id = ?', [status, id]);
  const rows = await query<BatchDecisionActionRow>(
    `SELECT id, batch_id AS batchId, action_type AS actionType, conclusion, meeting_type AS meetingType, status,
      owner_user_id AS ownerUserId, due_at AS dueAt, notified_at AS notifiedAt, notification_channel AS notificationChannel,
      summary, created_by AS createdBy, created_at AS createdAt, updated_at AS updatedAt
     FROM asin_batch_decision_actions WHERE id = ?`,
    [id],
  );
  return rowId(rows);
}

export async function getBatchRaw(id: number): Promise<AsinAnalysisBatchRow | null> {
  const rows = await query<AsinAnalysisBatchRow>(
    `SELECT
      id,
      batch_no AS batchNo,
      name,
      marketplace,
      product_direction AS productDirection,
      target_category AS targetCategory,
      status,
      total_count AS totalCount,
      analyzed_count AS analyzedCount,
      recommended_count AS recommendedCount,
      rejected_count AS rejectedCount,
      created_by AS createdBy,
      remark,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM asin_analysis_batches
    WHERE id = ?`,
    [id],
  );
  return rowId(rows);
}

export async function createBatchRaw(payload: {
  batchNo: string;
  name: string;
  marketplace: string;
  productDirection: string | null;
  targetCategory: string | null;
  status: string;
  totalCount: number;
  analyzedCount: number;
  recommendedCount: number;
  rejectedCount: number;
  createdBy: number | null;
  remark: string | null;
}): Promise<AsinAnalysisBatchRow | null> {
  const result = await query(
    `INSERT INTO asin_analysis_batches (
      batch_no, name, marketplace, product_direction, target_category, status,
      total_count, analyzed_count, recommended_count, rejected_count, created_by, remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.batchNo,
      payload.name,
      payload.marketplace,
      payload.productDirection,
      payload.targetCategory,
      payload.status,
      payload.totalCount,
      payload.analyzedCount,
      payload.recommendedCount,
      payload.rejectedCount,
      payload.createdBy,
      payload.remark,
    ],
  );
  return await getBatchRaw(Number((result as any).insertId));
}

export async function updateBatchCountersRaw(id: number, counters: Partial<Pick<AsinAnalysisBatchRow, 'status' | 'totalCount' | 'analyzedCount' | 'recommendedCount' | 'rejectedCount'>>): Promise<void> {
  const sets: string[] = [];
  const values: Array<string | number> = [];
  if (counters.status != null) { sets.push('status = ?'); values.push(counters.status); }
  if (counters.totalCount != null) { sets.push('total_count = ?'); values.push(counters.totalCount); }
  if (counters.analyzedCount != null) { sets.push('analyzed_count = ?'); values.push(counters.analyzedCount); }
  if (counters.recommendedCount != null) { sets.push('recommended_count = ?'); values.push(counters.recommendedCount); }
  if (counters.rejectedCount != null) { sets.push('rejected_count = ?'); values.push(counters.rejectedCount); }
  if (!sets.length) return;
  values.push(id);
  await query(`UPDATE asin_analysis_batches SET ${sets.join(', ')} WHERE id = ?`, values);
}

export async function updateBatchMetaRaw(id: number, meta: { productDirection?: string; targetCategory?: string; remark?: string }): Promise<AsinAnalysisBatchRow | null> {
  const sets: string[] = [];
  const values: Array<string | number> = [];
  if (meta.productDirection !== undefined) { sets.push('product_direction = ?'); values.push(meta.productDirection); }
  if (meta.targetCategory !== undefined) { sets.push('target_category = ?'); values.push(meta.targetCategory); }
  if (meta.remark !== undefined) { sets.push('remark = ?'); values.push(meta.remark); }
  if (!sets.length) return await getBatchRaw(id);
  values.push(id);
  await query(`UPDATE asin_analysis_batches SET ${sets.join(', ')} WHERE id = ?`, values);
  return await getBatchRaw(id);
}

function buildItemListWhere(batchId: number, filters: ItemListFilters = {}) {
  const clauses = ['batch_id = ?'];
  const values: unknown[] = [batchId];
  if (filters.analysisStatus) {
    clauses.push('analysis_status = ?');
    values.push(filters.analysisStatus);
  }
  if (filters.workflowStatus) {
    clauses.push('workflow_status = ?');
    values.push(filters.workflowStatus);
  }
  if (filters.recommendation) {
    clauses.push('recommendation = ?');
    values.push(filters.recommendation);
  }
  if (filters.keyword) {
    clauses.push('(asin LIKE ? OR product_title LIKE ? OR brand LIKE ? OR category LIKE ?)');
    const keyword = `%${filters.keyword}%`;
    values.push(keyword, keyword, keyword, keyword);
  }
  if (filters.minOpportunityScore != null) {
    clauses.push('opportunity_score >= ?');
    values.push(filters.minOpportunityScore);
  }
  if (filters.maxOpportunityScore != null) {
    clauses.push('opportunity_score <= ?');
    values.push(filters.maxOpportunityScore);
  }
  if (filters.operationPriority === 'p0') {
    clauses.push("recommendation = 'recommend_next_round' AND opportunity_score >= 75 AND COALESCE(risk_score, 0) < 60");
  } else if (filters.operationPriority === 'p1Review') {
    clauses.push("(recommendation = 'manual_review' OR COALESCE(risk_score, 0) >= 60 OR workflow_status IN ('review_required', 'design_rework'))");
  } else if (filters.operationPriority === 'p2') {
    clauses.push("(recommendation = 'reject' OR COALESCE(opportunity_score, 0) < 40 OR workflow_status IN ('rejected_round_1', 'design_rejected', 'terminated'))");
  } else if (filters.operationPriority === 'p1Normal') {
    clauses.push("NOT (recommendation = 'recommend_next_round' AND opportunity_score >= 75 AND COALESCE(risk_score, 0) < 60)");
    clauses.push("NOT (recommendation = 'manual_review' OR COALESCE(risk_score, 0) >= 60 OR workflow_status IN ('review_required', 'design_rework'))");
    clauses.push("NOT (recommendation = 'reject' OR COALESCE(opportunity_score, 0) < 40 OR workflow_status IN ('rejected_round_1', 'design_rejected', 'terminated'))");
  }
  return { whereSql: `WHERE ${clauses.join(' AND ')}`, values };
}

function buildItemListOrder(filters: ItemListFilters = {}) {
  const sortFieldMap: Record<string, string> = {
    opportunityScore: 'opportunity_score',
    marketScore: 'market_score',
    competitionScore: 'competition_score',
    designScore: 'design_score',
    riskScore: 'risk_score',
    price: 'price',
    rating: 'rating',
    reviewCount: 'review_count',
    monthlySales: 'monthly_sales',
    monthlyRevenue: 'monthly_revenue',
    bsr: 'bsr',
    analyzedAt: 'analyzed_at',
  };
  const column = filters.sortBy ? sortFieldMap[filters.sortBy] : null;
  if (!column) return 'ORDER BY id DESC';
  const direction = filters.sortOrder === 'asc' ? 'ASC' : 'DESC';
  return `ORDER BY ${column} ${direction}, id DESC`;
}

export async function listItemsByBatchIdRaw(batchId: number, limit = 20, offset = 0, filters: ItemListFilters = {}): Promise<AsinAnalysisItemRow[]> {
  const { whereSql, values } = buildItemListWhere(batchId, filters);
  const orderSql = buildItemListOrder(filters);
  return await query<AsinAnalysisItemRow>(
    `SELECT
      id,
      batch_id AS batchId,
      asin,
      marketplace,
      product_title AS productTitle,
      brand,
      image_url AS imageUrl,
      product_url AS productUrl,
      category,
      price,
      rating,
      review_count AS reviewCount,
      monthly_sales AS monthlySales,
      monthly_revenue AS monthlyRevenue,
      bsr,
      analysis_status AS analysisStatus,
      workflow_status AS workflowStatus,
      market_score AS marketScore,
      competition_score AS competitionScore,
      design_score AS designScore,
      risk_score AS riskScore,
      opportunity_score AS opportunityScore,
      recommendation,
      recommendation_reason AS recommendationReason,
      last_error AS lastError,
      analyzed_at AS analyzedAt,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM asin_analysis_items
    ${whereSql}
    ${orderSql}
    LIMIT ? OFFSET ?`,
    [...values, limit, offset],
  );
}

export async function countItemsByBatchIdRaw(batchId: number, filters: ItemListFilters = {}): Promise<number> {
  const { whereSql, values } = buildItemListWhere(batchId, filters);
  const rows = await query<{ total: number }>(`SELECT COUNT(1) AS total FROM asin_analysis_items ${whereSql}`, values);
  return Number(rows[0]?.total || 0);
}

export async function getItemRaw(id: number): Promise<AsinAnalysisItemRow | null> {
  const rows = await query<AsinAnalysisItemRow>(
    `SELECT
      id,
      batch_id AS batchId,
      asin,
      marketplace,
      product_title AS productTitle,
      brand,
      image_url AS imageUrl,
      product_url AS productUrl,
      category,
      price,
      rating,
      review_count AS reviewCount,
      monthly_sales AS monthlySales,
      monthly_revenue AS monthlyRevenue,
      bsr,
      analysis_status AS analysisStatus,
      workflow_status AS workflowStatus,
      market_score AS marketScore,
      competition_score AS competitionScore,
      design_score AS designScore,
      risk_score AS riskScore,
      opportunity_score AS opportunityScore,
      recommendation,
      recommendation_reason AS recommendationReason,
      last_error AS lastError,
      analyzed_at AS analyzedAt,
      created_at AS createdAt,
      updated_at AS updatedAt
    FROM asin_analysis_items
    WHERE id = ?`,
    [id],
  );
  return rowId(rows);
}

export async function createItemRaw(payload: {
  batchId: number;
  asin: string;
  marketplace: string;
  analysisStatus: string;
  workflowStatus: string;
}): Promise<AsinAnalysisItemRow | null> {
  const result = await query(
    `INSERT INTO asin_analysis_items (batch_id, asin, marketplace, analysis_status, workflow_status) VALUES (?, ?, ?, ?, ?)`,
    [payload.batchId, payload.asin, payload.marketplace, payload.analysisStatus, payload.workflowStatus],
  );
  return await getItemRaw(Number((result as any).insertId));
}

export async function updateItemRaw(id: number, payload: Partial<AsinAnalysisItemRow>): Promise<AsinAnalysisItemRow | null> {
  const sets: string[] = [];
  const values: Array<string | number | null> = [];
  const map: Record<string, string> = {
    batchId: 'batch_id', asin: 'asin', marketplace: 'marketplace', productTitle: 'product_title', brand: 'brand',
    imageUrl: 'image_url', productUrl: 'product_url', category: 'category', price: 'price', rating: 'rating',
    reviewCount: 'review_count', monthlySales: 'monthly_sales', monthlyRevenue: 'monthly_revenue', bsr: 'bsr',
    analysisStatus: 'analysis_status', workflowStatus: 'workflow_status', marketScore: 'market_score', competitionScore: 'competition_score',
    designScore: 'design_score', riskScore: 'risk_score', opportunityScore: 'opportunity_score', recommendation: 'recommendation',
    recommendationReason: 'recommendation_reason', lastError: 'last_error', analyzedAt: 'analyzed_at',
  };
  for (const [k, column] of Object.entries(map)) {
    if (Object.prototype.hasOwnProperty.call(payload, k)) {
      sets.push(`${column} = ?`);
      values.push((payload as any)[k]);
    }
  }
  if (!sets.length) return await getItemRaw(id);
  values.push(id);
  await query(`UPDATE asin_analysis_items SET ${sets.join(', ')} WHERE id = ?`, values);
  return await getItemRaw(id);
}

export async function createSnapshotRaw(payload: { itemId: number; source: string; payloadJson: unknown }): Promise<void> {
  await query(
    'INSERT INTO asin_analysis_snapshots (item_id, source, payload_json) VALUES (?, ?, ?)',
    [payload.itemId, payload.source, JSON.stringify(payload.payloadJson)],
  );
}

export async function listSnapshotsByItemIdRaw(itemId: number): Promise<AsinAnalysisSnapshotRow[]> {
  return await query<AsinAnalysisSnapshotRow>(
    `SELECT id, item_id AS itemId, source, payload_json AS payloadJson, created_at AS createdAt
     FROM asin_analysis_snapshots WHERE item_id = ? ORDER BY id DESC`,
    [itemId],
  );
}

export async function createReviewRaw(payload: {
  itemId: number;
  reviewerId: number | null;
  roundName: string;
  action: string;
  fromStatus: string | null;
  toStatus: string | null;
  reason: string | null;
  comment: string | null;
}): Promise<void> {
  await query(
    `INSERT INTO asin_analysis_reviews (item_id, reviewer_id, round_name, action, from_status, to_status, reason, comment)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [payload.itemId, payload.reviewerId, payload.roundName, payload.action, payload.fromStatus, payload.toStatus, payload.reason, payload.comment],
  );
}

export async function listReviewsByItemIdRaw(itemId: number): Promise<AsinAnalysisReviewRow[]> {
  return await query<AsinAnalysisReviewRow>(
    `SELECT id, item_id AS itemId, reviewer_id AS reviewerId, round_name AS roundName, action, from_status AS fromStatus,
      to_status AS toStatus, reason, comment, created_at AS createdAt
     FROM asin_analysis_reviews WHERE item_id = ? ORDER BY id DESC`,
    [itemId],
  );
}

export async function listReviewsByBatchIdRaw(batchId: number, limit = 100, offset = 0): Promise<(AsinAnalysisReviewRow & { asin?: string })[]> {
  return await query<AsinAnalysisReviewRow & { asin?: string }>(
    `SELECT r.id, r.item_id AS itemId, i.asin, r.reviewer_id AS reviewerId, r.round_name AS roundName, r.action,
      r.from_status AS fromStatus, r.to_status AS toStatus, r.reason, r.comment, r.created_at AS createdAt
     FROM asin_analysis_reviews r
     INNER JOIN asin_analysis_items i ON i.id = r.item_id
     WHERE i.batch_id = ?
     ORDER BY r.id DESC
     LIMIT ? OFFSET ?`,
    [batchId, limit, offset],
  );
}

export async function listRejectionReasonDistributionByBatchIdRaw(batchId: number): Promise<RejectionReasonDistributionRow[]> {
  return await query<RejectionReasonDistributionRow>(
    `SELECT COALESCE(r.reason, 'unknown') AS reason, COUNT(1) AS count
     FROM asin_analysis_reviews r
     INNER JOIN asin_analysis_items i ON i.id = r.item_id
     WHERE i.batch_id = ?
       AND r.action IN ('reject', 'reject_cost', 'reject_design', 'terminate')
     GROUP BY COALESCE(r.reason, 'unknown')
     ORDER BY count DESC`,
    [batchId],
  );
}

export async function getDesignEvaluationRaw(itemId: number): Promise<ProductDesignEvaluationRow | null> {
  const rows = await query<ProductDesignEvaluationRow>(
    `SELECT id, item_id AS itemId, designer_id AS designerId, target_user AS targetUser, usage_scenario AS usageScenario,
      pain_points AS painPoints, design_direction AS designDirection, material_suggestion AS materialSuggestion,
      structure_suggestion AS structureSuggestion, package_suggestion AS packageSuggestion, selling_points AS sellingPoints,
      attachments_json AS attachmentsJson, status, review_comment AS reviewComment, created_at AS createdAt, updated_at AS updatedAt
     FROM product_design_evaluations WHERE item_id = ?`,
    [itemId],
  );
  return rowId(rows);
}

export async function upsertDesignEvaluationRaw(payload: {
  itemId: number;
  designerId: number | null;
  targetUser: string | null;
  usageScenario: string | null;
  painPoints: string | null;
  designDirection: string | null;
  materialSuggestion: string | null;
  structureSuggestion: string | null;
  packageSuggestion: string | null;
  sellingPoints: string | null;
  attachmentsJson: unknown;
  status: string;
  reviewComment: string | null;
}): Promise<ProductDesignEvaluationRow | null> {
  const existing = await getDesignEvaluationRaw(payload.itemId);
  if (!existing) {
    const result = await query(
      `INSERT INTO product_design_evaluations (
        item_id, designer_id, target_user, usage_scenario, pain_points, design_direction, material_suggestion,
        structure_suggestion, package_suggestion, selling_points, attachments_json, status, review_comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        payload.itemId, payload.designerId, payload.targetUser, payload.usageScenario, payload.painPoints,
        payload.designDirection, payload.materialSuggestion, payload.structureSuggestion, payload.packageSuggestion,
        payload.sellingPoints, JSON.stringify(payload.attachmentsJson), payload.status, payload.reviewComment,
      ],
    );
    return await getDesignEvaluationRaw(payload.itemId);
  }
  await query(
    `UPDATE product_design_evaluations SET designer_id = ?, target_user = ?, usage_scenario = ?, pain_points = ?, design_direction = ?,
      material_suggestion = ?, structure_suggestion = ?, package_suggestion = ?, selling_points = ?, attachments_json = ?, status = ?, review_comment = ?
     WHERE item_id = ?`,
    [
      payload.designerId, payload.targetUser, payload.usageScenario, payload.painPoints, payload.designDirection,
      payload.materialSuggestion, payload.structureSuggestion, payload.packageSuggestion, payload.sellingPoints,
      JSON.stringify(payload.attachmentsJson), payload.status, payload.reviewComment, payload.itemId,
    ],
  );
  return await getDesignEvaluationRaw(payload.itemId);
}

export async function getSampleEvaluationRaw(itemId: number): Promise<SampleEvaluationRow | null> {
  const rows = await query<SampleEvaluationRow>(
    `SELECT id, item_id AS itemId, evaluator_id AS evaluatorId, target_price AS targetPrice, estimated_cost AS estimatedCost,
      gross_margin AS grossMargin, moq, supplier, sample_cost AS sampleCost, sample_cycle_days AS sampleCycleDays,
      decision, comment, created_at AS createdAt, updated_at AS updatedAt
     FROM sample_evaluations WHERE item_id = ?`,
    [itemId],
  );
  return rowId(rows);
}

export async function upsertSampleEvaluationRaw(payload: {
  itemId: number;
  evaluatorId: number | null;
  targetPrice: number | null;
  estimatedCost: number | null;
  grossMargin: number | null;
  moq: number | null;
  supplier: string | null;
  sampleCost: number | null;
  sampleCycleDays: number | null;
  decision: string | null;
  comment: string | null;
}): Promise<SampleEvaluationRow | null> {
  const existing = await getSampleEvaluationRaw(payload.itemId);
  if (!existing) {
    const result = await query(
      `INSERT INTO sample_evaluations (
        item_id, evaluator_id, target_price, estimated_cost, gross_margin, moq, supplier, sample_cost, sample_cycle_days, decision, comment
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [payload.itemId, payload.evaluatorId, payload.targetPrice, payload.estimatedCost, payload.grossMargin, payload.moq, payload.supplier, payload.sampleCost, payload.sampleCycleDays, payload.decision, payload.comment],
    );
    return await getSampleEvaluationRaw(payload.itemId);
  }
  await query(
    `UPDATE sample_evaluations SET evaluator_id = ?, target_price = ?, estimated_cost = ?, gross_margin = ?, moq = ?, supplier = ?, sample_cost = ?, sample_cycle_days = ?, decision = ?, comment = ? WHERE item_id = ?`,
    [payload.evaluatorId, payload.targetPrice, payload.estimatedCost, payload.grossMargin, payload.moq, payload.supplier, payload.sampleCost, payload.sampleCycleDays, payload.decision, payload.comment, payload.itemId],
  );
  return await getSampleEvaluationRaw(payload.itemId);
}

export async function getHealthTrendRaw(filters: HealthTrendFilters = {}): Promise<HealthTrendRow[]> {
  const { dateFrom, dateTo, groupBy = 'day' } = filters;
  
  let dateFormat = '%Y-%m-%d';
  if (groupBy === 'week') dateFormat = '%Y-%u';
  if (groupBy === 'month') dateFormat = '%Y-%m';

  const whereClauses: string[] = [];
  const values: unknown[] = [];

  if (dateFrom) {
    whereClauses.push('created_at >= ?');
    values.push(`${dateFrom} 00:00:00`);
  }
  if (dateTo) {
    whereClauses.push('created_at <= ?');
    values.push(`${dateTo} 23:59:59`);
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const healthScoreExpression = `
    GREATEST(0, LEAST(100,
      100
      - ROUND((100 - ROUND((analyzed_count / GREATEST(total_count, 1)) * 100)) * 0.4)
      - CASE WHEN analyzed_count = total_count AND ROUND((recommended_count / GREATEST(total_count, 1)) * 100) < 10 THEN 30 ELSE 0 END
      - CASE WHEN GREATEST(0, analyzed_count - recommended_count - rejected_count) > 0 THEN LEAST(25, ROUND((GREATEST(0, analyzed_count - recommended_count - rejected_count) / GREATEST(total_count, 1)) * 100)) ELSE 0 END
      - CASE WHEN ROUND((rejected_count / GREATEST(total_count, 1)) * 100) >= 50 THEN 15 ELSE 0 END
    ))
  `;

  const sql = `
    SELECT 
      DATE_FORMAT(created_at, '${dateFormat}') as date,
      COUNT(*) as totalBatches,
      SUM(CASE WHEN ${healthScoreExpression} >= 80 THEN 1 ELSE 0 END) as healthyBatches,
      SUM(CASE WHEN ${healthScoreExpression} < 80 THEN 1 ELSE 0 END) as reviewBatches,
      ROUND(AVG(${healthScoreExpression}), 1) as avgHealthScore
    FROM asin_analysis_batches 
    ${whereSql}
    GROUP BY DATE_FORMAT(created_at, '${dateFormat}')
    ORDER BY date ASC
  `;

  const rows = await query(sql, values);
  return rows as unknown as HealthTrendRow[];
}

export async function getHealthAlertConfigs(filters: HealthAlertFilters = {}): Promise<HealthAlertConfig[]> {
  const { isActive } = filters;
  const whereClauses: string[] = [];
  const values: unknown[] = [];

  if (isActive !== undefined) {
    whereClauses.push('is_active = ?');
    values.push(isActive);
  }

  const whereSql = whereClauses.length ? `WHERE ${whereClauses.join(' AND ')}` : '';

  const sql = `
    SELECT 
      id, name, min_health_score, min_analysis_rate, min_recommendation_rate, 
      max_rejection_rate, is_active, created_by, created_at, updated_at
    FROM health_alert_configs 
    ${whereSql}
    ORDER BY created_at DESC
  `;

  const rows = await query(sql, values);
  return rows as unknown as HealthAlertConfig[];
}

export async function createHealthAlertConfig(config: {
  name: string;
  minHealthScore: number;
  minAnalysisRate: number;
  minRecommendationRate: number;
  maxRejectionRate: number;
  createdBy: number | null;
}): Promise<HealthAlertConfig> {
  const result = await query(
    `INSERT INTO health_alert_configs (
      name, min_health_score, min_analysis_rate, min_recommendation_rate, 
      max_rejection_rate, is_active, created_by, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, 1, ?, NOW(), NOW())`,
    [config.name, config.minHealthScore, config.minAnalysisRate, config.minRecommendationRate, config.maxRejectionRate, config.createdBy]
  );

  const rows = await query('SELECT * FROM health_alert_configs WHERE id = ?', [(result as any).insertId]);
  return (rows as unknown as HealthAlertConfig[])[0];
}

export async function getBatchAlerts(config?: HealthAlertConfig): Promise<BatchAlertRow[]> {
  const activeConfig = config || await getActiveAlertConfig();
  if (!activeConfig) return [];

  const healthScoreExpression = `
    GREATEST(0, LEAST(100,
      100
      - ROUND((100 - ROUND((analyzed_count / GREATEST(total_count, 1)) * 100)) * 0.4)
      - CASE WHEN analyzed_count = total_count AND ROUND((recommended_count / GREATEST(total_count, 1)) * 100) < 10 THEN 30 ELSE 0 END
      - CASE WHEN GREATEST(0, analyzed_count - recommended_count - rejected_count) > 0 THEN LEAST(25, ROUND((GREATEST(0, analyzed_count - recommended_count - rejected_count) / GREATEST(total_count, 1)) * 100)) ELSE 0 END
      - CASE WHEN ROUND((rejected_count / GREATEST(total_count, 1)) * 100) >= 50 THEN 15 ELSE 0 END
    ))
  `;

  const sql = `
    SELECT 
      id as batchId,
      batch_no as batchNo,
      name as batchName,
      ROUND(${healthScoreExpression}, 1) as healthScore,
      ROUND((analyzed_count / GREATEST(total_count, 1)) * 100, 1) as analysisRate,
      ROUND((recommended_count / GREATEST(total_count, 1)) * 100, 1) as recommendationRate,
      ROUND((rejected_count / GREATEST(total_count, 1)) * 100, 1) as rejectionRate
    FROM asin_analysis_batches 
    WHERE status = 'completed' AND total_count > 0
    HAVING healthScore < ? OR analysisRate < ? OR recommendationRate < ? OR rejectionRate > ?
    ORDER BY healthScore ASC
  `;

  const rows = await query(sql, [
    activeConfig.minHealthScore,
    activeConfig.minAnalysisRate,
    activeConfig.minRecommendationRate,
    activeConfig.maxRejectionRate
  ]);

  return (rows as unknown as any[]).map(row => {
    const alertReasons: string[] = [];
    if (row.healthScore < activeConfig.minHealthScore) alertReasons.push('健康分过低');
    if (row.analysisRate < activeConfig.minAnalysisRate) alertReasons.push('分析率不足');
    if (row.recommendationRate < activeConfig.minRecommendationRate) alertReasons.push('推荐率过低');
    if (row.rejectionRate > activeConfig.maxRejectionRate) alertReasons.push('淘汰率过高');

    // 计算预警级别
    let alertLevel: 'low' | 'medium' | 'high' = 'low';
    if (row.healthScore < 60 || alertReasons.length >= 3) alertLevel = 'high';
    else if (row.healthScore < 70 || alertReasons.length >= 2) alertLevel = 'medium';

    return {
      ...row,
      alertReasons,
      alertLevel
    };
  }) as BatchAlertRow[];
}

async function getActiveAlertConfig(): Promise<HealthAlertConfig | null> {
  const rows = await query(
    'SELECT * FROM health_alert_configs WHERE is_active = 1 ORDER BY created_at DESC LIMIT 1'
  );
  return (rows as unknown as HealthAlertConfig[])[0] || null;
}

// =========================
// Saved Views
// =========================

export interface SavedViewRow {
  id: number;
  userId: number;
  moduleKey: string;
  viewName: string;
  viewConfigJson: string | null;
  isDefault: number;
  createdAt: string;
  updatedAt: string;
}

export async function listSavedViewsRaw(userId: number, moduleKey: string): Promise<SavedViewRow[]> {
  return await query<SavedViewRow>(
    'SELECT * FROM saved_views WHERE user_id = ? AND module_key = ? ORDER BY is_default DESC, updated_at DESC',
    [userId, moduleKey],
  );
}

export async function createSavedViewRaw(userId: number, moduleKey: string, viewName: string, viewConfigJson: string, isDefault: boolean): Promise<SavedViewRow> {
  const result = await query(
    'INSERT INTO saved_views (user_id, module_key, view_name, view_config_json, is_default) VALUES (?, ?, ?, ?, ?)',
    [userId, moduleKey, viewName, viewConfigJson, isDefault ? 1 : 0],
  );
  const rows = await query<SavedViewRow>('SELECT * FROM saved_views WHERE id = ?', [Number((result as any).insertId)]);
  return rows[0];
}

export async function updateSavedViewRaw(id: number, viewName?: string, viewConfigJson?: string, isDefault?: boolean): Promise<SavedViewRow | null> {
  const sets: string[] = [];
  const values: Array<string | number> = [];
  if (viewName !== undefined) { sets.push('view_name = ?'); values.push(viewName); }
  if (viewConfigJson !== undefined) { sets.push('view_config_json = ?'); values.push(viewConfigJson); }
  if (isDefault !== undefined) { sets.push('is_default = ?'); values.push(isDefault ? 1 : 0); }
  if (!sets.length) { const rows = await query<SavedViewRow>('SELECT * FROM saved_views WHERE id = ?', [id]); return rows[0] || null; }
  values.push(id);
  await query(`UPDATE saved_views SET ${sets.join(', ')} WHERE id = ?`, values);
  const rows = await query<SavedViewRow>('SELECT * FROM saved_views WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function deleteSavedViewRaw(id: number): Promise<void> {
  await query('DELETE FROM saved_views WHERE id = ?', [id]);
}
