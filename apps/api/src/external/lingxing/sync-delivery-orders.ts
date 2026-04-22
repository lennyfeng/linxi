import { lingxingRequest } from './client.js';
import { query } from '../../database/index.js';

interface LxDeliveryOrder {
  id: number;
  shipment_sn: string;
  status: number;
  destination_fulfillment_center_id: string;
  shipment_time: string;
  create_time: string;
  logistics_channel_name: string;
  wname: string;
  method_name: string;
}

interface LxDeliveryResponse {
  list: LxDeliveryOrder[];
  total: number;
}

/**
 * Sync delivery orders (发货单) from Lingxing.
 * POST /erp/sc/routing/storage/shipment/getInboundShipmentList
 * Response: data.list[] + data.total
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
    if (startDate || endDate) body.time_type = 3; // 创建时间

    const result = await lingxingRequest<LxDeliveryResponse>(
      '/erp/sc/routing/storage/shipment/getInboundShipmentList',
      body,
    );

    const list = result?.list;
    if (!Array.isArray(list) || list.length === 0) break;

    for (const d of list) {
      totalFetched++;

      const lxDeliveryId = String(d.id);

      const existing = await query<{ id: number }>(
        'SELECT id FROM lx_delivery_orders WHERE lx_delivery_id = ? LIMIT 1',
        [lxDeliveryId],
      );

      const statusStr = String(d.status);
      const destination = d.destination_fulfillment_center_id || '';
      const shipmentType = d.method_name || d.logistics_channel_name || '';
      const shipDate = d.shipment_time || d.create_time || null;

      if (existing[0]) {
        await query(
          `UPDATE lx_delivery_orders SET
            delivery_number = ?, shipment_type = ?, status = ?,
            destination = ?, ship_date = ?, raw_data = ?, synced_at = NOW()
          WHERE id = ?`,
          [d.shipment_sn, shipmentType, statusStr,
           destination, shipDate, JSON.stringify(d), existing[0].id],
        );
        updated++;
      } else {
        await query(
          `INSERT INTO lx_delivery_orders
           (lx_delivery_id, delivery_number, shipment_type, status, destination, ship_date, raw_data, synced_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
          [lxDeliveryId, d.shipment_sn, shipmentType, statusStr,
           destination, shipDate, JSON.stringify(d)],
        );
        created++;
      }
    }

    if (list.length < limit) break;
    offset += limit;
  }

  return { synced: totalFetched, created, updated };
}
