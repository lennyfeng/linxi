import { lingxingRequest } from './client.js';
import { query } from '../../database/index.js';

interface LxPaymentRequest {
  order_sn: string;
  object_type: string;
  object_name: string;
  amount_total: string;
  amount_paid: string;
  amount_unpaid: string;
  currency: string;
  status: number;
  apply_user: string;
  apply_time: string;
  payment_method: string;
  remark: string;
}

/**
 * Sync payment requests (请款单) from Lingxing.
 * POST /basicOpen/finance/requestFunds/order/list
 */
export async function syncPaymentRequests(
  startDate?: string,
  endDate?: string,
): Promise<{ synced: number; created: number; updated: number }> {
  let offset = 0;
  const limit = 200; // max 200 per docs
  let created = 0;
  let updated = 0;
  let totalFetched = 0;

  // Time range max 90 days per docs
  const end = endDate || new Date().toISOString().slice(0, 10);
  const start = startDate || new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10);

  while (true) {
    const body: Record<string, unknown> = {
      offset,
      length: limit,
      start_date: start,
      end_date: end,
      search_field_time: 'apply_time',
    };

    const result = await lingxingRequest<LxPaymentRequest[]>(
      '/basicOpen/finance/requestFunds/order/list',
      body,
    );

    if (!Array.isArray(result) || result.length === 0) break;

    for (const pr of result) {
      totalFetched++;

      const lxRequestId = pr.order_sn;
      const amount = parseFloat(pr.amount_total || '0');
      const requestDate = pr.apply_time || null;

      const existing = await query<{ id: number }>(
        'SELECT id FROM lx_payment_requests WHERE lx_request_id = ? LIMIT 1',
        [lxRequestId],
      );

      if (existing[0]) {
        await query(
          `UPDATE lx_payment_requests SET
            request_number = ?, supplier_id = ?, amount = ?, currency = ?,
            status = ?, request_date = ?, raw_data = ?, synced_at = NOW()
          WHERE id = ?`,
          [lxRequestId, null, amount, pr.currency || 'CNY',
           String(pr.status), requestDate, JSON.stringify(pr), existing[0].id],
        );
        updated++;
      } else {
        await query(
          `INSERT INTO lx_payment_requests
           (lx_request_id, request_number, supplier_id, amount, currency, status, request_date, raw_data, synced_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [lxRequestId, lxRequestId, null, amount,
           pr.currency || 'CNY', String(pr.status), requestDate, JSON.stringify(pr)],
        );
        created++;
      }
    }

    if (result.length < limit) break;
    offset += limit;
  }

  return { synced: totalFetched, created, updated };
}
