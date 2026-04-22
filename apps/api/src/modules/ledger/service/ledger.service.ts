import { AppError } from '../../../common/errors.js';
import { getListPagination } from '../../../common/pagination.js';
import type { JsonBody } from '../../../common/types.js';
import {
  createAccountRecord,
  createCategoryRecord,
  createImportBatchRecord,
  createMatchRecord,
  createTransactionAttachment,
  createTransactionRecord,
  deleteMatchRecord,
  deleteTransactionRecord,
  getAccountById,
  getImportBatchById,
  getMatchById,
  getTransactionById,
  listAccounts,
  listCategories,
  listExternalTransactions,
  listExternalTransactionsByBatchId,
  listImportBatches,
  listMatches,
  listMatchesByTransactionId,
  listTransactionAttachmentsByTransactionId,
  listTransactions,
  updateAccountRecord,
  updateCategoryRecord,
  getCategoryById,
  updateMatchRecord,
  updateTransactionRecord,
  updateImportBatchStatus,
  createExternalTransactionRows,
  getExternalTransactionById,
  updateExternalTransactionMatchStatus,
  getMonthlySummary as getMonthlySummaryRepo,
  getDistinctCounterparties,
  batchCreateTransactions as batchCreateRepo,
  getExchangeRate as getExchangeRateRepo,
  getGlobalStats as getGlobalStatsRepo,
  listLedgerProjects,
  getLedgerProjectById,
  createLedgerProject as createProjectRepo,
  updateLedgerProject as updateProjectRepo,
  getChildProjectIds,
  deleteLedgerProjectCascade,
  batchUpdateProjectSort,
  getProjectTransactionStats,
  listLedgerCounterparties,
  getLedgerCounterpartyById,
  createLedgerCounterparty as createCounterpartyRepo,
  updateLedgerCounterparty as updateCounterpartyRepo,
  deleteLedgerCounterparty as deleteCounterpartyRepo,
  batchUpdateCounterpartySort,
  getCounterpartyTransactionStats,
  softDeleteAccount,
  batchUpdateAccountSort,
  deleteCategoryRecord as deleteCategoryRepo,
  batchUpdateCategorySort,
} from '../repository/ledger.repository.js';

function ensureExistingResource<T>(resource: T | null | undefined, fieldName: string, id: number): T {
  if (!resource) {
    throw new AppError(404, 'resource_not_found', { field: fieldName, id });
  }

  return resource;
}

function ensureNonNegativeNumber(value: unknown, fieldName: string) {
  if (Number(value) < 0) {
    throw new AppError(400, 'invalid_request', { field: fieldName, reason: 'must_be_non_negative' });
  }
}

function getListFilters(query: JsonBody) {
  return {
    status: query.status ? String(query.status) : '',
    accountType: query.accountType || query.account_type ? String(query.accountType || query.account_type) : '',
    currency: query.currency ? String(query.currency) : '',
    keyword: query.keyword ? String(query.keyword).trim() : '',
    categoryType: query.categoryType || query.category_type ? String(query.categoryType || query.category_type) : '',
    transactionType: query.transactionType || query.transaction_type ? String(query.transactionType || query.transaction_type) : '',
    reimbursementStatus: query.reimbursementStatus || query.reimbursement_status ? String(query.reimbursementStatus || query.reimbursement_status) : '',
    accountId: query.accountId || query.account_id ? Number(query.accountId || query.account_id) : null,
    categoryId: query.categoryId || query.category_id ? Number(query.categoryId || query.category_id) : null,
    startDate: query.startDate || query.start_date ? String(query.startDate || query.start_date) : '',
    endDate: query.endDate || query.end_date ? String(query.endDate || query.end_date) : '',
    sourceType: query.sourceType || query.source_type ? String(query.sourceType || query.source_type) : '',
    matchStatus: query.matchStatus || query.match_status ? String(query.matchStatus || query.match_status) : '',
    importBatchId: query.importBatchId || query.import_batch_id ? Number(query.importBatchId || query.import_batch_id) : null,
    transactionId: query.transactionId || query.transaction_id ? Number(query.transactionId || query.transaction_id) : null,
    externalTransactionId: query.externalTransactionId || query.external_transaction_id ? Number(query.externalTransactionId || query.external_transaction_id) : null,
    projectName: query.projectName || query.project_name ? String(query.projectName || query.project_name) : '',
    counterpartyName: query.counterpartyName || query.counterparty_name ? String(query.counterpartyName || query.counterparty_name) : '',
  };
}

