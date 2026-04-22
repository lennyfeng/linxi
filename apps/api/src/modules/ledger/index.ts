import { readJsonBody } from '../../common/http.js';
import { getIdFromPath } from '../../common/route.js';
import { sendJson } from '../../common/send.js';
import type { RouteHandler } from '../../common/types.js';
import { syncExchangeRates, syncExchangeRatesBulk } from '../../external/lingxing/sync-exchange-rates.js';
import { syncLemonCloudJournals } from '../../external/lemoncloud/sync-journals.js';
import { createAirwallexBatch, stageAirwallexRows, dedupCheck, confirmImport } from './import-airwallex.js';
import {
  getLedgerOverview,
  getCategoryBreakdown,
  getAccountBreakdown,
  getProjectBreakdown,
  getCounterpartyBreakdown,
  getMonthlyTrend,
  getMemberBreakdown,
} from './service/ledger-reports.service.js';
import {
  createAccount,
  createCategory,
  createImportBatch,
  createTransaction,
  createTransactionMatch,
  deleteTransaction,
  deleteTransactionMatch,
  getAccountDetail,
  getAccounts,
  getCategories,
  getCategoryDetail,
  getExternalTransactions,
  getImportBatchDetail,
  getImportBatches,
  getMatches,
  getTransactionAttachments,
  getTransactionDetail,
  getTransactions,
  updateAccount,
  updateCategory,
  updateTransaction,
  updateTransactionMatch,
  uploadTransactionAttachment,
  addImportBatchRows,
  updateBatchStatus,
  getExternalTransactionDetail,
  updateExternalTransactionStatus,
  batchCreateTransactionsSvc,
  monthlySummary,
  counterpartySuggest,
  getExchangeRateSvc,
  globalStats,
  getLedgerProjectsList,
  createProject,
  updateProject,
  deleteProject,
  sortProjects,
  getLedgerCounterpartiesList,
  createCounterparty,
  updateCounterparty,
  deleteCounterparty,
  sortCounterparties,
  deleteAccountSvc,
  sortAccounts,
  deleteCategorySvc,
  sortCategories,
} from './service/ledger.service.js';

export const ledgerModule = {
  name: 'ledger',
  description: 'Accounts, transactions, imports and matching',
  routes: [
    '/ledger/accounts',
    '/ledger/categories',
    '/ledger/transactions',
    '/ledger/imports',
    '/ledger/external-transactions',
    '/ledger/matches',
    '/ledger/transactions/:id/attachments',
    '/ledger/overview',
    '/ledger/reports',
  ],
};

