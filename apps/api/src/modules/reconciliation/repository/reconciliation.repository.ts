import { query } from '../../../database/index.js';
import type {
  PurchaseOrder,
  PaymentRequest,
  DeliveryOrder,
  InvoiceRecord,
  InvoicePurchaseRelation,
  InvoicePaymentRequestRelation,
  InvoiceDeliveryRelation,
  StatusSnapshot,
  InvoicePurchaseRelationPayload,
  InvoicePaymentRequestRelationPayload,
  InvoiceDeliveryRelationPayload,
  StatusSnapshotPayload,
} from '../../../common/entity-types.js';

export async function listPurchaseOrders(): Promise<PurchaseOrder[]> {
  return await query<PurchaseOrder>(
    `SELECT
      id,
      order_no AS orderNo,
      supplier_name AS supplierName,
      amount,
      invoice_status AS invoiceStatus,
      reminder_disabled AS reminderDisabled,
      reminder_disabled_reason AS reminderDisabledReason
    FROM purchase_orders
    ORDER BY id DESC`,
  );
}

export async function getPurchaseOrderById(id: number): Promise<PurchaseOrder | null> {
  const rows = await query<PurchaseOrder>(
    `SELECT
      id,
      order_no AS orderNo,
      supplier_name AS supplierName,
      amount,
      invoice_status AS invoiceStatus,
      reminder_disabled AS reminderDisabled,
      reminder_disabled_reason AS reminderDisabledReason,
      source_updated_at AS sourceUpdatedAt
    FROM purchase_orders
    WHERE id = ?`,
    [id],
  );

  return rows[0] || null;
}

export async function listPaymentRequests(): Promise<PaymentRequest[]> {
  return await query<PaymentRequest>(
    `SELECT
      id,
      request_no AS requestNo,
      supplier_name AS supplierName,
      amount,
      invoice_status AS invoiceStatus,
      reminder_disabled AS reminderDisabled,
      reminder_disabled_reason AS reminderDisabledReason
    FROM payment_requests
    ORDER BY id DESC`,
  );
}

export async function getPaymentRequestById(id: number): Promise<PaymentRequest | null> {
  const rows = await query<PaymentRequest>(
    `SELECT
      id,
      request_no AS requestNo,
      supplier_name AS supplierName,
      amount,
      invoice_status AS invoiceStatus,
      reminder_disabled AS reminderDisabled,
      reminder_disabled_reason AS reminderDisabledReason,
      source_updated_at AS sourceUpdatedAt
    FROM payment_requests
    WHERE id = ?`,
    [id],
  );

  return rows[0] || null;
}

export async function listDeliveryOrders(): Promise<DeliveryOrder[]> {
  return await query<DeliveryOrder>(
    `SELECT
      id,
      order_no AS orderNo,
      supplier_name AS supplierName,
      amount,
      invoice_status AS invoiceStatus,
      reminder_disabled AS reminderDisabled,
      reminder_disabled_reason AS reminderDisabledReason
    FROM delivery_orders
    ORDER BY id DESC`,
  );
}

export async function getDeliveryOrderById(id: number): Promise<DeliveryOrder | null> {
  const rows = await query<DeliveryOrder>(
    `SELECT
      id,
      order_no AS orderNo,
      supplier_name AS supplierName,
      amount,
      invoice_status AS invoiceStatus,
      reminder_disabled AS reminderDisabled,
      reminder_disabled_reason AS reminderDisabledReason,
      source_updated_at AS sourceUpdatedAt
    FROM delivery_orders
    WHERE id = ?`,
    [id],
  );

  return rows[0] || null;
}

export async function listInvoices(): Promise<InvoiceRecord[]> {
  return await query<InvoiceRecord>(
    `SELECT
      id,
      invoice_no AS invoiceNo,
      invoice_type AS invoiceType,
      supplier_name AS supplierName,
      amount,
      invoice_date AS invoiceDate,
      match_status AS matchStatus
    FROM invoice_records
    ORDER BY id DESC`,
  );
}