export async function getAccounts(query: JsonBody = {}) {
  const { page, pageSize } = getListPagination(query);
  return await listAccounts(getListFilters(query), page, pageSize);
}

export async function getAccountDetail(id: number) {
  return ensureExistingResource(await getAccountById(id), 'accountId', id);
}

export async function createAccount(body: JsonBody) {
  if (!body.accountName) {
    throw new AppError(400, 'invalid_request', { field: 'accountName', reason: 'required' });
  }

  const openingBalance = Number(body.openingBalance || 0);
  const currentBalance = Number(body.currentBalance ?? body.openingBalance ?? 0);
  ensureNonNegativeNumber(openingBalance, 'openingBalance');
  ensureNonNegativeNumber(currentBalance, 'currentBalance');

  return await createAccountRecord({
    accountName: body.accountName as string,
    accountType: (body.accountType as string) || 'bank',
    accountSourceType: (body.accountSourceType as string) || 'manual',
    currency: (body.currency as string) || 'CNY',
    openingBalance,
    currentBalance,
    status: (body.status as string) || 'active',
    remark: (body.remark as string) || null,
  });
}

export async function getCategories(query: JsonBody = {}) {
  const { page, pageSize } = getListPagination(query);
  return await listCategories(getListFilters(query), page, pageSize);
}

export async function createCategory(body: JsonBody) {
  if (!body.categoryName) {
    throw new AppError(400, 'invalid_request', { field: 'categoryName', reason: 'required' });
  }

  if (body.parentId) {
    const parentList = await listCategories({}, 1, 100);
    const parent = parentList.list.find((item) => item.id === Number(body.parentId));
    if (!parent) {
      throw new AppError(400, 'invalid_request', { field: 'parentId', reason: 'not_found' });
    }
  }

  return await createCategoryRecord({
    parentId: (body.parentId as number) || null,
    categoryName: body.categoryName as string,
    categoryType: (body.categoryType as string) || 'expense',
    sortNo: Number(body.sortNo || 0),
    status: (body.status as string) || 'active',
  });
}

export async function getTransactions(query: JsonBody = {}) {
  const { page, pageSize } = getListPagination(query);
  return await listTransactions(getListFilters(query), page, pageSize);
}

export async function getTransactionDetail(id: number) {
  const transaction = ensureExistingResource(await getTransactionById(id), 'transactionId', id);
  const matches = await listMatchesByTransactionId(id);
  const attachments = await listTransactionAttachmentsByTransactionId(id);
  return { transaction, matches, attachments };
}

export async function getTransactionAttachments(transactionId: number) {
  ensureExistingResource(await getTransactionById(transactionId), 'transactionId', transactionId);
  return await listTransactionAttachmentsByTransactionId(transactionId);
}

export async function uploadTransactionAttachment(transactionId: number, body: JsonBody) {
  const transaction = await getTransactionById(transactionId);
  if (!transaction) {
    throw new AppError(404, 'resource_not_found', { field: 'transactionId' });
  }
  if (!body.fileUrl) {
    throw new AppError(400, 'invalid_request', { field: 'fileUrl', reason: 'required' });
  }
  return await createTransactionAttachment(transactionId, (body.fileName as string) || 'voucher-image.jpg', body.fileUrl as string);
}

