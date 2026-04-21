import { query } from '../../database/index.js';

/**
 * Airwallex PDF import workflow:
 * 1. Upload PDF → create import_batch → store file
 * 2. Parse PDF → extract transaction rows → store in external_transactions
 * 3. Dedup check → compare with existing records
 * 4. Confirm → create ledger transactions from matched rows
 *
 * Note: Actual PDF binary parsing requires a library like `pdf-parse`.
 * This module accepts pre-extracted text lines (from frontend or a future parser).
 */

interface AirwallexParsedRow {
  date: string;
  reference: string;
  description: string;
  debit: number;
  credit: number;
  balance: number;
  currency: string;
}

/**
 * Step 1: Create an import batch record.
 */
export async function createAirwallexBatch(
  fileName: string,
  uploadedBy: number,
): Promise<{ batchId: number; batchNo: string }> {
  const batchNo = `AWX-${Date.now()}`;
  const result = await query(
    `INSERT INTO import_batches (batch_no, source_type, file_name, status, uploaded_by, created_at)
     VALUES (?, 'airwallex', ?, 'pending', ?, NOW())`,
    [batchNo, fileName, uploadedBy],
  );
  return { batchId: Number((result as any).insertId), batchNo };
}

/**
 * Step 2: Store parsed rows into external_transactions.
 * Accepts pre-extracted rows (caller is responsible for PDF parsing).
 */
export async function stageAirwallexRows(
  batchId: number,
  rows: AirwallexParsedRow[],
): Promise<{ staged: number }> {
  let staged = 0;
  for (const row of rows) {
    const amount = row.credit > 0 ? row.credit : -row.debit;
    await query(
      `INSERT INTO external_transactions
       (import_batch_id, source_type, external_no, transaction_date, amount, currency,
        counterparty_name, bank_summary, match_status, created_at)
       VALUES (?, 'airwallex', ?, ?, ?, ?, NULL, ?, 'pending', NOW())`,
      [batchId, row.reference || null, row.date, amount, row.currency || 'USD', row.description],
    );
    staged++;
  }

  // Update batch row count
  await query(
    `UPDATE import_batches SET total_rows = ?, status = 'parsed' WHERE id = ?`,
    [staged, batchId],
  );

  return { staged };
}

/**
 * Step 3: Dedup check — find external_transactions in this batch that
 * match existing ledger transactions by date + amount ± tolerance.
 */
export async function dedupCheck(
  batchId: number,
): Promise<{ total: number; duplicates: number; unique: number; items: Array<{ id: number; external_no: string; amount: number; date: string; isDuplicate: boolean }> }> {
  const rows = await query<{
    id: number;
    external_no: string;
    amount: number;
    transaction_date: string;
  }>(
    `SELECT id, external_no, amount, transaction_date
     FROM external_transactions WHERE import_batch_id = ?`,
    [batchId],
  );

  const items: Array<{ id: number; external_no: string; amount: number; date: string; isDuplicate: boolean }> = [];
  let duplicates = 0;

  for (const row of rows) {
    // Check if a ledger transaction with same date and amount exists
    const match = await query<{ id: number }>(
      `SELECT id FROM transactions
       WHERE transaction_date = ? AND ABS(amount - ABS(?)) < 0.01
       LIMIT 1`,
      [row.transaction_date, row.amount],
    );

    const isDuplicate = !!match[0];
    if (isDuplicate) duplicates++;

    items.push({
      id: row.id,
      external_no: row.external_no,
      amount: row.amount,
      date: row.transaction_date,
      isDuplicate,
    });
  }

  return { total: rows.length, duplicates, unique: rows.length - duplicates, items };
}

/**
 * Step 4: Confirm import — create ledger transactions from non-duplicate
 * external_transactions, mark batch as completed.
 */
export async function confirmImport(
  batchId: number,
  selectedIds: number[],
  accountId: number,
  userId: number,
): Promise<{ created: number; skipped: number }> {
  let created = 0;
  let skipped = 0;

  for (const extId of selectedIds) {
    const rows = await query<{
      id: number; amount: number; transaction_date: string;
      bank_summary: string; currency: string; external_no: string;
    }>(
      `SELECT id, amount, transaction_date, bank_summary, currency, external_no
       FROM external_transactions WHERE id = ? AND import_batch_id = ?`,
      [extId, batchId],
    );

    const ext = rows[0];
    if (!ext) { skipped++; continue; }

    const txType = ext.amount >= 0 ? 'income' : 'expense';
    const txNo = `AWX-${ext.external_no || ext.id}`;

    await query(
      `INSERT INTO transactions
       (transaction_no, transaction_type, transaction_date, account_id, amount, currency,
        summary, status, created_by, created_at, updated_at)
       VALUES (?, ?, ?, ?, ABS(?), ?, ?, 'submitted', ?, NOW(), NOW())`,
      [txNo, txType, ext.transaction_date, accountId, ext.amount, ext.currency, ext.bank_summary, userId],
    );

    // Mark external row as confirmed
    await query(
      `UPDATE external_transactions SET match_status = 'confirmed' WHERE id = ?`,
      [extId],
    );
    created++;
  }

  // Update batch status
  await query(
    `UPDATE import_batches SET status = 'completed', success_rows = ?, failed_rows = ? WHERE id = ?`,
    [created, skipped, batchId],
  );

  return { created, skipped };
}
