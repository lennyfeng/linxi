import { lemoncloudRequest } from './client.js';
import { query } from '../../database/index.js';

interface LemonJournal {
  JournalId: string;
  CDAccountId: string;
  CDAccountName: string;
  JournalDate: string;
  IETypeName: string;
  IETypeId: string;
  Abstract: string;
  Income: number;
  Expense: number;
  Balance: number;
  Remark: string;
  CreateTime: string;
}

/**
 * Sync journals (日记账) from Lemon Cloud into ledger_external_transactions.
 * Endpoint: POST /api/Cashier/Journal/GetCDJournal
 * Body: { StartDate, EndDate, PageIndex, PageSize, CDAccountId? }
 */
export async function syncLemonCloudJournals(
  startDate: string,
  endDate: string,
): Promise<{ synced: number; created: number; skipped: number }> {
  let pageIndex = 1;
  const pageSize = 100;
  let created = 0;
  let skipped = 0;
  let totalFetched = 0;

  while (true) {
    const result = await lemoncloudRequest<{ Total: number; List: LemonJournal[] }>(
      '/api/Cashier/Journal/GetCDJournal',
      { StartDate: startDate, EndDate: endDate, PageIndex: pageIndex, PageSize: pageSize },
    );

    const journals = result?.List ?? [];
    if (journals.length === 0) break;

    for (const j of journals) {
      totalFetched++;

      // Check if already imported (dedup by external_no)
      const existing = await query<{ id: number }>(
        `SELECT id FROM external_transactions
         WHERE source_type = 'lemoncloud' AND external_no = ? LIMIT 1`,
        [j.JournalId],
      );

      if (existing[0]) {
        skipped++;
        continue;
      }

      const txType = j.Income > 0 ? 'income' : 'expense';
      const amount = j.Income > 0 ? j.Income : j.Expense;

      await query(
        `INSERT INTO external_transactions
         (source_type, external_no, transaction_date, amount, currency,
          payment_account, counterparty_name, bank_summary, match_status, created_at)
         VALUES ('lemoncloud', ?, ?, ?, 'CNY', ?, ?, ?, 'pending', NOW())`,
        [
          j.JournalId,
          j.JournalDate,
          txType === 'income' ? amount : -amount,
          j.CDAccountName || null,
          j.IETypeName || null,
          j.Abstract || j.Remark || null,
        ],
      );
      created++;
    }

    if (journals.length < pageSize) break;
    pageIndex++;
  }

  return { synced: totalFetched, created, skipped };
}
