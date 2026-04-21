import { lingxingRequest } from './client.js';
import { query } from '../../database/index.js';

interface LxPurchaseOrder {
  po_id: string;
  po_number: string;
  supplier_id: string;
  supplier_name: string;
  status: string;
  total_amount: number;
  currency: string;
  order_date: string;
  items?: LxPoItem[];
}

interface LxPoItem {
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

/**
 * Sync purchase orders from Lingxing.
 * POST /erp/sc/routing/data/local_inventory/purchaseOrderList
 */
export async function syncPurchaseOrders(
  startDate?: string,
  endDate?: string,
): Promise<{ synced: number; created: number; updated: number }> {
  let offset = 0;
  const limit = 100;
  let created = 0;
  let updated = 0;
  let totalFetched = 0;

  while (true) {
    const body: Record<string, unknown> = { offset, length: limit };
    if (startDate) body.start_date = startDate;
    if (endDate) body.end_date = endDate;

    const result = await lingxingRequest<LxPurchaseOrder[]>(
      '/erp/sc/routing/data/local_inventory/purchaseOrderList',
      body,
    );

    if (!Array.isArray(result) || result.length === 0) break;

    for (const po of result) {
      totalFetched++;

      // Resolve supplier
      let supplierId: number | null = null;
      if (po.supplier_id) {
        const sup = await query<{ id: number }>(
          'SELECT id FROM lx_suppliers WHERE lx_supplier_id = ? LIMIT 1',
          [po.supplier_id],
        );
        supplierId = sup[0]?.id ?? null;
      }

      const existing = await query<{ id: number }>(
        'SELECT id FROM lx_purchase_orders WHERE lx_po_id = ? LIMIT 1',
        [po.po_id],
      );

      if (existing[0]) {
        await query(
          `UPDATE lx_purchase_orders SET
            po_number = ?, supplier_id = ?, status = ?, total_amount = ?,
            currency = ?, order_date = ?, raw_data = ?, synced_at = NOW()
          WHERE id = ?`,
          [po.po_number, supplierId, po.status, po.total_amount,
           po.currency || 'CNY', po.order_date || null, JSON.stringify(po), existing[0].id],
        );
        updated++;

        // Replace items
        await query('DELETE FROM lx_po_items WHERE purchase_order_id = ?', [existing[0].id]);
        await insertPoItems(existing[0].id, po.items);
      } else {
        const insertResult = await query(
          `INSERT INTO lx_purchase_orders
           (lx_po_id, po_number, supplier_id, status, total_amount, currency, order_date, raw_data, synced_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [po.po_id, po.po_number, supplierId, po.status, po.total_amount,
           po.currency || 'CNY', po.order_date || null, JSON.stringify(po)],
        );
        const newId = Number((insertResult as any).insertId);
        await insertPoItems(newId, po.items);
        created++;
      }
    }

    if (result.length < limit) break;
    offset += limit;
  }

  return { synced: totalFetched, created, updated };
}

async function insertPoItems(poId: number, items?: LxPoItem[]) {
  if (!items || items.length === 0) return;
  for (const item of items) {
    await query(
      `INSERT INTO lx_po_items (purchase_order_id, product_name, sku, quantity, unit_price, total_price, raw_data)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [poId, item.product_name, item.sku, item.quantity, item.unit_price, item.total_price, JSON.stringify(item)],
    );
  }
}
