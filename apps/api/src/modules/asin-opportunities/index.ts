import { getIdFromPath } from '../../common/route.js';
import { readJsonBody } from '../../common/http.js';
import { sendJson } from '../../common/send.js';
import { requirePermission } from '../../common/auth-middleware.js';
import type { RouteHandler } from '../../common/types.js';
import {
  createBatchWithAudit,
  getBatchDecisionHistory,
  listBatchDecisionActions,
  createBatchDecisionActionsWithAudit,
  updateBatchDecisionActionStatusWithAudit,
  updateBatchMetaWithAudit,
  getBatchMetrics,
  getBatchById,
  exportBatchesCsv,
  exportBatchItemsCsv,
  listBatches,
  listBatchItems,
  getItemReport,
  createProjectFromAsinItemWithAudit,
  retryBatchFailedItemsWithAudit,
  retryItemAnalysisWithAudit,
  makeDecisionWithAudit,
  saveDesignEvaluationWithAudit,
  reviewDesignEvaluationWithAudit,
  saveSampleEvaluationWithAudit,
  getHealthTrend,
  listHealthAlertConfigs,
  addHealthAlertConfig,
  listBatchAlerts,
  listSavedViews,
  createSavedView,
  updateSavedView,
  deleteSavedView,
} from './service/asin-opportunities.service.js';
import { isRealAnalysisAvailable } from '../../integrations/sellersprite/scoring.js';

export const asinOpportunityModule = {
  name: 'asin-opportunities',
  description: 'ASIN opportunity analysis workflow',
  routes: [
    '/asin-opportunities/batches',
    '/asin-opportunities/batches/export',
    '/asin-opportunities/batches/:id',
    '/asin-opportunities/batches/:id/meta',
    '/asin-opportunities/batches/:id/metrics',
    '/asin-opportunities/batches/:id/decision-history',
    '/asin-opportunities/batch-decision-actions',
    '/asin-opportunities/batch-decision-actions/:id/status',
    '/asin-opportunities/batches/:id/items',
    '/asin-opportunities/batches/:id/items/export',
    '/asin-opportunities/items/:id/report',
    '/asin-opportunities/items/:id/create-project',
    '/asin-opportunities/items/:id/decision',
    '/asin-opportunities/items/:id/design-evaluation',
    '/asin-opportunities/items/:id/design-review',
    '/asin-opportunities/items/:id/sample-evaluation',
    '/asin-opportunities/items/:id/retry-analysis',
    '/asin-opportunities/batches/:id/retry-failed',
    '/asin-opportunities/health-trend',
    '/asin-opportunities/health-alert-configs',
    '/asin-opportunities/batch-alerts',
    '/asin-opportunities/saved-views',
    '/asin-opportunities/saved-views/:id',
    '/asin-opportunities/integration-status',
  ],
};