export async function getInvoiceById(id: number): Promise<InvoiceRecord | null> {
  const rows = await query<InvoiceRecord>(
    `SELECT
      id,
      invoice_no AS invoiceNo,
      invoice_type AS invoiceType,
      supplier_name AS supplierName,
      amount,
      invoice_date AS invoiceDate,
      match_status AS matchStatus,
      source_updated_at AS sourceUpdatedAt
    FROM invoice_records
    WHERE id = ?`,
    [id],
  );

  return rows[0] || null;
}

export async function listInvoicePurchaseRelations(): Promise<InvoicePurchaseRelation[]> {
  return await query<InvoicePurchaseRelation>(
    `SELECT
      id,
      invoice_id AS invoiceId,
      purchase_order_id AS purchaseOrderId,
      relation_amount AS relationAmount,
      remark
    FROM invoice_purchase_relations
    ORDER BY id DESC`,
  );
}

export async function getInvoicePurchaseRelationById(id: number): Promise<InvoicePurchaseRelation | null> {
  const rows = await query<InvoicePurchaseRelation>(
    `SELECT
      id,
      invoice_id AS invoiceId,
      purchase_order_id AS purchaseOrderId,
      relation_amount AS relationAmount,
      remark
    FROM invoice_purchase_relations
    WHERE id = ?`,
    [id],
  );

  return rows[0] || null;
}

export async function listInvoicePaymentRequestRelations(): Promise<InvoicePaymentRequestRelation[]> {
  return await query<InvoicePaymentRequestRelation>(
    `SELECT
      id,
      invoice_id AS invoiceId,
      payment_request_id AS paymentRequestId,
      relation_amount AS relationAmount,
      remark
    FROM invoice_payment_request_relations
    ORDER BY id DESC`,
  );
}

export async function getInvoicePaymentRequestRelationById(id: number): Promise<InvoicePaymentRequestRelation | null> {
  const rows = await query<InvoicePaymentRequestRelation>(
    `SELECT
      id,
      invoice_id AS invoiceId,
      payment_request_id AS paymentRequestId,
      relation_amount AS relationAmount,
      remark
    FROM invoice_payment_request_relations
    WHERE id = ?`,
    [id],
  );

  return rows[0] || null;
}

export async function listInvoiceDeliveryRelations(): Promise<InvoiceDeliveryRelation[]> {
  return await query<InvoiceDeliveryRelation>(
    `SELECT
      id,
      invoice_id AS invoiceId,
      delivery_order_id AS deliveryOrderId,
      relation_amount AS relationAmount,
      remark
    FROM invoice_delivery_relations
    ORDER BY id DESC`,
  );
}

export async function getInvoiceDeliveryRelationById(id: number): Promise<InvoiceDeliveryRelation | null> {
  const rows = await query<InvoiceDeliveryRelation>(
    `SELECT
      id,
      invoice_id AS invoiceId,
      delivery_order_id AS deliveryOrderId,
      relation_amount AS relationAmount,
      remark
    FROM invoice_delivery_relations
    WHERE id = ?`,
    [id],
  );

  return rows[0] || null;
}

export async function createInvoicePurchaseRelation(payload: InvoicePurchaseRelationPayload): Promise<InvoicePurchaseRelation> {
  const result = await query(
    `INSERT INTO invoice_purchase_relations (invoice_id, purchase_order_id, relation_amount, remark)
    VALUES (?, ?, ?, ?)`,
    [payload.invoiceId, payload.purchaseOrderId, payload.relationAmount, payload.remark],
  );

  return (await getInvoicePurchaseRelationById(Number((result as any).insertId)))!;
}

export async function updateInvoicePurchaseRelation(id: number, payload: InvoicePurchaseRelationPayload): Promise<InvoicePurchaseRelation | null> {
  await query(
    `UPDATE invoice_purchase_relations
    SET invoice_id = ?, purchase_order_id = ?, relation_amount = ?, remark = ?
    WHERE id = ?`,
    [payload.invoiceId, payload.purchaseOrderId, payload.relationAmount, payload.remark, id],
  );

  return await getInvoicePurchaseRelationById(id);
}

export async function deleteInvoicePurchaseRelation(id: number): Promise<void> {
  await query('DELETE FROM invoice_purchase_relations WHERE id = ?', [id]);
}