export async function createTransaction(body: JsonBody) {
  const amount = Number(body.amount || 0);
  ensureNonNegativeNumber(amount, 'amount');
  if (body.transferInAmount != null) ensureNonNegativeNumber(Number(body.transferInAmount), 'transferInAmount');

  // Auto-resolve currency and exchange rate from account
  let currency = (body.currency as string) || 'CNY';
  let exchangeRate = body.exchangeRate == null ? null : Number(body.exchangeRate);
  let amountCny = body.amountCny == null ? amount : Number(body.amountCny);
  const txnDate = (body.transactionDate as string) || new Date().toISOString().slice(0, 10);

  if (body.accountId) {
    const account = await getAccountById(Number(body.accountId));
    if (!account) {
      throw new AppError(400, 'invalid_request', { field: 'accountId', reason: 'not_found' });
    }
    currency = account.currency || 'CNY';
    if (currency !== 'CNY' && exchangeRate == null) {
      const rateRow = await getExchangeRateRepo(currency, 'CNY', txnDate);
      exchangeRate = rateRow ? Number(rateRow.rate) : 1;
      amountCny = Math.round(amount * exchangeRate * 100) / 100;
    }
  }

  if (currency === 'CNY') {
    exchangeRate = 1;
    amountCny = amount;
  }
  ensureNonNegativeNumber(amountCny, 'amountCny');

  if (body.categoryId) {
    const categoryList = await listCategories({}, 1, 100);
    const category = categoryList.list.find((item) => item.id === Number(body.categoryId));
    if (!category) {
      throw new AppError(400, 'invalid_request', { field: 'categoryId', reason: 'not_found' });
    }
  }

  return await createTransactionRecord({
    transactionNo: (body.transactionNo as string) || `TXN-${Date.now()}`,
    transactionType: (body.transactionType as string) || 'expense',
    transactionDate: txnDate,
    postingDate: (body.postingDate as string) || null,
    accountId: (body.accountId as number) || null,
    transferOutAccountId: (body.transferOutAccountId as number) || null,
    transferInAccountId: (body.transferInAccountId as number) || null,
    amount,
    transferInAmount: body.transferInAmount == null ? null : Number(body.transferInAmount),
    currency,
    exchangeRate,
    amountCny,
    paymentAccount: (body.paymentAccount as string) || null,
    categoryId: (body.categoryId as number) || null,
    counterpartyName: (body.counterpartyName as string) || null,
    projectName: (body.projectName as string) || null,
    summary: (body.summary as string) || null,
    remark: (body.remark as string) || null,
    reimbursementRequired: Number(body.reimbursementRequired || 0),
    reimbursementStatus: (body.reimbursementStatus as string) || 'none',
    invoiceRequired: Number(body.invoiceRequired || 0),
    createdBy: (body.createdBy as string) || null,
  });
}

export async function updateTransaction(id: number, body: JsonBody) {
  ensureExistingResource(await getTransactionById(id), 'transactionId', id);
  return await updateTransactionRecord(id, body);
}

export async function deleteTransaction(id: number, operatorId?: string | number | null) {
  const txn = ensureExistingResource(await getTransactionById(id), 'transactionId', id);
  await deleteTransactionRecord(id, {
    transactionType: txn.transactionType ?? '',
    amount: Number(txn.amount ?? 0),
    accountId: txn.accountId ?? null,
    transferInAccountId: txn.transferInAccountId ?? null,
    transferInAmount: txn.transferInAmount != null ? Number(txn.transferInAmount) : null,
  }, operatorId);
  return { deleted: true, id };
}

export async function createTransactionMatch(transactionId: number, body: JsonBody) {
  ensureExistingResource(await getTransactionById(transactionId), 'transactionId', transactionId);
  if (!body.externalTransactionId) {
    throw new AppError(400, 'invalid_request', { field: 'externalTransactionId', reason: 'required' });
  }
  return await createMatchRecord(transactionId, Number(body.externalTransactionId), (body.matchStatus as string) || 'confirmed');
}

export async function updateTransactionMatch(transactionId: number, matchId: number, body: JsonBody) {
  ensureExistingResource(await getTransactionById(transactionId), 'transactionId', transactionId);
  const match = ensureExistingResource(await getMatchById(matchId), 'matchId', matchId);
  if (match.transactionId !== transactionId) {
    throw new AppError(400, 'invalid_request', { field: 'matchId', reason: 'does_not_belong_to_transaction' });
  }
  await updateMatchRecord(matchId, {
    externalTransactionId: body.externalTransactionId ? Number(body.externalTransactionId) : undefined,
    matchStatus: body.matchStatus as string | undefined,
  });
  return await getMatchById(matchId);
}

export async function deleteTransactionMatch(transactionId: number, matchId: number) {
  ensureExistingResource(await getTransactionById(transactionId), 'transactionId', transactionId);
  const match = ensureExistingResource(await getMatchById(matchId), 'matchId', matchId);
  if (match.transactionId !== transactionId) {
    throw new AppError(400, 'invalid_request', { field: 'matchId', reason: 'does_not_belong_to_transaction' });
  }
  await deleteMatchRecord(matchId);
  return { deleted: true, id: matchId };
}

export async function getImportBatches(query: JsonBody = {}) {
  const { page, pageSize } = getListPagination(query);
  return await listImportBatches(getListFilters(query), page, pageSize);
}

export async function getImportBatchDetail(id: number) {
  const batch = ensureExistingResource(await getImportBatchById(id), 'importBatchId', id);
  const rows = await listExternalTransactionsByBatchId(id);
  return { batch, rows };
}

