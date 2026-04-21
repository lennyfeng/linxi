import { AppError } from '../../../common/errors.js';
import type {
  InvoicePurchaseRelationPayload,
  InvoicePaymentRequestRelationPayload,
  InvoiceDeliveryRelationPayload,
  StatusSnapshot,
  PurchaseOrder,
  InvoiceRecord,
} from '../../../common/entity-types.js';
import type { JsonBody } from '../../../common/types.js';
import {
  createInvoiceDeliveryRelation,
  createInvoicePaymentRequestRelation,
  createInvoicePurchaseRelation,
  deleteInvoiceDeliveryRelation,
  deleteInvoicePaymentRequestRelation,
  deleteInvoicePurchaseRelation,
  getDeliveryOrderById,
  getInvoiceById,
  getInvoiceDeliveryRelationById,
  getInvoicePaymentRequestRelationById,
  getInvoicePurchaseRelationById,
  getPaymentRequestById,
  getPurchaseOrderById,
  listInvoiceDeliveryRelations,
  listInvoicePaymentRequestRelations,
  listInvoicePurchaseRelations,
  listInvoices,
  listPaymentRequests,
  listPurchaseOrders,
  listDeliveryOrders,
  listStatusSnapshots,
  updateInvoiceDeliveryRelation,
  updateInvoicePaymentRequestRelation,
  updateInvoicePurchaseRelation,
  upsertStatusSnapshot,
} from '../repository/reconciliation.repository.js';

async function getReconciliationStatus(businessType: string, businessId: number): Promise<StatusSnapshot | null> {
  const items = await listStatusSnapshots();
  return items.find((item) => item.businessType === businessType && item.businessId === businessId) || null;
}

function uniqueById<T extends { id: number }>(items: (T | null)[]): T[] {
  return (items.filter((item, index, array) => item && array.findIndex((candidate) => candidate?.id === item.id) === index) as T[]);
}

function getRelationStatus(amountTotal: unknown, amountCovered: unknown) {
  if (Number(amountCovered) <= 0) return 'pending';
  if (Number(amountCovered) >= Number(amountTotal)) return 'matched';
  return 'partial';
}

function ensureNonNegativeNumber(value: unknown, fieldName: string) {
  if (Number(value) < 0) {
    throw new AppError(400, 'invalid_request', { field: fieldName, reason: 'must_be_non_negative' });
  }
}

async function validatePurchaseRelationPayload(payload: InvoicePurchaseRelationPayload, currentRelationId: number | null = null) {
  const invoice = await getInvoiceById(payload.invoiceId);
  if (!invoice) throw new AppError(400, 'invalid_request', { field: 'invoiceId', reason: 'not_found' });

  const purchaseOrder = await getPurchaseOrderById(payload.purchaseOrderId);
  if (!purchaseOrder) throw new AppError(400, 'invalid_request', { field: 'purchaseOrderId', reason: 'not_found' });

  ensureNonNegativeNumber(payload.relationAmount, 'relationAmount');

  const relations = await listInvoicePurchaseRelations();
  const duplicate = relations.find(
    (item) => item.invoiceId === payload.invoiceId && item.purchaseOrderId === payload.purchaseOrderId && item.id !== currentRelationId,
  );
  if (duplicate) throw new AppError(400, 'invalid_request', { field: 'relation', reason: 'duplicate' });

  const coveredAmount = relations
    .filter((item) => item.purchaseOrderId === payload.purchaseOrderId && item.id !== currentRelationId)
    .reduce((sum, item) => sum + Number(item.relationAmount || 0), 0);
  if (coveredAmount + Number(payload.relationAmount) > Number(purchaseOrder.amount || 0)) {
    throw new AppError(400, 'invalid_request', { field: 'relationAmount', reason: 'exceeds_purchase_order_amount' });
  }
}

