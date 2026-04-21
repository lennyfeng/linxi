import { lemoncloudRequest } from './client.js';
import { query } from '../../database/index.js';

interface LemonInvoice {
  InvoiceId: string;
  InvoiceNumber: string;
  SupplierName: string;
  Amount: number;
  Currency: string;
  InvoiceDate: string;
  Status: string;
}

/**
 * Sync invoices from Lemon Cloud into lx_invoices.
 * Endpoint: POST /api/Invoice/Invoice/GetInvoice
 */
export async function syncLemonCloudInvoices(
  startDate: string,
  endDate: string,
): Promise<{ synced: number; created: number; skipped: number }> {
  let pageIndex = 1;
  const pageSize = 100;
  let created = 0;
  let skipped = 0;
  let totalFetched = 0;

  while (true) {
    const result = await lemoncloudRequest<{ Total: number; List: LemonInvoice[] }>(
      '/api/Invoice/Invoice/GetInvoice',
      { StartDate: startDate, EndDate: endDate, PageIndex: pageIndex, PageSize: pageSize },
    );

    const invoices = result?.List ?? [];
    if (invoices.length === 0) break;

    for (const inv of invoices) {
      totalFetched++;

      // Dedup by invoice number
      const existing = await query<{ id: number }>(
        'SELECT id FROM lx_invoices WHERE invoice_number = ? LIMIT 1',
        [inv.InvoiceNumber],
      );

      if (existing[0]) {
        skipped++;
        continue;
      }

      // Resolve supplier by name
      let supplierId: number | null = null;
      if (inv.SupplierName) {
        const sup = await query<{ id: number }>(
          'SELECT id FROM lx_suppliers WHERE name = ? LIMIT 1',
          [inv.SupplierName],
        );
        supplierId = sup[0]?.id ?? null;
      }

      await query(
        `INSERT INTO lx_invoices
         (invoice_number, supplier_id, amount, currency, invoice_date, status, created_at)
         VALUES (?, ?, ?, ?, ?, 'pending', NOW())`,
        [inv.InvoiceNumber, supplierId, inv.Amount, inv.Currency || 'CNY', inv.InvoiceDate],
      );
      created++;
    }

    if (invoices.length < pageSize) break;
    pageIndex++;
  }

  return { synced: totalFetched, created, skipped };
}