export async function createImportBatch(body: JsonBody) {
  if (!body.fileName) {
    throw new AppError(400, 'invalid_request', { field: 'fileName', reason: 'required' });
  }

  return await createImportBatchRecord({
    batchNo: (body.batchNo as string) || `IMP-${Date.now()}`,
    sourceType: (body.sourceType as string) || 'bank',
    fileName: body.fileName as string,
    importedBy: (body.importedBy as string) || null,
    status: (body.status as string) || 'draft',
  });
}

export async function addImportBatchRows(batchId: number, body: JsonBody) {
  const batch = ensureExistingResource(await getImportBatchById(batchId), 'importBatchId', batchId);
  if (!Array.isArray(body.rows) || !body.rows.length) {
    throw new AppError(400, 'invalid_request', { field: 'rows', reason: 'must_be_non_empty_array' });
  }
  const inserted = await createExternalTransactionRows(batchId, body.rows);
  return { batchId: batch.id, batchNo: batch.batchNo, insertedCount: inserted.length, rows: inserted };
}

export async function updateBatchStatus(batchId: number, body: JsonBody) {
  ensureExistingResource(await getImportBatchById(batchId), 'importBatchId', batchId);
  const validStatuses = ['draft', 'pending_confirm', 'partially_confirmed', 'confirmed', 'failed'];
  if (!body.status || !validStatuses.includes(body.status as string)) {
    throw new AppError(400, 'invalid_request', { field: 'status', reason: 'invalid_value', allowed: validStatuses });
  }
  return await updateImportBatchStatus(batchId, body.status as string);
}

export async function getExternalTransactionDetail(id: number) {
  return ensureExistingResource(await getExternalTransactionById(id), 'externalTransactionId', id);
}

export async function updateExternalTransactionStatus(id: number, body: JsonBody) {
  ensureExistingResource(await getExternalTransactionById(id), 'externalTransactionId', id);
  if (!body.matchStatus) {
    throw new AppError(400, 'invalid_request', { field: 'matchStatus', reason: 'required' });
  }
  return await updateExternalTransactionMatchStatus(id, body.matchStatus as string);
}

export async function getExternalTransactions(query: JsonBody = {}) {
  const { page, pageSize } = getListPagination(query);
  return await listExternalTransactions(getListFilters(query), page, pageSize);
}

export async function getMatches(query: JsonBody = {}) {
  const { page, pageSize } = getListPagination(query);
  return await listMatches(getListFilters(query), page, pageSize);
}

// ── New Phase 4 service functions ──

export async function updateAccount(id: number, body: JsonBody) {
  ensureExistingResource(await getAccountById(id), 'accountId', id);
  return await updateAccountRecord(id, body);
}

export async function getCategoryDetail(id: number) {
  return ensureExistingResource(await getCategoryById(id), 'categoryId', id);
}

export async function updateCategory(id: number, body: JsonBody) {
  ensureExistingResource(await getCategoryById(id), 'categoryId', id);
  await updateCategoryRecord(id, body);
  return await getCategoryById(id);
}

export async function batchCreateTransactionsSvc(body: JsonBody) {
  if (!Array.isArray(body.transactions) || !body.transactions.length) {
    throw new AppError(400, 'invalid_request', { field: 'transactions', reason: 'must_be_non_empty_array' });
  }
  return await batchCreateRepo(body.transactions);
}

export async function monthlySummary(query: JsonBody = {}) {
  const year = query.year ? Number(query.year) : undefined;
  return await getMonthlySummaryRepo(year);
}

export async function counterpartySuggest(query: JsonBody = {}) {
  const q = query.q ? String(query.q).trim() : '';
  if (!q) return [];
  return await getDistinctCounterparties(q, 10);
}

export async function getExchangeRateSvc(query: JsonBody = {}) {
  const sourceCurrency = String(query.sourceCurrency || query.source_currency || 'USD');
  const targetCurrency = String(query.targetCurrency || query.target_currency || 'CNY');
  const rateDate = String(query.rateDate || query.rate_date || new Date().toISOString().slice(0, 10));
  return await getExchangeRateRepo(sourceCurrency, targetCurrency, rateDate);
}

export async function globalStats() {
  return await getGlobalStatsRepo();
}

// ══════════════════════════════════════
// Ledger Projects Service (T-2.1)
// ══════════════════════════════════════
export async function getLedgerProjectsList(status?: string) {
  const list = await listLedgerProjects(status);
  const stats = await getProjectTransactionStats();
  return list.map((p) => ({ ...p, stats: stats[p.id] || { income: 0, expense: 0, count: 0 } }));
}

