import { AppError } from '../../../common/errors.js';
import type { JsonBody } from '../../../common/types.js';
import {
  createProfitCalculationRecord,
  createProjectRecord,
  createQuoteRecord,
  createSampleRecord,
  createSyncRecord,
  deleteProfitCalculationRecord,
  deleteProjectRecord,
  deleteQuoteRecord,
  deleteSampleRecord,
  deleteSyncRecord,
  getProfitCalculationById,
  getProjectById,
  getQuoteById,
  getSampleRecordById,
  getSyncRecordById,
  listProfitCalculations,
  listProfitCalculationsByProjectId,
  listProjects,
  listQuotes,
  listQuotesByProjectId,
  listSampleRecords,
  listSampleRecordsByProjectId,
  listSyncRecords,
  listSyncRecordsByProjectId,
  updateProfitCalculationRecord,
  updateProjectRecord,
  updateQuoteRecord,
  updateSampleRecord,
  updateSyncRecord,
} from '../repository/product-dev.repository.js';

function ensureNonNegativeNumber(value: unknown, fieldName: string) {
  if (value != null && Number(value) < 0) {
    throw new AppError(400, 'invalid_request', { field: fieldName, reason: 'must_be_non_negative' });
  }
}

async function ensureProjectExists(projectId: number) {
  const project = await getProjectById(projectId);
  if (!project) {
    throw new AppError(404, 'resource_not_found', { field: 'projectId' });
  }

  return project;
}

async function ensureProjectRecordExists(id: number) {
  const project = await getProjectById(id);
  if (!project) {
    throw new AppError(404, 'resource_not_found', { field: 'id' });
  }

  return project;
}

async function ensureQuoteExists(id: number) {
  const quote = await getQuoteById(id);
  if (!quote) {
    throw new AppError(404, 'resource_not_found', { field: 'id' });
  }

  return quote;
}

async function ensureProfitCalculationExists(id: number) {
  const record = await getProfitCalculationById(id);
  if (!record) {
    throw new AppError(404, 'resource_not_found', { field: 'id' });
  }

  return record;
}

async function ensureSampleExists(id: number) {
  const sample = await getSampleRecordById(id);
  if (!sample) {
    throw new AppError(404, 'resource_not_found', { field: 'id' });
  }

  return sample;
}

async function ensureSyncExists(id: number) {
  const record = await getSyncRecordById(id);
  if (!record) {
    throw new AppError(404, 'resource_not_found', { field: 'id' });
  }

  return record;
}

function normalizeProject(body: JsonBody) {
  if (!body.productName) {
    throw new AppError(400, 'invalid_request', { field: 'productName', reason: 'required' });
  }
  ensureNonNegativeNumber(body.estimatedCost, 'estimatedCost');
  ensureNonNegativeNumber(body.targetPrice, 'targetPrice');
  ensureNonNegativeNumber(body.grossMarginTarget, 'grossMarginTarget');

  return {
    projectCode: (body.projectCode as string) || `NP-${Date.now()}`,
    productName: body.productName as string,
    sku: (body.sku as string) || null,
    developerName: (body.developerName as string) || null,
    ownerName: (body.ownerName as string) || null,
    targetPlatform: (body.targetPlatform as string) || null,
    targetMarket: (body.targetMarket as string) || null,
    estimatedCost: body.estimatedCost == null ? null : Number(body.estimatedCost),
    targetPrice: body.targetPrice == null ? null : Number(body.targetPrice),
    grossMarginTarget: body.grossMarginTarget == null ? null : Number(body.grossMarginTarget),
    projectStatus: (body.projectStatus as string) || '待调研',
  };
}

function normalizeQuote(body: JsonBody) {
  if (!body.supplierName) {
    throw new AppError(400, 'invalid_request', { field: 'supplierName', reason: 'required' });
  }
  ensureNonNegativeNumber(body.quotePrice, 'quotePrice');
  ensureNonNegativeNumber(body.moq, 'moq');
  ensureNonNegativeNumber(body.deliveryDays, 'deliveryDays');

  return {
    projectId: Number(body.projectId),
    supplierName: body.supplierName as string,
    supplierErpId: (body.supplierErpId as string) || null,
    currency: (body.currency as string) || 'CNY',
    quotePrice: Number(body.quotePrice || 0),
    moq: body.moq == null ? null : Number(body.moq),
    taxIncluded: Number(body.taxIncluded ?? 1),
    deliveryDays: body.deliveryDays == null ? null : Number(body.deliveryDays),
    preferred: Number(body.preferred ?? 0),
  };
}

