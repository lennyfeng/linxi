import { lingxingRequest } from './client.js';
import { query } from '../../database/index.js';

interface LxPurchaseOrder {
  order_sn: string;
  custom_order_sn: string;
  supplier_id: number;
  supplier_name: string;
  status: number;
  status_text: string;
  total_price: string;
  amount_total: string;
  purchase_currency: string;
  order_time: string;
  create_time: string;
  item_list?: LxPoItem[];
}

interface LxPoItem {
  product_name: string;
  sku: string;
  quantity: number;
  unit_price: string;
  total_price: string;
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
  const limit = 500; // max 500 per docs
  let created = 0;
  let updated = 0;
  let totalFetched = 0;

  // start_date and end_date are required per API docs
  const end = endDate || new Date().toISOString().slice(0, 10);
  const start = startDate || new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

  while (true) {
    const body: Record<string, unknown> = {
      offset,
      length: limit,
      start_date: start,
      end_date: end,
      search_field_time: 'update_time',
    };

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
          [String(po.supplier_id)],
        );
        supplierId = sup[0]?.id ?? null;
      }

      const lxPoId = po.order_sn;
      const totalAmount = parseFloat(po.total_price || po.amount_total || '0');
      const currency = po.purchase_currency || 'CNY';
      const orderDate = po.order_time || po.create_time || null;

      const existing = await query<{ id: number }>(
        'SELECT id FROM lx_purchase_orders WHERE lx_po_id = ? LIMIT 1',
        [lxPoId],
      );

      if (existing[0]) {
        await query(
          `UPDATE lx_purchase_orders SET
            po_number = ?, supplier_id = ?, status = ?, total_amount = ?,
            currency = ?, order_date = ?, raw_data = ?, synced_at = NOW()
          WHERE id = ?`,
          [lxPoId, supplierId, String(po.status), totalAmount,
           currency, orderDate, JSON.stringify(po), existing[0].id],
        );
        updated++;

        // Replace items
        await query('DELETE FROM lx_po_items WHERE purchase_order_id = ?', [existing[0].id]);
        await insertPoItems(existing[0].id, po.item_list);
      } else {
        const insertResult = await query(
          `INSERT INTO lx_purchase_orders
           (lx_po_id, po_number, supplier_id, status, total_amount, currency, order_date, raw_data, synced_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [lxPoId, lxPoId, supplierId, String(po.status), totalAmount,
           currency, orderDate, JSON.stringify(po)],
        );
        const newId = Number((insertResult as any).insertId);
        await insertPoItems(newId, po.item_list);
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