export async function createProject(body: JsonBody) {
  if (!body.name) throw new AppError(400, 'invalid_request', { field: 'name', reason: 'required' });
  let depth = 1;
  if (body.parentId) {
    const parent = ensureExistingResource(await getLedgerProjectById(Number(body.parentId)), 'parentId', Number(body.parentId));
    depth = parent.depth + 1;
    if (depth > 3) throw new AppError(400, 'invalid_request', { field: 'parentId', reason: 'max_depth_3' });
  }
  return await createProjectRepo({ name: body.name as string, description: (body.description as string) || null, parentId: body.parentId ? Number(body.parentId) : null, depth, sortOrder: Number(body.sortOrder || 0), status: (body.status as string) || 'active' });
}

export async function updateProject(id: number, body: JsonBody) {
  ensureExistingResource(await getLedgerProjectById(id), 'projectId', id);
  return await updateProjectRepo(id, body as any);
}

export async function deleteProject(id: number) {
  ensureExistingResource(await getLedgerProjectById(id), 'projectId', id);
  // Cascade: self + children + grandchildren
  const childIds = await getChildProjectIds(id);
  let allIds = [id, ...childIds];
  for (const cid of childIds) {
    const grandChildren = await getChildProjectIds(cid);
    allIds = allIds.concat(grandChildren);
  }
  await deleteLedgerProjectCascade(allIds);
  return { deleted: true, ids: allIds };
}

export async function sortProjects(body: JsonBody) {
  if (!Array.isArray(body.items)) throw new AppError(400, 'invalid_request', { field: 'items', reason: 'must_be_array' });
  await batchUpdateProjectSort(body.items as any);
  return { updated: true };
}

// ══════════════════════════════════════
// Ledger Counterparties Service (T-2.2)
// ══════════════════════════════════════
export async function getLedgerCounterpartiesList(status?: string) {
  const list = await listLedgerCounterparties(status);
  const stats = await getCounterpartyTransactionStats();
  return list.map((c) => ({ ...c, stats: stats[c.id] || { income: 0, expense: 0, count: 0 } }));
}

export async function createCounterparty(body: JsonBody) {
  if (!body.name) throw new AppError(400, 'invalid_request', { field: 'name', reason: 'required' });
  return await createCounterpartyRepo({ name: body.name as string, description: (body.description as string) || null, sortOrder: Number(body.sortOrder || 0) });
}

export async function updateCounterparty(id: number, body: JsonBody) {
  ensureExistingResource(await getLedgerCounterpartyById(id), 'counterpartyId', id);
  return await updateCounterpartyRepo(id, body as any);
}

export async function deleteCounterparty(id: number) {
  ensureExistingResource(await getLedgerCounterpartyById(id), 'counterpartyId', id);
  await deleteCounterpartyRepo(id);
  return { deleted: true, id };
}

export async function sortCounterparties(body: JsonBody) {
  if (!Array.isArray(body.items)) throw new AppError(400, 'invalid_request', { field: 'items', reason: 'must_be_array' });
  await batchUpdateCounterpartySort(body.items as any);
  return { updated: true };
}

// ══════════════════════════════════════
// Account soft-delete + sort (T-2.3)
// ══════════════════════════════════════
export async function deleteAccountSvc(id: number) {
  ensureExistingResource(await getAccountById(id), 'accountId', id);
  await softDeleteAccount(id);
  return { deleted: true, id };
}

export async function sortAccounts(body: JsonBody) {
  if (!Array.isArray(body.items)) throw new AppError(400, 'invalid_request', { field: 'items', reason: 'must_be_array' });
  await batchUpdateAccountSort(body.items as any);
  return { updated: true };
}

// ══════════════════════════════════════
// Category delete + sort (T-2.4)
// ══════════════════════════════════════
export async function deleteCategorySvc(id: number) {
  ensureExistingResource(await getCategoryById(id), 'categoryId', id);
  const deletedIds = await deleteCategoryRepo(id);
  return { deleted: true, ids: deletedIds };
}

export async function sortCategories(body: JsonBody) {
  if (!Array.isArray(body.items)) throw new AppError(400, 'invalid_request', { field: 'items', reason: 'must_be_array' });
  await batchUpdateCategorySort(body.items as any);
  return { updated: true };
}