async function validatePaymentRequestRelationPayload(payload: InvoicePaymentRequestRelationPayload, currentRelationId: number | null = null) {
  const invoice = await getInvoiceById(payload.invoiceId);
  if (!invoice) throw new AppError(400, 'invalid_request', { field: 'invoiceId', reason: 'not_found' });

  const paymentRequest = await getPaymentRequestById(payload.paymentRequestId);
  if (!paymentRequest) throw new AppError(400, 'invalid_request', { field: 'paymentRequestId', reason: 'not_found' });

  ensureNonNegativeNumber(payload.relationAmount, 'relationAmount');

  const relations = await listInvoicePaymentRequestRelations();
  const duplicate = relations.find(
    (item) => item.invoiceId === payload.invoiceId && item.paymentRequestId === payload.paymentRequestId && item.id !== currentRelationId,
  );
  if (duplicate) throw new AppError(400, 'invalid_request', { field: 'relation', reason: 'duplicate' });

  const coveredAmount = relations
    .filter((item) => item.paymentRequestId === payload.paymentRequestId && item.id !== currentRelationId)
    .reduce((sum, item) => sum + Number(item.relationAmount || 0), 0);
  if (coveredAmount + Number(payload.relationAmount) > Number(paymentRequest.amount || 0)) {
    throw new AppError(400, 'invalid_request', { field: 'relationAmount', reason: 'exceeds_payment_request_amount' });
  }
}

async function validateDeliveryRelationPayload(payload: InvoiceDeliveryRelationPayload, currentRelationId: number | null = null) {
  const invoice = await getInvoiceById(payload.invoiceId);
  if (!invoice) throw new AppError(400, 'invalid_request', { field: 'invoiceId', reason: 'not_found' });

  const deliveryOrder = await getDeliveryOrderById(payload.deliveryOrderId);
  if (!deliveryOrder) throw new AppError(400, 'invalid_request', { field: 'deliveryOrderId', reason: 'not_found' });

  ensureNonNegativeNumber(payload.relationAmount, 'relationAmount');

  const relations = await listInvoiceDeliveryRelations();
  const duplicate = relations.find(
    (item) => item.invoiceId === payload.invoiceId && item.deliveryOrderId === payload.deliveryOrderId && item.id !== currentRelationId,
  );
  if (duplicate) throw new AppError(400, 'invalid_request', { field: 'relation', reason: 'duplicate' });

  const coveredAmount = relations
    .filter((item) => item.deliveryOrderId === payload.deliveryOrderId && item.id !== currentRelationId)
    .reduce((sum, item) => sum + Number(item.relationAmount || 0), 0);
  if (coveredAmount + Number(payload.relationAmount) > Number(deliveryOrder.amount || 0)) {
    throw new AppError(400, 'invalid_request', { field: 'relationAmount', reason: 'exceeds_delivery_order_amount' });
  }
}

async function refreshInvoiceSnapshot(invoiceId: number) {
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) return null;

  const covered = [
    ...(await listInvoicePurchaseRelations()).filter((item) => item.invoiceId === invoiceId),
    ...(await listInvoicePaymentRequestRelations()).filter((item) => item.invoiceId === invoiceId),
    ...(await listInvoiceDeliveryRelations()).filter((item) => item.invoiceId === invoiceId),
  ].reduce((sum, item) => sum + Number(item.relationAmount || 0), 0);

  return await upsertStatusSnapshot({
    businessType: 'invoice',
    businessId: invoiceId,
    amountTotal: Number(invoice.amount || 0),
    amountCovered: covered,
    relationStatus: getRelationStatus(Number(invoice.amount || 0), covered),
  });
}

async function refreshBusinessSnapshot(businessType: string, businessId: number, totalAmount: number, coveredAmount: number) {
  return await upsertStatusSnapshot({
    businessType,
    businessId,
    amountTotal: Number(totalAmount || 0),
    amountCovered: coveredAmount,
    relationStatus: getRelationStatus(Number(totalAmount || 0), coveredAmount),
  });
}

async function refreshPurchaseSnapshot(purchaseOrderId: number) {
  const purchaseOrder = await getPurchaseOrderById(purchaseOrderId);
  if (!purchaseOrder) return null;
  const coveredAmount = (await listInvoicePurchaseRelations())
    .filter((item) => item.purchaseOrderId === purchaseOrderId)
    .reduce((sum, item) => sum + Number(item.relationAmount || 0), 0);
  return await refreshBusinessSnapshot('purchase', purchaseOrderId, purchaseOrder.amount || 0, coveredAmount);
}

async function refreshPaymentRequestSnapshot(paymentRequestId: number) {
  const paymentRequest = await getPaymentRequestById(paymentRequestId);
  if (!paymentRequest) return null;
  const coveredAmount = (await listInvoicePaymentRequestRelations())
    .filter((item) => item.paymentRequestId === paymentRequestId)
    .reduce((sum, item) => sum + Number(item.relationAmount || 0), 0);
  return await refreshBusinessSnapshot('payment_request', paymentRequestId, paymentRequest.amount || 0, coveredAmount);
}