export const handleAsinOpportunityRoutes: RouteHandler = async (req, res, url, ctx) => {
  const responseOptions = { requestId: ctx.requestId };

  if (req.method === 'GET' && url.pathname === '/asin-opportunities/integration-status') {
    sendJson(res, { ok: true, data: { sellerSpriteConfigured: isRealAnalysisAvailable() } }, responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/asin-opportunities/batches') {
    sendJson(res, await listBatches(url.searchParams), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/asin-opportunities/batches/export') {
    const csv = await exportBatchesCsv(url.searchParams);
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': 'attachment; filename="asin-opportunity-batches.csv"',
      'X-Request-Id': ctx.requestId,
    });
    res.end(csv);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/asin-opportunities/batches') {
    const body = await readJsonBody(req);
    sendJson(res, await createBatchWithAudit(ctx, body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'GET' && url.pathname.match(/^\/asin-opportunities\/batches\/\d+$/)) {
    const id = getIdFromPath(url.pathname, '/asin-opportunities/batches/');
    sendJson(res, await getBatchById(id), responseOptions);
    return true;
  }

  if (req.method === 'PATCH' && url.pathname.match(/^\/asin-opportunities\/batches\/\d+\/meta$/)) {
    requirePermission('asin-opportunities.decision.write')(ctx);
    const id = getIdFromPath(url.pathname, '/asin-opportunities/batches/');
    const body = await readJsonBody(req);
    sendJson(res, await updateBatchMetaWithAudit(ctx, id, body), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname.match(/^\/asin-opportunities\/batches\/\d+\/metrics$/)) {
    const id = getIdFromPath(url.pathname, '/asin-opportunities/batches/');
    sendJson(res, await getBatchMetrics(id), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname.match(/^\/asin-opportunities\/batches\/\d+\/decision-history$/)) {
    const id = getIdFromPath(url.pathname, '/asin-opportunities/batches/');
    sendJson(res, await getBatchDecisionHistory(id, url.searchParams), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/asin-opportunities/batch-decision-actions') {
    sendJson(res, await listBatchDecisionActions(url.searchParams), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/asin-opportunities/batch-decision-actions') {
    requirePermission('asin-opportunities.decision.write')(ctx);
    const body = await readJsonBody(req);
    sendJson(res, await createBatchDecisionActionsWithAudit(ctx, body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'PATCH' && url.pathname.match(/^\/asin-opportunities\/batch-decision-actions\/\d+\/status$/)) {
    requirePermission('asin-opportunities.decision.write')(ctx);
    const id = getIdFromPath(url.pathname, '/asin-opportunities/batch-decision-actions/');
    const body = await readJsonBody(req);
    sendJson(res, await updateBatchDecisionActionStatusWithAudit(ctx, id, body), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname.match(/^\/asin-opportunities\/batches\/\d+\/items$/)) {
    const id = getIdFromPath(url.pathname, '/asin-opportunities/batches/');
    sendJson(res, await listBatchItems(id, url.searchParams), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname.match(/^\/asin-opportunities\/batches\/\d+\/items\/export$/)) {
    const id = getIdFromPath(url.pathname, '/asin-opportunities/batches/');
    const csv = await exportBatchItemsCsv(id, url.searchParams);
    res.writeHead(200, {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="asin-opportunity-batch-${id}.csv"`,
      'X-Request-Id': ctx.requestId,
    });
    res.end(csv);
    return true;
  }

  if (req.method === 'GET' && url.pathname.match(/^\/asin-opportunities\/items\/\d+\/report$/)) {
    const id = getIdFromPath(url.pathname, '/asin-opportunities/items/');
    sendJson(res, await getItemReport(id), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname.match(/^\/asin-opportunities\/items\/\d+\/create-project$/)) {
    requirePermission('product-dev.projects.write')(ctx);
    const id = getIdFromPath(url.pathname, '/asin-opportunities/items/');
    sendJson(res, await createProjectFromAsinItemWithAudit(ctx, id), { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'POST' && url.pathname.match(/^\/asin-opportunities\/items\/\d+\/decision$/)) {
    requirePermission('asin-opportunities.decision.write')(ctx);
    const id = getIdFromPath(url.pathname, '/asin-opportunities/items/');
    const body = await readJsonBody(req);
    sendJson(res, await makeDecisionWithAudit(ctx, id, body), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname.match(/^\/asin-opportunities\/items\/\d+\/design-evaluation$/)) {
    requirePermission('asin-opportunities.design.submit')(ctx);
    const id = getIdFromPath(url.pathname, '/asin-opportunities/items/');
    const body = await readJsonBody(req);
    sendJson(res, await saveDesignEvaluationWithAudit(ctx, id, body), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname.match(/^\/asin-opportunities\/items\/\d+\/design-review$/)) {
    requirePermission('asin-opportunities.design.review')(ctx);
    const id = getIdFromPath(url.pathname, '/asin-opportunities/items/');
    const body = await readJsonBody(req);
    sendJson(res, await reviewDesignEvaluationWithAudit(ctx, id, body), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname.match(/^\/asin-opportunities\/items\/\d+\/sample-evaluation$/)) {
    requirePermission('asin-opportunities.sample.submit')(ctx);
    const id = getIdFromPath(url.pathname, '/asin-opportunities/items/');
    const body = await readJsonBody(req);
    sendJson(res, await saveSampleEvaluationWithAudit(ctx, id, body), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname.match(/^\/asin-opportunities\/items\/\d+\/retry-analysis$/)) {
    requirePermission('asin-opportunities.analysis.retry')(ctx);
    const id = getIdFromPath(url.pathname, '/asin-opportunities/items/');
    sendJson(res, await retryItemAnalysisWithAudit(ctx, id), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname.match(/^\/asin-opportunities\/batches\/\d+\/retry-failed$/)) {
    requirePermission('asin-opportunities.analysis.retry')(ctx);
    const id = getIdFromPath(url.pathname, '/asin-opportunities/batches/');
    sendJson(res, await retryBatchFailedItemsWithAudit(ctx, id), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/asin-opportunities/health-trend') {
    sendJson(res, await getHealthTrend(ctx, url.searchParams), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/asin-opportunities/health-alert-configs') {
    sendJson(res, await listHealthAlertConfigs(ctx, url.searchParams), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/asin-opportunities/health-alert-configs') {
    const body = await readJsonBody(req);
    sendJson(res, await addHealthAlertConfig(ctx, body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/asin-opportunities/batch-alerts') {
    sendJson(res, await listBatchAlerts(ctx, url.searchParams), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/asin-opportunities/saved-views') {
    sendJson(res, await listSavedViews(ctx, url.searchParams), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/asin-opportunities/saved-views') {
    const body = await readJsonBody(req);
    sendJson(res, await createSavedView(ctx, body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'PATCH' && url.pathname.match(/^\/asin-opportunities\/saved-views\/\d+$/)) {
    const id = getIdFromPath(url.pathname, '/asin-opportunities/saved-views/');
    const body = await readJsonBody(req);
    sendJson(res, await updateSavedView(ctx, id, body), responseOptions);
    return true;
  }

  if (req.method === 'DELETE' && url.pathname.match(/^\/asin-opportunities\/saved-views\/\d+$/)) {
    const id = getIdFromPath(url.pathname, '/asin-opportunities/saved-views/');
    sendJson(res, await deleteSavedView(ctx, id), responseOptions);
    return true;
  }

  return false;
};