function normalizeProfitCalculation(body: JsonBody) {
  ensureNonNegativeNumber(body.salesPriceUsd, 'salesPriceUsd');
  ensureNonNegativeNumber(body.exchangeRate, 'exchangeRate');
  ensureNonNegativeNumber(body.productCostRmb, 'productCostRmb');
  ensureNonNegativeNumber(body.accessoryCostRmb, 'accessoryCostRmb');
  ensureNonNegativeNumber(body.shippingExpress, 'shippingExpress');
  ensureNonNegativeNumber(body.shippingAir, 'shippingAir');
  ensureNonNegativeNumber(body.shippingSea, 'shippingSea');
  ensureNonNegativeNumber(body.selectedProfit, 'selectedProfit');
  ensureNonNegativeNumber(body.selectedProfitRate, 'selectedProfitRate');

  return {
    projectId: Number(body.projectId),
    salesPriceUsd: Number(body.salesPriceUsd || 0),
    exchangeRate: Number(body.exchangeRate || 0),
    productCostRmb: Number(body.productCostRmb || 0),
    accessoryCostRmb: body.accessoryCostRmb == null ? 0 : Number(body.accessoryCostRmb),
    shippingExpress: body.shippingExpress == null ? null : Number(body.shippingExpress),
    shippingAir: body.shippingAir == null ? null : Number(body.shippingAir),
    shippingSea: body.shippingSea == null ? null : Number(body.shippingSea),
    selectedPlan: (body.selectedPlan as string) || null,
    selectedProfit: body.selectedProfit == null ? null : Number(body.selectedProfit),
    selectedProfitRate: body.selectedProfitRate == null ? null : Number(body.selectedProfitRate),
    calculatedBy: (body.calculatedBy as string) || null,
  };
}

function normalizeSample(body: JsonBody) {
  ensureNonNegativeNumber(body.roundNo, 'roundNo');
  ensureNonNegativeNumber(body.sampleFee, 'sampleFee');

  return {
    projectId: Number(body.projectId),
    roundNo: Number(body.roundNo || 1),
    supplierName: (body.supplierName as string) || null,
    sampleFee: body.sampleFee == null ? null : Number(body.sampleFee),
    reviewResult: (body.reviewResult as string) || null,
    improvementNotes: (body.improvementNotes as string) || null,
  };
}

function normalizeSync(body: JsonBody) {
  return {
    projectId: Number(body.projectId),
    syncStatus: (body.syncStatus as string) || 'pending',
    syncedBy: (body.syncedBy as string) || null,
    syncTime: body.syncTime ? String(body.syncTime).replace('T', ' ').replace('Z', '').replace(/\.\d+$/, '') : null,
    resultMessage: (body.resultMessage as string) || null,
  };
}

export async function getProjects() {
  return await listProjects();
}

export async function getProjectDetail(projectId: number) {
  return {
    project: await getProjectById(projectId),
    quotes: await listQuotesByProjectId(projectId),
    profitCalculations: await listProfitCalculationsByProjectId(projectId),
    sampleRecords: await listSampleRecordsByProjectId(projectId),
    syncRecords: await listSyncRecordsByProjectId(projectId),
  };
}

export async function createProject(body: JsonBody) {
  return await createProjectRecord(normalizeProject(body));
}

export async function updateProject(id: number, body: JsonBody) {
  await ensureProjectRecordExists(id);
  return await updateProjectRecord(id, normalizeProject(body));
}

export async function deleteProject(id: number) {
  await ensureProjectRecordExists(id);
  const detail = await getProjectDetail(id);
  if (detail.quotes.length || detail.profitCalculations.length || detail.sampleRecords.length || detail.syncRecords.length) {
    throw new AppError(400, 'invalid_request', { field: 'id', reason: 'has_child_records' });
  }
  await deleteProjectRecord(id);
  return { deleted: true };
}

export async function getQuotes() {
  return await listQuotes();
}

export async function createQuote(body: JsonBody) {
  const payload = normalizeQuote(body);
  await ensureProjectExists(payload.projectId);
  return await createQuoteRecord(payload);
}

export async function updateQuote(id: number, body: JsonBody) {
  await ensureQuoteExists(id);
  const payload = normalizeQuote(body);
  await ensureProjectExists(payload.projectId);
  return await updateQuoteRecord(id, payload);
}

export async function deleteQuote(id: number) {
  await ensureQuoteExists(id);
  await deleteQuoteRecord(id);
  return { deleted: true };
}

export async function getProfitCalculations() {
  return await listProfitCalculations();
}

export async function createProfitCalculation(body: JsonBody) {
  const payload = normalizeProfitCalculation(body);
  await ensureProjectExists(payload.projectId);
  return await createProfitCalculationRecord(payload);
}

export async function updateProfitCalculation(id: number, body: JsonBody) {
  await ensureProfitCalculationExists(id);
  const payload = normalizeProfitCalculation(body);
  await ensureProjectExists(payload.projectId);
  return await updateProfitCalculationRecord(id, payload);
}

export async function deleteProfitCalculation(id: number) {
  await ensureProfitCalculationExists(id);
  await deleteProfitCalculationRecord(id);
  return { deleted: true };
}

export async function getSamples() {
  return await listSampleRecords();
}

export async function createSample(body: JsonBody) {
  const payload = normalizeSample(body);
  await ensureProjectExists(payload.projectId);
  return await createSampleRecord(payload);
}

export async function updateSample(id: number, body: JsonBody) {
  await ensureSampleExists(id);
  const payload = normalizeSample(body);
  await ensureProjectExists(payload.projectId);
  return await updateSampleRecord(id, payload);
}