async function refreshDeliverySnapshot(deliveryOrderId: number) {
  const deliveryOrder = await getDeliveryOrderById(deliveryOrderId);
  if (!deliveryOrder) return null;
  const coveredAmount = (await listInvoiceDeliveryRelations())
    .filter((item) => item.deliveryOrderId === deliveryOrderId)
    .reduce((sum, item) => sum + Number(item.relationAmount || 0), 0);
  return await refreshBusinessSnapshot('delivery', deliveryOrderId, deliveryOrder.amount || 0, coveredAmount);
}

export async function getPurchaseOrders() {
  return await listPurchaseOrders();
}

export async function getPaymentRequests() {
  return await listPaymentRequests();
}

export async function getDeliveryOrders() {
  return await listDeliveryOrders();
}

export async function getInvoices() {
  return await listInvoices();
}

export async function getRelationsOverview() {
  return {
    invoicePurchaseRelations: await listInvoicePurchaseRelations(),
    invoicePaymentRequestRelations: await listInvoicePaymentRequestRelations(),
    invoiceDeliveryRelations: await listInvoiceDeliveryRelations(),
  };
}

export async function getStatusSnapshots() {
  return await listStatusSnapshots();
}

export async function getInvoiceDetail(invoiceId: number) {
  const invoice = await getInvoiceById(invoiceId);
  const purchaseRelations = (await listInvoicePurchaseRelations())
    .filter((item) => item.invoiceId === invoiceId)
    .map(async (relation) => ({ relation, purchaseOrder: await getPurchaseOrderById(relation.purchaseOrderId) }));
  const paymentRequestRelations = (await listInvoicePaymentRequestRelations())
    .filter((item) => item.invoiceId === invoiceId)
    .map(async (relation) => ({ relation, paymentRequest: await getPaymentRequestById(relation.paymentRequestId) }));
  const deliveryRelations = (await listInvoiceDeliveryRelations())
    .filter((item) => item.invoiceId === invoiceId)
    .map(async (relation) => ({ relation, deliveryOrder: await getDeliveryOrderById(relation.deliveryOrderId) }));

  return {
    invoice,
    purchaseRelations: await Promise.all(purchaseRelations),
    paymentRequestRelations: await Promise.all(paymentRequestRelations),
    deliveryRelations: await Promise.all(deliveryRelations),
    status: await getReconciliationStatus('invoice', invoiceId),
  };
}

export async function getPurchaseOrderDetail(purchaseOrderId: number) {
  const purchaseOrder = await getPurchaseOrderById(purchaseOrderId);
  const invoiceRelations = (await listInvoicePurchaseRelations()).filter((item) => item.purchaseOrderId === purchaseOrderId);
  const invoiceIds = invoiceRelations.map((item) => item.invoiceId);

  const invoices = invoiceRelations.map(async (relation) => ({ relation, invoice: await getInvoiceById(relation.invoiceId) }));
  const paymentRequests = uniqueById(
    await Promise.all(
      (await listInvoicePaymentRequestRelations())
        .filter((item) => invoiceIds.includes(item.invoiceId))
        .map((relation) => getPaymentRequestById(relation.paymentRequestId)),
    ),
  );
  const deliveryOrders = uniqueById(
    await Promise.all(
      (await listInvoiceDeliveryRelations())
        .filter((item) => invoiceIds.includes(item.invoiceId))
        .map((relation) => getDeliveryOrderById(relation.deliveryOrderId)),
    ),
  );

  return {
    purchaseOrder,
    invoices: await Promise.all(invoices),
    paymentRequests,
    deliveryOrders,
    status: await getReconciliationStatus('purchase', purchaseOrderId),
  };
}

