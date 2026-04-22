import { readJsonBody } from '../../common/http.js';
import { getIdFromPath } from '../../common/route.js';
import { sendJson } from '../../common/send.js';
import type { RouteHandler } from '../../common/types.js';
import { syncPurchaseOrders } from '../../external/lingxing/sync-purchase-orders.js';
import { syncPaymentRequests } from '../../external/lingxing/sync-payment-requests.js';
import { syncDeliveryOrders } from '../../external/lingxing/sync-delivery-orders.js';
import { syncSuppliers } from '../../external/lingxing/sync-suppliers.js';
import { syncLemonCloudInvoices } from '../../external/lemoncloud/sync-invoices.js';
import { listSuppliers } from './repository/reconciliation.repository.js';
import {
  addInvoiceDeliveryRelation,
  addInvoicePaymentRequestRelation,
  addInvoicePurchaseRelation,
  deleteDeliveryRelation,
  deletePaymentRequestRelation,
  deletePurchaseRelation,
  getDeliveryOrderDetail,
  getDeliveryOrders,
  getInvoiceDetail,
  getInvoices,
  getPaymentRequestDetail,
  getPaymentRequests,
  getPurchaseOrderDetail,
  getPurchaseOrders,
  getRelationsOverview,
  getStatusSnapshots,
  updateDeliveryRelation,
  updatePaymentRequestRelation,
  updatePurchaseRelation,
  getMatchRecommendations,
  getReconciliationAlerts,
  getReconciliationReports,
} from './service/reconciliation.service.js';

export const reconciliationModule = {
  name: 'reconciliation',
  description: 'Purchase, payment request, delivery, invoice relations',
  routes: [
    '/reconciliation/purchase-orders',
    '/reconciliation/payment-requests',
    '/reconciliation/delivery-orders',
    '/reconciliation/invoices',
    '/reconciliation/status-snapshots',
    '/reconciliation/relations',
    '/reconciliation/relations/purchase',
    '/reconciliation/relations/payment-requests',
    '/reconciliation/relations/delivery',
    '/reconciliation/relations/purchase/:id',
    '/reconciliation/relations/payment-requests/:id',
    '/reconciliation/relations/delivery/:id',
  ],
};

export const handleReconciliationRoutes: RouteHandler = async (req, res, url, ctx) => {
  const responseOptions = { requestId: ctx.requestId };

  if (req.method === 'GET' && url.pathname === '/reconciliation/suppliers') {
    sendJson(res, await listSuppliers(), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/reconciliation/purchase-orders') {
    sendJson(res, await getPurchaseOrders(), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/reconciliation/purchase-orders/')) {
    const id = getIdFromPath(url.pathname, '/reconciliation/purchase-orders/');
    sendJson(res, await getPurchaseOrderDetail(id), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/reconciliation/payment-requests') {
    sendJson(res, await getPaymentRequests(), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/reconciliation/payment-requests/')) {
    const id = getIdFromPath(url.pathname, '/reconciliation/payment-requests/');
    sendJson(res, await getPaymentRequestDetail(id), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/reconciliation/delivery-orders') {
    sendJson(res, await getDeliveryOrders(), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/reconciliation/delivery-orders/')) {
    const id = getIdFromPath(url.pathname, '/reconciliation/delivery-orders/');
    sendJson(res, await getDeliveryOrderDetail(id), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/reconciliation/invoices') {
    sendJson(res, await getInvoices(), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/reconciliation/invoices/')) {
    const id = getIdFromPath(url.pathname, '/reconciliation/invoices/');
    sendJson(res, await getInvoiceDetail(id), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/reconciliation/status-snapshots') {
    sendJson(res, await getStatusSnapshots(), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/reconciliation/relations') {
    sendJson(res, await getRelationsOverview(), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/reconciliation/relations/purchase') {
    const body = await readJsonBody(req);
    sendJson(res, await addInvoicePurchaseRelation(body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'PUT' && url.pathname.startsWith('/reconciliation/relations/purchase/')) {
    const id = getIdFromPath(url.pathname, '/reconciliation/relations/purchase/');
    const body = await readJsonBody(req);
    sendJson(res, await updatePurchaseRelation(id, body), responseOptions);
    return true;
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/reconciliation/relations/purchase/')) {
    const id = getIdFromPath(url.pathname, '/reconciliation/relations/purchase/');
    sendJson(res, await deletePurchaseRelation(id), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/reconciliation/relations/payment-requests') {
    const body = await readJsonBody(req);
    sendJson(res, await addInvoicePaymentRequestRelation(body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'PUT' && url.pathname.startsWith('/reconciliation/relations/payment-requests/')) {
    const id = getIdFromPath(url.pathname, '/reconciliation/relations/payment-requests/');
    const body = await readJsonBody(req);
    sendJson(res, await updatePaymentRequestRelation(id, body), responseOptions);
    return true;
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/reconciliation/relations/payment-requests/')) {
    const id = getIdFromPath(url.pathname, '/reconciliation/relations/payment-requests/');
    sendJson(res, await deletePaymentRequestRelation(id), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/reconciliation/relations/delivery') {
    const body = await readJsonBody(req);
    sendJson(res, await addInvoiceDeliveryRelation(body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'PUT' && url.pathname.startsWith('/reconciliation/relations/delivery/')) {
    const id = getIdFromPath(url.pathname, '/reconciliation/relations/delivery/');
    const body = await readJsonBody(req);
    sendJson(res, await updateDeliveryRelation(id, body), responseOptions);
    return true;
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/reconciliation/relations/delivery/')) {
    const id = getIdFromPath(url.pathname, '/reconciliation/relations/delivery/');
    sendJson(res, await deleteDeliveryRelation(id), responseOptions);
    return true;
  }

  // --- Recommendations, Alerts, Reports ---
  if (req.method === 'GET' && url.pathname.match(/^\/reconciliation\/invoices\/\d+\/recommendations$/)) {
    const id = Number(url.pathname.split('/')[3]);
    sendJson(res, await getMatchRecommendations(id), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/reconciliation/alerts') {
    sendJson(res, await getReconciliationAlerts(), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname === '/reconciliation/reports') {
    sendJson(res, await getReconciliationReports(), responseOptions);
    return true;
  }

  // --- Sync endpoints ---
  if (req.method === 'POST' && url.pathname === '/reconciliation/sync/suppliers') {
    const result = await syncSuppliers();
    sendJson(res, result, responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/reconciliation/sync/purchase-orders') {
    const body = await readJsonBody(req) as { startDate?: string; endDate?: string };
    const result = await syncPurchaseOrders(body.startDate, body.endDate);
    sendJson(res, result, responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/reconciliation/sync/payment-requests') {
    const body = await readJsonBody(req) as { startDate?: string; endDate?: string };
    const result = await syncPaymentRequests(body.startDate, body.endDate);
    sendJson(res, result, responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/reconciliation/sync/delivery-orders') {
    const body = await readJsonBody(req) as { startDate?: string; endDate?: string };
    const result = await syncDeliveryOrders(body.startDate, body.endDate);
    sendJson(res, result, responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/reconciliation/sync/invoices') {
    const body = await readJsonBody(req) as { startDate: string; endDate: string };
    if (!body.startDate || !body.endDate) {
      sendJson(res, { error: 'startDate and endDate are required' }, { ...responseOptions, statusCode: 400 });
      return true;
    }
    const result = await syncLemonCloudInvoices(body.startDate, body.endDate);
    sendJson(res, result, responseOptions);
    return true;
  }

  return false;
};
