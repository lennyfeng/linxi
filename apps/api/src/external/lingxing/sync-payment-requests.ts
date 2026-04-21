import { lingxingRequest } from './client.js';
import { query } from '../../database/index.js';

interface LxPaymentRequest {
  request_id: string;
  request_number: string;
  supplier_id: string;
  amount: number;
  currency: string;
  status: string;
  request_date: string;
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
  const limit = 100;
  let created = 0;
  let updated = 0;
  let totalFetched = 0;

  while (true) {
    const body: Record<string, unknown> = { offset, length: limit };
    if (startDate) body.start_date = startDate;
    if (endDate) body.end_date = endDate;

    const result = await lingxingRequest<LxPaymentRequest[]>(
      '/basicOpen/finance/requestFunds/order/list',
      body,
    );

    if (!Array.isArray(result) || result.length === 0) break;

    for (const pr of result) {
      totalFetched++;

      let supplierId: number | null = null;
      if (pr.supplier_id) {
        const sup = await query<{ id: number }>(
          'SELECT id FROM lx_suppliers WHERE lx_supplier_id = ? LIMIT 1',
          [pr.supplier_id],
        );
        supplierId = sup[0]?.id ?? null;
      }

      const existing = await query<{ id: number }>(
        'SELECT id FROM lx_payment_requests WHERE lx_request_id = ? LIMIT 1',
        [pr.request_id],
      );

      if (existing[0]) {
        await query(
          `UPDATE lx_payment_requests SET
            request_number = ?, supplier_id = ?, amount = ?, currency = ?,
            status = ?, request_date = ?, raw_data = ?, synced_at = NOW()
          WHERE id = ?`,
          [pr.request_number, supplierId, pr.amount, pr.currency || 'CNY',
           pr.status, pr.request_date || null, JSON.stringify(pr), existing[0].id],
        );
        updated++;
      } else {
        await query(
          `INSERT INTO lx_payment_requests
           (lx_request_id, request_number, supplier_id, amount, currency, status, request_date, raw_data, synced_at)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
          [pr.request_id, pr.request_number, supplierId, pr.amount,
           pr.currency || 'CNY', pr.status, pr.request_date || null, JSON.stringify(pr)],
        );
        created++;
      }
    }

    if (result.length < limit) break;
    offset += limit;
  }

  return { synced: totalFetched, created, updated };
}