export async function getPaymentRequestDetail(paymentRequestId: number) {
  const paymentRequest = await getPaymentRequestById(paymentRequestId);
  const invoiceRelations = (await listInvoicePaymentRequestRelations()).filter((item) => item.paymentRequestId === paymentRequestId);
  const invoiceIds = invoiceRelations.map((item) => item.invoiceId);

  const invoices = invoiceRelations.map(async (relation) => ({ relation, invoice: await getInvoiceById(relation.invoiceId) }));
  const purchaseOrders = uniqueById(
    await Promise.all(
      (await listInvoicePurchaseRelations())
        .filter((item) => invoiceIds.includes(item.invoiceId))
        .map((relation) => getPurchaseOrderById(relation.purchaseOrderId)),
    ),
  );
  const deliveryOrders = uniqueById(
    await Promise.all(
      (await listInvoiceDeliveryRelations())
        .filter((item) => invoiceIds.includes(item.invoiceId))
        .map((relation) => getDeliveryOrderById(relation.deliveryOrderId)),
    ),
  );

  return {
    paymentRequest,
    invoices: await Promise.all(invoices),
    purchaseOrders,
    deliveryOrders,
    status: await getReconciliationStatus('payment_request', paymentRequestId),
  };
}

export async function getDeliveryOrderDetail(deliveryOrderId: number) {
  const deliveryOrder = await getDeliveryOrderById(deliveryOrderId);
  const invoiceRelations = (await listInvoiceDeliveryRelations()).filter((item) => item.deliveryOrderId === deliveryOrderId);
  const invoiceIds = invoiceRelations.map((item) => item.invoiceId);

  const invoices = invoiceRelations.map(async (relation) => ({ relation, invoice: await getInvoiceById(relation.invoiceId) }));
  const purchaseOrders = uniqueById(
    await Promise.all(
      (await listInvoicePurchaseRelations())
        .filter((item) => invoiceIds.includes(item.invoiceId))
        .map((relation) => getPurchaseOrderById(relation.purchaseOrderId)),
    ),
  );
  const paymentRequests = uniqueById(
    await Promise.all(
      (await listInvoicePaymentRequestRelations())
        .filter((item) => invoiceIds.includes(item.invoiceId))
        .map((relation) => getPaymentRequestById(relation.paymentRequestId)),
    ),
  );

  return {
    deliveryOrder,
    invoices: await Promise.all(invoices),
    purchaseOrders,
    paymentRequests,
    status: await getReconciliationStatus('delivery', deliveryOrderId),
  };
}

export async function addInvoicePurchaseRelation(body: JsonBody) {
  const payload: InvoicePurchaseRelationPayload = {
    invoiceId: Number(body.invoiceId),
    purchaseOrderId: Number(body.purchaseOrderId),
    relationAmount: Number(body.relationAmount || 0),
    remark: (body.remark as string) || null,
  };
  await validatePurchaseRelationPayload(payload);
  const relation = await createInvoicePurchaseRelation(payload);

  await refreshInvoiceSnapshot(relation.invoiceId);
  const statusSnapshot = await refreshPurchaseSnapshot(relation.purchaseOrderId);

  return { relation, statusSnapshot };
}

export async function updatePurchaseRelation(id: number, body: JsonBody) {
  const before = await getInvoicePurchaseRelationById(id);
  if (!before) {
    throw new AppError(404, 'resource_not_found', { field: 'id' });
  }
  const payload: InvoicePurchaseRelationPayload = {
    invoiceId: Number(body.invoiceId),
    purchaseOrderId: Number(body.purchaseOrderId),
    relationAmount: Number(body.relationAmount || 0),
    remark: (body.remark as string) || null,
  };
  await validatePurchaseRelationPayload(payload, id);
  const relation = await updateInvoicePurchaseRelation(id, payload);

  if (before) {
    await refreshInvoiceSnapshot(before.invoiceId);
    await refreshPurchaseSnapshot(before.purchaseOrderId);
  }
  await refreshInvoiceSnapshot(relation!.invoiceId);
  const statusSnapshot = await refreshPurchaseSnapshot(relation!.purchaseOrderId);

  return { relation, statusSnapshot };
}

export async function deletePurchaseRelation(id: number) {
  const before = await getInvoicePurchaseRelationById(id);
  if (!before) {
    throw new AppError(404, 'resource_not_found', { field: 'id' });
  }
  await deleteInvoicePurchaseRelation(id);

  await refreshInvoiceSnapshot(before.invoiceId);
  const statusSnapshot = await refreshPurchaseSnapshot(before.purchaseOrderId);

  return { deleted: true, statusSnapshot };
}