export async function deleteSample(id: number) {
  await ensureSampleExists(id);
  await deleteSampleRecord(id);
  return { deleted: true };
}

export async function getSyncRecords() {
  return await listSyncRecords();
}

export async function createSync(body: JsonBody) {
  const payload = normalizeSync(body);
  await ensureProjectExists(payload.projectId);
  return await createSyncRecord(payload);
}

export async function updateSync(id: number, body: JsonBody) {
  await ensureSyncExists(id);
  const payload = normalizeSync(body);
  await ensureProjectExists(payload.projectId);
  return await updateSyncRecord(id, payload);
}

export async function deleteSync(id: number) {
  await ensureSyncExists(id);
  await deleteSyncRecord(id);
  return { deleted: true };
}

// ============================
// Stage Transition & Approval
// ============================

const PROJECT_STAGES = [
  '待调研',
  '待报价',
  '待立项审批',
  '立项通过',
  '打样中',
  '打样通过',
  '待同步',
  '已同步领星',
  '已驳回',
  '打样失败',
];

const VALID_TRANSITIONS = {
  '待调研': ['待报价'],
  '待报价': ['待立项审批'],
  '待立项审批': ['立项通过', '已驳回'],
  '立项通过': ['打样中'],
  '已驳回': ['待调研'],
  '打样中': ['打样通过', '打样失败'],
  '打样通过': ['待同步'],
  '打样失败': ['打样中'],
  '待同步': ['已同步领星'],
  '已同步领星': [],
};

async function validatePreSync(projectId: number) {
  const errors: string[] = [];
  const project = await getProjectById(projectId);
  if (!project?.sku) errors.push('missing_sku');

  const quotes = await listQuotesByProjectId(projectId);
  if (!quotes.length) errors.push('no_quotes');

  const profits = await listProfitCalculationsByProjectId(projectId);
  if (!profits.length) errors.push('no_profit_calculation');

  const samples = await listSampleRecordsByProjectId(projectId);
  const hasPassed = samples.some((s) => s.reviewResult === 'pass');
  if (!hasPassed) errors.push('no_passed_sample');

  return errors;
}

export async function transitionProjectStatus(id: number, body: JsonBody) {
  const project = await ensureProjectRecordExists(id);
  const currentStatus = String(project.projectStatus);
  const targetStatus = String(body.targetStatus || '');

  if (!targetStatus || !PROJECT_STAGES.includes(targetStatus)) {
    throw new AppError(400, 'invalid_request', { field: 'targetStatus', reason: 'invalid_status', allowed: PROJECT_STAGES });
  }

  const allowed: string[] = VALID_TRANSITIONS[currentStatus as keyof typeof VALID_TRANSITIONS] || [];
  if (!allowed.includes(targetStatus)) {
    throw new AppError(400, 'invalid_request', {
      field: 'targetStatus',
      reason: 'invalid_transition',
      currentStatus,
      targetStatus,
      allowedTransitions: allowed,
    });
  }

  // Pre-sync validation
  if (targetStatus === '待同步') {
    const preSyncErrors = await validatePreSync(id);
    if (preSyncErrors.length) {
      throw new AppError(400, 'pre_sync_validation_failed', { errors: preSyncErrors });
    }
  }

  await updateProjectRecord(id, { ...project, projectStatus: targetStatus });
  return await getProjectById(id);
}

export async function approveProject(id: number, body: JsonBody) {
  const result = await transitionProjectStatus(id, { targetStatus: '立项通过', ...body });
  await createSyncRecord({
    projectId: id,
    syncStatus: 'approval_passed',
    syncedBy: (body?.operator as string) || null,
    syncTime: null,
    resultMessage: (body?.reason as string) || '立项审批通过',
  });
  return result;
}

export async function rejectProject(id: number, body: JsonBody) {
  const reason = (body?.reason as string) || '未填写驳回原因';
  const result = await transitionProjectStatus(id, { targetStatus: '已驳回', reason });
  await createSyncRecord({
    projectId: id,
    syncStatus: 'approval_rejected',
    syncedBy: (body?.operator as string) || null,
    syncTime: null,
    resultMessage: reason,
  });
  return result;
}

export async function getPreSyncCheck(id: number) {
  await ensureProjectRecordExists(id);
  const errors = await validatePreSync(id);
  return { projectId: id, ready: errors.length === 0, errors };
}

export async function getProjectSamples(projectId: number) {
  await ensureProjectExists(projectId);
  return await listSampleRecordsByProjectId(projectId);
}

export async function getProjectQuotes(projectId: number) {
  await ensureProjectExists(projectId);
  return await listQuotesByProjectId(projectId);
}

export async function getProjectProfitCalculations(projectId: number) {
  await ensureProjectExists(projectId);
  return await listProfitCalculationsByProjectId(projectId);
}

export async function getProjectSyncRecords(projectId: number) {
  await ensureProjectExists(projectId);
  return await listSyncRecordsByProjectId(projectId);
}