export async function createInvoicePaymentRequestRelation(payload: InvoicePaymentRequestRelationPayload): Promise<InvoicePaymentRequestRelation> {
  const result = await query(
    `INSERT INTO invoice_payment_request_relations (invoice_id, payment_request_id, relation_amount, remark)
    VALUES (?, ?, ?, ?)`,
    [payload.invoiceId, payload.paymentRequestId, payload.relationAmount, payload.remark],
  );

  return (await getInvoicePaymentRequestRelationById(Number((result as any).insertId)))!;
}

export async function updateInvoicePaymentRequestRelation(id: number, payload: InvoicePaymentRequestRelationPayload): Promise<InvoicePaymentRequestRelation | null> {
  await query(
    `UPDATE invoice_payment_request_relations
    SET invoice_id = ?, payment_request_id = ?, relation_amount = ?, remark = ?
    WHERE id = ?`,
    [payload.invoiceId, payload.paymentRequestId, payload.relationAmount, payload.remark, id],
  );

  return await getInvoicePaymentRequestRelationById(id);
}

export async function deleteInvoicePaymentRequestRelation(id: number): Promise<void> {
  await query('DELETE FROM invoice_payment_request_relations WHERE id = ?', [id]);
}

export async function createInvoiceDeliveryRelation(payload: InvoiceDeliveryRelationPayload): Promise<InvoiceDeliveryRelation> {
  const result = await query(
    `INSERT INTO invoice_delivery_relations (invoice_id, delivery_order_id, relation_amount, remark)
    VALUES (?, ?, ?, ?)`,
    [payload.invoiceId, payload.deliveryOrderId, payload.relationAmount, payload.remark],
  );

  return (await getInvoiceDeliveryRelationById(Number((result as any).insertId)))!;
}

export async function updateInvoiceDeliveryRelation(id: number, payload: InvoiceDeliveryRelationPayload): Promise<InvoiceDeliveryRelation | null> {
  await query(
    `UPDATE invoice_delivery_relations
    SET invoice_id = ?, delivery_order_id = ?, relation_amount = ?, remark = ?
    WHERE id = ?`,
    [payload.invoiceId, payload.deliveryOrderId, payload.relationAmount, payload.remark, id],
  );

  return await getInvoiceDeliveryRelationById(id);
}

export async function deleteInvoiceDeliveryRelation(id: number): Promise<void> {
  await query('DELETE FROM invoice_delivery_relations WHERE id = ?', [id]);
}

export async function listStatusSnapshots(): Promise<StatusSnapshot[]> {
  return await query<StatusSnapshot>(
    `SELECT
      id,
      business_type AS businessType,
      business_id AS businessId,
      amount_total AS amountTotal,
      amount_covered AS amountCovered,
      relation_status AS relationStatus,
      updated_at AS updatedAt
    FROM reconciliation_status_snapshots
    ORDER BY id DESC`,
  );
}

export async function upsertStatusSnapshot(payload: StatusSnapshotPayload): Promise<StatusSnapshot | null> {
  await query(
    `INSERT INTO reconciliation_status_snapshots (
      business_type,
      business_id,
      amount_total,
      amount_covered,
      relation_status,
      updated_at
    ) VALUES (?, ?, ?, ?, ?, NOW())
    ON DUPLICATE KEY UPDATE
      amount_total = VALUES(amount_total),
      amount_covered = VALUES(amount_covered),
      relation_status = VALUES(relation_status),
      updated_at = NOW()`,
    [payload.businessType, payload.businessId, payload.amountTotal, payload.amountCovered, payload.relationStatus],
  );

  const rows = await query<StatusSnapshot>(
    `SELECT
      id,
      business_type AS businessType,
      business_id AS businessId,
      amount_total AS amountTotal,
      amount_covered AS amountCovered,
      relation_status AS relationStatus,
      updated_at AS updatedAt
    FROM reconciliation_status_snapshots
    WHERE business_type = ? AND business_id = ?`,
    [payload.businessType, payload.businessId],
  );

  return rows[0] || null;
}