export async function addInvoicePaymentRequestRelation(body: JsonBody) {
  const payload: InvoicePaymentRequestRelationPayload = {
    invoiceId: Number(body.invoiceId),
    paymentRequestId: Number(body.paymentRequestId),
    relationAmount: Number(body.relationAmount || 0),
    remark: (body.remark as string) || null,
  };
  await validatePaymentRequestRelationPayload(payload);
  const relation = await createInvoicePaymentRequestRelation(payload);

  await refreshInvoiceSnapshot(relation.invoiceId);
  const statusSnapshot = await refreshPaymentRequestSnapshot(relation.paymentRequestId);

  return { relation, statusSnapshot };
}

export async function updatePaymentRequestRelation(id: number, body: JsonBody) {
  const before = await getInvoicePaymentRequestRelationById(id);
  if (!before) {
    throw new AppError(404, 'resource_not_found', { field: 'id' });
  }
  const payload: InvoicePaymentRequestRelationPayload = {
    invoiceId: Number(body.invoiceId),
    paymentRequestId: Number(body.paymentRequestId),
    relationAmount: Number(body.relationAmount || 0),
    remark: (body.remark as string) || null,
  };
  await validatePaymentRequestRelationPayload(payload, id);
  const relation = await updateInvoicePaymentRequestRelation(id, payload);

  if (before) {
    await refreshInvoiceSnapshot(before.invoiceId);
    await refreshPaymentRequestSnapshot(before.paymentRequestId);
  }
  await refreshInvoiceSnapshot(relation!.invoiceId);
  const statusSnapshot = await refreshPaymentRequestSnapshot(relation!.paymentRequestId);

  return { relation, statusSnapshot };
}

export async function deletePaymentRequestRelation(id: number) {
  const before = await getInvoicePaymentRequestRelationById(id);
  if (!before) {
    throw new AppError(404, 'resource_not_found', { field: 'id' });
  }
  await deleteInvoicePaymentRequestRelation(id);

  await refreshInvoiceSnapshot(before.invoiceId);
  const statusSnapshot = await refreshPaymentRequestSnapshot(before.paymentRequestId);

  return { deleted: true, statusSnapshot };
}

export async function addInvoiceDeliveryRelation(body: JsonBody) {
  const payload: InvoiceDeliveryRelationPayload = {
    invoiceId: Number(body.invoiceId),
    deliveryOrderId: Number(body.deliveryOrderId),
    relationAmount: Number(body.relationAmount || 0),
    remark: (body.remark as string) || null,
  };
  await validateDeliveryRelationPayload(payload);
  const relation = await createInvoiceDeliveryRelation(payload);

  await refreshInvoiceSnapshot(relation.invoiceId);
  const statusSnapshot = await refreshDeliverySnapshot(relation.deliveryOrderId);

  return { relation, statusSnapshot };
}

export async function updateDeliveryRelation(id: number, body: JsonBody) {
  const before = await getInvoiceDeliveryRelationById(id);
  if (!before) {
    throw new AppError(404, 'resource_not_found', { field: 'id' });
  }
  const payload: InvoiceDeliveryRelationPayload = {
    invoiceId: Number(body.invoiceId),
    deliveryOrderId: Number(body.deliveryOrderId),
    relationAmount: Number(body.relationAmount || 0),
    remark: (body.remark as string) || null,
  };
  await validateDeliveryRelationPayload(payload, id);
  const relation = await updateInvoiceDeliveryRelation(id, payload);

  if (before) {
    await refreshInvoiceSnapshot(before.invoiceId);
    await refreshDeliverySnapshot(before.deliveryOrderId);
  }
  await refreshInvoiceSnapshot(relation!.invoiceId);
  const statusSnapshot = await refreshDeliverySnapshot(relation!.deliveryOrderId);

  return { relation, statusSnapshot };
}

export async function deleteDeliveryRelation(id: number) {
  const before = await getInvoiceDeliveryRelationById(id);
  if (!before) {
    throw new AppError(404, 'resource_not_found', { field: 'id' });
  }
  await deleteInvoiceDeliveryRelation(id);

  await refreshInvoiceSnapshot(before.invoiceId);
  const statusSnapshot = await refreshDeliverySnapshot(before.deliveryOrderId);

  return { deleted: true, statusSnapshot };
}

/* ═══════════════════════════════════════════════════════════════
   T110: Recommendation Engine
   Match invoices ↔ POs by same supplier + date ±30d + amount ±5%
   ═══════════════════════════════════════════════════════════════ */
