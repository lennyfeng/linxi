import { lingxingRequest } from './client.js';
import { query } from '../../database/index.js';

interface LxSupplier {
  supplier_id: number;
  supplier_name: string;
  supplier_code: string;
  contact_person: string;
  contact_number: string;
  email: string;
  address_full: string;
  is_delete: number;
}

/**
 * Sync suppliers from Lingxing.
 * POST /erp/sc/data/local_inventory/supplier
 */
export async function syncSuppliers(): Promise<{ synced: number; created: number; updated: number }> {
  let offset = 0;
  const limit = 100;
  let created = 0;
  let updated = 0;
  let totalFetched = 0;

  while (true) {
    const result = await lingxingRequest<LxSupplier[]>(
      '/erp/sc/data/local_inventory/supplier',
      { offset, length: limit },
    );

    if (!Array.isArray(result) || result.length === 0) break;

    for (const s of result) {
      totalFetched++;

      const existing = await query<{ id: number }>(
        'SELECT id FROM lx_suppliers WHERE lx_supplier_id = ? LIMIT 1',
        [String(s.supplier_id)],
      );

      if (existing[0]) {
        await query(
          `UPDATE lx_suppliers SET
            name = ?, contact = ?, phone = ?, address = ?, raw_data = ?, synced_at = NOW()
          WHERE id = ?`,
          [s.supplier_name, s.contact_person || null, s.contact_number || null, s.address_full || null, JSON.stringify(s), existing[0].id],
        );
        updated++;
      } else {
        await query(
          `INSERT INTO lx_suppliers
           (lx_supplier_id, name, contact, phone, address, raw_data, synced_at)
           VALUES (?, ?, ?, ?, ?, ?, NOW())`,
          [String(s.supplier_id), s.supplier_name, s.contact_person || null, s.contact_number || null, s.address_full || null, JSON.stringify(s)],
        );
        created++;
      }
    }

    if (result.length < limit) break;
    offset += limit;
  }

  return { synced: totalFetched, created, updated };
}
