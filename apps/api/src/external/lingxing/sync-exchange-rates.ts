import { lingxingRequest } from './client.js';
import { query } from '../../database/index.js';

interface LingxingCurrencyRate {
  currency: string;
  rate_org: number;
  my_rate: number;
}

/**
 * Sync exchange rates from Lingxing for a given month.
 * Endpoint: POST /erp/sc/routing/finance/currency/currencyMonth
 * Body: { date: "YYYY-MM" }
 * Response data: array of { currency, rate_org, my_rate }
 *
 * Stores into `exchange_rates` table with source='lingxing'.
 * Uses the 1st of the month as rate_date.
 * Prefers my_rate (custom rate) if set; falls back to rate_org (official).
 */
export async function syncExchangeRates(
  yearMonth?: string,
): Promise<{ synced: number; created: number; updated: number }> {
  const date = yearMonth || formatCurrentMonth();

  const rates = await lingxingRequest<LingxingCurrencyRate[]>(
    '/erp/sc/routing/finance/currency/currencyMonth',
    { date },
    'POST',
  );

  if (!Array.isArray(rates)) {
    throw new Error('Unexpected response from Lingxing currencyMonth API');
  }

  const rateDate = `${date}-01`;
  let created = 0;
  let updated = 0;

  for (const item of rates) {
    if (!item.currency || item.currency === 'CNY') continue;

    const rate = item.my_rate > 0 ? item.my_rate : item.rate_org;
    if (!rate || rate <= 0) continue;

    const existing = await query<{ id: number }>(
      `SELECT id FROM exchange_rates
       WHERE source_currency = ? AND target_currency = 'CNY' AND rate_date = ?
       LIMIT 1`,
      [item.currency, rateDate],
    );

    if (existing[0]) {
      await query(
        `UPDATE exchange_rates SET rate = ?, source = 'lingxing' WHERE id = ?`,
        [rate, existing[0].id],
      );
      updated++;
    } else {
      await query(
        `INSERT INTO exchange_rates (source_currency, target_currency, rate, rate_date, source)
         VALUES (?, 'CNY', ?, ?, 'lingxing')`,
        [item.currency, rate, rateDate],
      );
      created++;
    }
  }

  return { synced: rates.length, created, updated };
}

/**
 * Bulk sync: fetch rates for multiple months (e.g. last 12 months).
 */
export async function syncExchangeRatesBulk(
  months: number = 12,
): Promise<{ totalSynced: number; totalCreated: number; totalUpdated: number }> {
  let totalSynced = 0;
  let totalCreated = 0;
  let totalUpdated = 0;

  const now = new Date();
  for (let i = 0; i < months; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    const result = await syncExchangeRates(ym);
    totalSynced += result.synced;
    totalCreated += result.created;
    totalUpdated += result.updated;
  }

  return { totalSynced, totalCreated, totalUpdated };
}

function formatCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
