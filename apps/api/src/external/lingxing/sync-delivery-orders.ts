import { lingxingRequest } from './client.js';
import { query } from '../../database/index.js';

interface LxDeliveryOrder {
  delivery_id: string;
  delivery_number: string;
  shipment_type: string;
  status: string;
  destination: string;
  ship_date: string;
}

/**
 * Sync delivery orders (发货单/入库计划) from Lingxing.
 * POST /erp/sc/routing/storage/shipment/getInboundShipmentList
 */
export async function syncDeliveryOrders(
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

    const result = await lingxingRequest<LxDeliveryOrder[]>(
      '/erp/sc/routing/storage/shipment/getInboundShipmentList',
      body,
    );

    if (!Array.isArray(result) || result.length === 0) break;

    for (const d of result) {
      totalFetched++;

      const existing = await query<{ id: number }>(
        'SELECT id FROM lx_delivery_orders WHERE lx_delivery_id = ? LIMIT 1',
        [d.delivery_id],
      );

      if (existing[0]) {
        await query(
          `UPDATE lx_delivery_orders SET
            delivery_number = ?, shipment_type = ?, status = ?,
            destination = ?, ship_date = ?, raw_data = ?, synced_at = NOW()
          WHERE id = ?`,
          [d.delivery_number, d.shipment_type, d.status,
           d.destination, d.ship_date || null, JSON.stringify(d), existing[0].id],
        );
        updated++;
      } else {
        await query(
          `INSERT INTO lx_delivery_orders
           (lx_delivery_id, delivery_number, shipment_type, status, destination, ship_date, raw_data, synced_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [d.delivery_id, d.delivery_number, d.shipment_type, d.status,
           d.destination, d.ship_date || null, JSON.stringify(d)],
        );
        created++;
      }
    }

    if (result.length < limit) break;
    offset += limit;
  }

  return { synced: totalFetched, created, updated };
}