export const handleLedgerRoutes: RouteHandler = async (req, res, url, ctx) => {
  const responseOptions = { requestId: ctx.requestId };

  if (req.method === 'GET' && url.pathname === '/ledger/stats') {
    sendJson(res, await globalStats(), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/ledger/overview') {
    sendJson(res, await getLedgerOverview(), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/ledger/reports/category-breakdown') {
    const startDate = url.searchParams.get('startDate') || '2000-01-01';
    const endDate = url.searchParams.get('endDate') || '2099-12-31';
    const type = url.searchParams.get('type') || 'expense';
    sendJson(res, await getCategoryBreakdown(startDate, endDate, type), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/ledger/reports/account-breakdown') {
    const startDate = url.searchParams.get('startDate') || '2000-01-01';
    const endDate = url.searchParams.get('endDate') || '2099-12-31';
    sendJson(res, await getAccountBreakdown(startDate, endDate), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/ledger/reports/project-breakdown') {
    const startDate = url.searchParams.get('startDate') || '2000-01-01';
    const endDate = url.searchParams.get('endDate') || '2099-12-31';
    sendJson(res, await getProjectBreakdown(startDate, endDate), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/ledger/reports/counterparty-breakdown') {
    const startDate = url.searchParams.get('startDate') || '2000-01-01';
    const endDate = url.searchParams.get('endDate') || '2099-12-31';
    sendJson(res, await getCounterpartyBreakdown(startDate, endDate), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/ledger/reports/monthly-trend') {
    const year = Number(url.searchParams.get('year')) || new Date().getFullYear();
    sendJson(res, await getMonthlyTrend(year), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/ledger/reports/member-breakdown') {
    const startDate = url.searchParams.get('startDate') || '2000-01-01';
    const endDate = url.searchParams.get('endDate') || '2099-12-31';
    sendJson(res, await getMemberBreakdown(startDate, endDate), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/ledger/accounts') {
    sendJson(res, await getAccounts(Object.fromEntries(url.searchParams.entries())), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/ledger/accounts/')) {
    const id = getIdFromPath(url.pathname, '/ledger/accounts/');
    sendJson(res, await getAccountDetail(id), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/ledger/accounts') {
    const body = await readJsonBody(req);
    sendJson(res, await createAccount(body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'PUT' && url.pathname.startsWith('/ledger/accounts/')) {
    const id = getIdFromPath(url.pathname, '/ledger/accounts/');
    const body = await readJsonBody(req);
    sendJson(res, await updateAccount(id, body), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/ledger/categories') {
    sendJson(res, await getCategories(Object.fromEntries(url.searchParams.entries())), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/ledger/categories') {
    const body = await readJsonBody(req);
    sendJson(res, await createCategory(body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/ledger/categories/')) {
    const id = getIdFromPath(url.pathname, '/ledger/categories/');
    sendJson(res, await getCategoryDetail(id), responseOptions);
    return true;
  }

  if (req.method === 'PUT' && url.pathname.startsWith('/ledger/categories/')) {
    const id = getIdFromPath(url.pathname, '/ledger/categories/');
    const body = await readJsonBody(req);
    sendJson(res, await updateCategory(id, body), responseOptions);
    return true;
  }

  // --- Batch, summary, counterparty, exchange-rate ---
  if (req.method === 'POST' && url.pathname === '/ledger/transactions/batch') {
    const body = await readJsonBody(req);
    if (Array.isArray(body.transactions)) {
      body.transactions.forEach((t: Record<string, unknown>) => { t.createdBy = t.createdBy || ctx.operator?.id || null; });
    }
    sendJson(res, await batchCreateTransactionsSvc(body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/ledger/monthly-summary') {
    sendJson(res, await monthlySummary(Object.fromEntries(url.searchParams.entries())), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/ledger/counterparties') {
    sendJson(res, await counterpartySuggest(Object.fromEntries(url.searchParams.entries())), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/ledger/exchange-rate') {
    sendJson(res, await getExchangeRateSvc(Object.fromEntries(url.searchParams.entries())), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/ledger/transactions') {
    sendJson(res, await getTransactions(Object.fromEntries(url.searchParams.entries())), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname.endsWith('/attachments') && url.pathname.startsWith('/ledger/transactions/')) {
    const id = getIdFromPath(url.pathname, '/ledger/transactions/');
    sendJson(res, await getTransactionAttachments(id), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname.endsWith('/attachments') && url.pathname.startsWith('/ledger/transactions/')) {
    const id = getIdFromPath(url.pathname, '/ledger/transactions/');
    const body = await readJsonBody(req);
    sendJson(res, await uploadTransactionAttachment(id, body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  // --- Matches CRUD (must come before generic GET /ledger/transactions/:id) ---
  if (req.method === 'POST' && url.pathname.match(/^\/ledger\/transactions\/\d+\/matches$/)) {
    const id = getIdFromPath(url.pathname, '/ledger/transactions/');
    const body = await readJsonBody(req);
    sendJson(res, await createTransactionMatch(id, body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'PUT' && url.pathname.match(/^\/ledger\/transactions\/\d+\/matches\/\d+$/)) {
    const parts = url.pathname.split('/');
    const transactionId = Number(parts[3]);
    const matchId = Number(parts[5]);
    const body = await readJsonBody(req);
    sendJson(res, await updateTransactionMatch(transactionId, matchId, body), responseOptions);
    return true;
  }

  if (req.method === 'DELETE' && url.pathname.match(/^\/ledger\/transactions\/\d+\/matches\/\d+$/)) {
    const parts = url.pathname.split('/');
    const transactionId = Number(parts[3]);
    const matchId = Number(parts[5]);
    sendJson(res, await deleteTransactionMatch(transactionId, matchId), responseOptions);
    return true;
  }

  // --- Transaction update/delete ---
  if (req.method === 'PUT' && url.pathname.startsWith('/ledger/transactions/')) {
    const id = getIdFromPath(url.pathname, '/ledger/transactions/');
    const body = await readJsonBody(req);
    sendJson(res, await updateTransaction(id, body), responseOptions);
    return true;
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/ledger/transactions/')) {
    const id = getIdFromPath(url.pathname, '/ledger/transactions/');
    sendJson(res, await deleteTransaction(id), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/ledger/transactions/')) {
    const id = getIdFromPath(url.pathname, '/ledger/transactions/');
    sendJson(res, await getTransactionDetail(id), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/ledger/transactions') {
    const body = await readJsonBody(req);
    body.createdBy = body.createdBy || ctx.operator?.id || null;
    sendJson(res, await createTransaction(body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/ledger/imports') {
    sendJson(res, await getImportBatches(Object.fromEntries(url.searchParams.entries())), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/ledger/imports/')) {
    const id = getIdFromPath(url.pathname, '/ledger/imports/');
    sendJson(res, await getImportBatchDetail(id), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/ledger/imports') {
    const body = await readJsonBody(req);
    sendJson(res, await createImportBatch(body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  // --- Import batch sub-routes ---
  if (req.method === 'POST' && url.pathname.match(/^\/ledger\/imports\/\d+\/rows$/)) {
    const id = getIdFromPath(url.pathname, '/ledger/imports/');
    const body = await readJsonBody(req);
    sendJson(res, await addImportBatchRows(id, body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'PUT' && url.pathname.startsWith('/ledger/imports/')) {
    const id = getIdFromPath(url.pathname, '/ledger/imports/');
    const body = await readJsonBody(req);
    sendJson(res, await updateBatchStatus(id, body), responseOptions);
    return true;
  }

  // --- External transactions ---
  if (req.method === 'GET' && url.pathname === '/ledger/external-transactions') {
    sendJson(res, await getExternalTransactions(Object.fromEntries(url.searchParams.entries())), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/ledger/external-transactions/')) {
    const id = getIdFromPath(url.pathname, '/ledger/external-transactions/');
    sendJson(res, await getExternalTransactionDetail(id), responseOptions);
    return true;
  }

  if (req.method === 'PUT' && url.pathname.startsWith('/ledger/external-transactions/')) {
    const id = getIdFromPath(url.pathname, '/ledger/external-transactions/');
    const body = await readJsonBody(req);
    sendJson(res, await updateExternalTransactionStatus(id, body), responseOptions);
    return true;
  }

  // --- Sync exchange rates ---
  if (req.method === 'POST' && url.pathname === '/ledger/sync-exchange-rates') {
    const body = await readJsonBody(req) as { month?: string; bulk?: boolean; months?: number };
    if (body.bulk) {
      const result = await syncExchangeRatesBulk(body.months || 12);
      sendJson(res, result, responseOptions);
    } else {
      const result = await syncExchangeRates(body.month || undefined);
      sendJson(res, result, responseOptions);
    }
    return true;
  }

  // --- Airwallex import workflow ---
  if (req.method === 'POST' && url.pathname === '/ledger/import-airwallex/batch') {
    const body = await readJsonBody(req) as { fileName: string; uploadedBy: number };
    const result = await createAirwallexBatch(body.fileName, body.uploadedBy || 0);
    sendJson(res, result, { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'POST' && url.pathname.match(/^\/ledger\/import-airwallex\/\d+\/stage$/)) {
    const id = Number(url.pathname.split('/')[3]);
    const body = await readJsonBody(req) as { rows: any[] };
    const result = await stageAirwallexRows(id, body.rows || []);
    sendJson(res, result, { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'GET' && url.pathname.match(/^\/ledger\/import-airwallex\/\d+\/dedup$/)) {
    const id = Number(url.pathname.split('/')[3]);
    const result = await dedupCheck(id);
    sendJson(res, result, responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname.match(/^\/ledger\/import-airwallex\/\d+\/confirm$/)) {
    const id = Number(url.pathname.split('/')[3]);
    const body = await readJsonBody(req) as { selectedIds: number[]; accountId: number; userId: number };
    const result = await confirmImport(id, body.selectedIds, body.accountId, body.userId);
    sendJson(res, result, responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/ledger/sync-lemoncloud-journals') {
    const body = await readJsonBody(req) as { startDate: string; endDate: string };
    if (!body.startDate || !body.endDate) {
      sendJson(res, { error: 'startDate and endDate are required' }, { ...responseOptions, statusCode: 400 });
      return true;
    }
    const result = await syncLemonCloudJournals(body.startDate, body.endDate);
    sendJson(res, result, responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/ledger/matches') {
    sendJson(res, await getMatches(Object.fromEntries(url.searchParams.entries())), responseOptions);
    return true;
  }

  // ── Ledger Projects ──
  if (req.method === 'GET' && url.pathname === '/ledger/projects') {
    const status = url.searchParams.get('status') || undefined;
    sendJson(res, await getLedgerProjectsList(status), responseOptions);
    return true;
  }
  if (req.method === 'POST' && url.pathname === '/ledger/projects') {
    sendJson(res, await createProject(await readJsonBody(req)), { ...responseOptions, statusCode: 201 });
    return true;
  }
  const projectIdMatch = url.pathname.match(/^\/ledger\/projects\/(\d+)$/);
  if (projectIdMatch) {
    const projectId = Number(projectIdMatch[1]);
    if (req.method === 'PUT') {
      sendJson(res, await updateProject(projectId, await readJsonBody(req)), responseOptions);
      return true;
    }
    if (req.method === 'DELETE') {
      sendJson(res, await deleteProject(projectId), responseOptions);
      return true;
    }
  }
  if (req.method === 'PUT' && url.pathname === '/ledger/projects/sort') {
    sendJson(res, await sortProjects(await readJsonBody(req)), responseOptions);
    return true;
  }

  // ── Ledger Counterparties (managed) ──
  if (req.method === 'GET' && url.pathname === '/ledger/counterparties/managed') {
    const status = url.searchParams.get('status') || undefined;
    sendJson(res, await getLedgerCounterpartiesList(status), responseOptions);
    return true;
  }
  if (req.method === 'POST' && url.pathname === '/ledger/counterparties/managed') {
    sendJson(res, await createCounterparty(await readJsonBody(req)), { ...responseOptions, statusCode: 201 });
    return true;
  }
  const cpIdMatch = url.pathname.match(/^\/ledger\/counterparties\/managed\/(\d+)$/);
  if (cpIdMatch) {
    const cpId = Number(cpIdMatch[1]);
    if (req.method === 'PUT') {
      sendJson(res, await updateCounterparty(cpId, await readJsonBody(req)), responseOptions);
      return true;
    }
    if (req.method === 'DELETE') {
      sendJson(res, await deleteCounterparty(cpId), responseOptions);
      return true;
    }
  }
  if (req.method === 'PUT' && url.pathname === '/ledger/counterparties/managed/sort') {
    sendJson(res, await sortCounterparties(await readJsonBody(req)), responseOptions);
    return true;
  }

  // ── Account delete + sort ──
  const acctDeleteMatch = url.pathname.match(/^\/ledger\/accounts\/(\d+)$/);
  if (req.method === 'DELETE' && acctDeleteMatch) {
    sendJson(res, await deleteAccountSvc(Number(acctDeleteMatch[1])), responseOptions);
    return true;
  }
  if (req.method === 'PUT' && url.pathname === '/ledger/accounts/sort') {
    sendJson(res, await sortAccounts(await readJsonBody(req)), responseOptions);
    return true;
  }

  // ── Category delete + sort ──
  const catDeleteMatch = url.pathname.match(/^\/ledger\/categories\/(\d+)$/);
  if (req.method === 'DELETE' && catDeleteMatch) {
    sendJson(res, await deleteCategorySvc(Number(catDeleteMatch[1])), responseOptions);
    return true;
  }
  if (req.method === 'PUT' && url.pathname === '/ledger/categories/sort') {
    sendJson(res, await sortCategories(await readJsonBody(req)), responseOptions);
    return true;
  }

  return false;
};