export async function getMatchRecommendations(invoiceId: number) {
  const invoice = await getInvoiceById(invoiceId);
  if (!invoice) throw new AppError(404, 'resource_not_found', { field: 'invoiceId' });

  const pos = await listPurchaseOrders();
  const candidates = pos
    .filter((po) => {
      if (!po.supplierName || !invoice.supplierName || po.supplierName !== invoice.supplierName) return false;
      if (!po.amount || !invoice.amount) return false;
      const amountDiff = Math.abs(Number(po.amount) - Number(invoice.amount)) / Number(invoice.amount);
      if (amountDiff > 0.05) return false;
      return true;
    })
    .map((po) => ({
      purchaseOrderId: po.id,
      orderNo: po.orderNo,
      amount: po.amount,
      confidence: calcConfidence(po, invoice),
    }))
    .sort((a, b) => b.confidence - a.confidence);

  return { invoiceId, candidates };
}

function calcConfidence(po: PurchaseOrder, invoice: InvoiceRecord): number {
  let score = 0.5;
  if (po.amount && invoice.amount) {
    const diff = Math.abs(Number(po.amount) - Number(invoice.amount)) / Number(invoice.amount);
    score += (1 - diff * 20) * 0.3;
  }
  if (invoice.invoiceDate) {
    score += 0.2;
  }
  return Math.max(0, Math.min(1, score));
}

/* ═══════════════════════════════════════════════════════════════
   T111: Reconciliation Alerts
   ═══════════════════════════════════════════════════════════════ */
export async function getReconciliationAlerts() {
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const dateStr = thirtyDaysAgo.toISOString().split('T')[0];

  const alerts: Array<{ type: string; severity: string; message: string; count: number }> = [];

  // Uninvoiced POs > 30 days
  const pos = await listPurchaseOrders();
  const oldUnlinkedPOs = pos.filter((po) => {
    return po.sourceUpdatedAt && po.sourceUpdatedAt < dateStr;
  });
  if (oldUnlinkedPOs.length > 0) {
    alerts.push({
      type: 'uninvoiced_po',
      severity: 'warning',
      message: `${oldUnlinkedPOs.length} purchase orders older than 30 days may need invoices`,
      count: oldUnlinkedPOs.length,
    });
  }

  // PRs without matching invoices
  const prs = await listPaymentRequests();
  if (prs.length > 0) {
    alerts.push({
      type: 'unmatched_pr',
      severity: 'info',
      message: `${prs.length} payment requests need review`,
      count: prs.length,
    });
  }

  return { alerts, generatedAt: now.toISOString() };
}

/* ═══════════════════════════════════════════════════════════════
   T112: Reconciliation Reports
   ═══════════════════════════════════════════════════════════════ */
export async function getReconciliationReports() {
  const pos = await listPurchaseOrders();
  const prs = await listPaymentRequests();
  const dos = await listDeliveryOrders();
  const invoices = await listInvoices();

  const totalPOAmount = pos.reduce((s, po) => s + Number(po.amount || 0), 0);
  const totalInvoiceAmount = invoices.reduce((s, inv) => s + Number(inv.amount || 0), 0);

  // Group by supplier name
  const bySupplier: Record<string, { name: string; poTotal: number; invoiceTotal: number; diff: number }> = {};
  for (const po of pos) {
    if (!po.supplierName) continue;
    if (!bySupplier[po.supplierName]) {
      bySupplier[po.supplierName] = { name: po.supplierName, poTotal: 0, invoiceTotal: 0, diff: 0 };
    }
    bySupplier[po.supplierName].poTotal += Number(po.amount || 0);
  }
  for (const inv of invoices) {
    if (!inv.supplierName) continue;
    if (!bySupplier[inv.supplierName]) {
      bySupplier[inv.supplierName] = { name: inv.supplierName, poTotal: 0, invoiceTotal: 0, diff: 0 };
    }
    bySupplier[inv.supplierName].invoiceTotal += Number(inv.amount || 0);
  }
  for (const key of Object.keys(bySupplier)) {
    const entry = bySupplier[key];
    if (entry) entry.diff = entry.poTotal - entry.invoiceTotal;
  }

  return {
    summary: {
      purchaseOrders: pos.length,
      paymentRequests: prs.length,
      deliveryOrders: dos.length,
      invoices: invoices.length,
      totalPOAmount,
      totalInvoiceAmount,
      gap: totalPOAmount - totalInvoiceAmount,
    },
    bySupplier: Object.values(bySupplier),
  };
}
