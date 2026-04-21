import { query } from '../../database/index.js';

type SourceTable = 'lx_purchase_orders' | 'lx_payment_requests' | 'lx_delivery_orders' | 'lx_suppliers';

/**
 * Mark records as voided when they no longer appear in the source system.
 * Compares local IDs against a set of active IDs from the latest sync.
 * Voided records keep their data but get status='voided'.
 */
export async function markVoidedRecords(
  table: SourceTable,
  activeExternalIds: string[],
  externalIdColumn: string,
): Promise<{ voided: number }> {
  if (activeExternalIds.length === 0) return { voided: 0 };

  const placeholders = activeExternalIds.map(() => '?').join(',');

  const result = await query(
    `UPDATE ${table} SET status = 'voided'
     WHERE ${externalIdColumn} NOT IN (${placeholders})
       AND (status IS NULL OR status != 'voided')`,
    activeExternalIds,
  );

  return { voided: Number((result as any).affectedRows) || 0 };
}

/**
 * Check if a record is voided before creating relations.
 */
export async function isRecordVoided(
  table: SourceTable,
  id: number,
): Promise<boolean> {
  const rows = await query<{ status: string }>(
    `SELECT status FROM ${table} WHERE id = ? LIMIT 1`,
    [id],
  );
  return rows[0]?.status === 'voided';
}
