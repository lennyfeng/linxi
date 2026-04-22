import type { PaginationMeta } from '../../../common/pagination.js';
import { buildPagination } from '../../../common/pagination.js';
import type { DbRow } from '../../../database/index.js';
import { query, getConnection } from '../../../database/index.js';
import type {
  LedgerAccount,
  LedgerCategory,
  LedgerTransaction,
  ImportBatch,
  ExternalTransaction,
  TransactionMatch,
  TransactionAttachment,
} from '../../../common/entity-types.js';

export interface PagedResult<T> {
  list: T[];
  pagination: PaginationMeta;
}

export interface LedgerFilters {
  status?: string;
  accountType?: string;
  keyword?: string;
  transactionType?: string;
  reimbursementStatus?: string;
  accountId?: number | null;
  categoryId?: number | null;
  startDate?: string;
  endDate?: string;
  sourceType?: string;
  matchStatus?: string;
  importBatchId?: number | null;
  transactionId?: number | null;
  externalTransactionId?: number | null;
  projectName?: string;
  counterpartyName?: string;
}

async function queryPagedList<T = DbRow>(selectClause: string, fromClause: string, whereClauses: string[], params: unknown[], orderByClause: string, page: number, pageSize: number): Promise<PagedResult<T>> {
  const offset = (page - 1) * pageSize;
  const whereSql = whereClauses.length ? ` WHERE ${whereClauses.join(' AND ')}` : '';
  const listSql = `${selectClause} ${fromClause}${whereSql} ${orderByClause} LIMIT ? OFFSET ?`;
  const countSql = `SELECT COUNT(*) AS total ${fromClause}${whereSql}`;

  const rows = await query<T>(listSql, [...params, pageSize, offset]);
  const totalRows = await query(countSql, params);

  return {
    list: rows,
    pagination: buildPagination(page, pageSize, Number(totalRows[0]?.total || 0)),
  };
}

export async function listAccounts(filters: LedgerFilters, page: number, pageSize: number): Promise<PagedResult<LedgerAccount>> {
  const whereClauses: string[] = [];
  const params: unknown[] = [];

  if (filters.status) {
    whereClauses.push('status = ?');
    params.push(filters.status);
  }

  if (filters.accountType) {
    whereClauses.push('type = ?');
    params.push(filters.accountType);
  }

  if (filters.keyword) {
    whereClauses.push('(name LIKE ? OR remark LIKE ?)');
    params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
  }

  return await queryPagedList<LedgerAccount>(
    `SELECT
      id,
      name AS accountName,
      type AS accountType,
      account_source_type AS accountSourceType,
      currency,
      initial_balance AS openingBalance,
      current_balance AS currentBalance,
      status`,
    'FROM accounts',
    whereClauses,
    params,
    'ORDER BY id DESC',
    page,
    pageSize,
  );
}

export async function getAccountById(id: number): Promise<LedgerAccount | null> {
  const rows = await query<LedgerAccount>(
    `SELECT
      id,
      name AS accountName,
      type AS accountType,
      account_source_type AS accountSourceType,
      currency,
      initial_balance AS openingBalance,
      current_balance AS currentBalance,
      status,
      remark
    FROM accounts
    WHERE id = ?`,
    [id],
  );

  return rows[0] || null;
}

export async function createAccountRecord(payload: Partial<LedgerAccount>): Promise<LedgerAccount | null> {
  const result = await query(
    `INSERT INTO accounts (
      name,
      type,
      account_source_type,
      currency,
      initial_balance,
      current_balance,
      status,
      remark
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.accountName,
      payload.accountType,
      payload.accountSourceType,
      payload.currency,
      payload.openingBalance,
      payload.currentBalance,
      payload.status,
      payload.remark,
    ],
  );

  return await getAccountById(Number((result as any).insertId));
}

export async function listCategories(filters: LedgerFilters, page: number, pageSize: number): Promise<PagedResult<LedgerCategory>> {
  const whereClauses: string[] = [];
  const params: unknown[] = [];

  if (filters.status) {
    whereClauses.push('status = ?');
    params.push(filters.status);
  }

  if (filters.keyword) {
    whereClauses.push('name LIKE ?');
    params.push(`%${filters.keyword}%`);
  }

  return await queryPagedList<LedgerCategory>(
    `SELECT
      id,
      parent_id AS parentId,
      name AS categoryName,
      type AS categoryType,
      sort_order AS sortNo,
      status`,
    'FROM categories',
    whereClauses,
    params,
    'ORDER BY sort_order ASC, id ASC',
    page,
    pageSize,
  );
}

export async function createCategoryRecord(payload: Partial<LedgerCategory>): Promise<LedgerCategory | null> {
  const result: any = await query(
    `INSERT INTO categories (
      parent_id,
      name,
      type,
      sort_order,
      status
    ) VALUES (?, ?, ?, ?, ?)`,
    [payload.parentId, payload.categoryName, payload.categoryType, payload.sortNo, payload.status],
  );

  const rows = await query<LedgerCategory>(
    `SELECT
      id,
      parent_id AS parentId,
      name AS categoryName,
      type AS categoryType,
      sort_order AS sortNo,
      status
    FROM categories
    WHERE id = ?`,
    [Number(result.insertId)],
  );

  return rows[0] || null;
}

export async function listTransactions(filters: LedgerFilters, page: number, pageSize: number): Promise<PagedResult<LedgerTransaction>> {
  const whereClauses: string[] = [];
  const params: unknown[] = [];

  if (filters.transactionType) {
    whereClauses.push('t.type = ?');
    params.push(filters.transactionType);
  }

  if (filters.reimbursementStatus) {
    whereClauses.push('t.reimbursement_status = ?');
    params.push(filters.reimbursementStatus);
  }

  if (filters.accountId) {
    whereClauses.push('t.account_id = ?');
    params.push(filters.accountId);
  }

  if (filters.categoryId) {
    whereClauses.push('t.category_id = ?');
    params.push(filters.categoryId);
  }

  if (filters.startDate) {
    whereClauses.push('t.date >= ?');
    params.push(filters.startDate);
  }

  if (filters.endDate) {
    whereClauses.push('t.date <= ?');
    params.push(filters.endDate);
  }

  if (filters.projectName) {
    whereClauses.push('t.project_name = ?');
    params.push(filters.projectName);
  }

  if (filters.counterpartyName) {
    whereClauses.push('t.counterparty = ?');
    params.push(filters.counterpartyName);
  }

  if (filters.keyword) {
    const kw = `%${filters.keyword}%`;
    const keywordClauses = [
      't.transaction_no LIKE ?',
      't.counterparty LIKE ?',
      't.project_name LIKE ?',
      't.description LIKE ?',
      't.remark LIKE ?',
      't.payment_account LIKE ?',
      'a.name LIKE ?',
      'c.name LIKE ?',
    ];
    const keywordParams: unknown[] = [kw, kw, kw, kw, kw, kw, kw, kw];
    // If keyword looks like a number, also match exact amount
    if (/^\d+(\.\d+)?$/.test(filters.keyword)) {
      keywordClauses.push('t.amount = ?');
      keywordParams.push(Number(filters.keyword));
    }
    whereClauses.push(`(${keywordClauses.join(' OR ')})`);
    params.push(...keywordParams);
  }

  return await queryPagedList<LedgerTransaction>(
    `SELECT
      t.id,
      t.transaction_no AS transactionNo,
      t.type AS transactionType,
      t.date AS transactionDate,
      t.account_id AS accountId,
      t.amount,
      t.currency,
      t.exchange_rate AS exchangeRate,
      t.amount_cny AS amountCny,
      t.payment_account AS paymentAccount,
      t.category_id AS categoryId,
      t.counterparty AS counterpartyName,
      t.project_name AS projectName,
      t.description AS summary,
      t.remark,
      t.reimbursement_required AS reimbursementRequired,
      t.reimbursement_status AS reimbursementStatus,
      t.invoice_required AS invoiceRequired,
      t.status`,
    'FROM transactions t LEFT JOIN accounts a ON t.account_id = a.id LEFT JOIN categories c ON t.category_id = c.id',
    whereClauses,
    params,
    'ORDER BY t.date DESC, t.id DESC',
    page,
    pageSize,
  );
}

export async function getTransactionById(id: number): Promise<LedgerTransaction | null> {
  const rows = await query<LedgerTransaction>(
    `SELECT
      id,
      transaction_no AS transactionNo,
      type AS transactionType,
      date AS transactionDate,
      posting_date AS postingDate,
      account_id AS accountId,
      account_id AS transferOutAccountId,
      to_account_id AS transferInAccountId,
      amount,
      transfer_in_amount AS transferInAmount,
      currency,
      exchange_rate AS exchangeRate,
      amount_cny AS amountCny,
      payment_account AS paymentAccount,
      category_id AS categoryId,
      counterparty AS counterpartyName,
      project_name AS projectName,
      description AS summary,
      remark,
      reimbursement_required AS reimbursementRequired,
      reimbursement_status AS reimbursementStatus,
      invoice_required AS invoiceRequired,
      status,
      created_by AS createdBy
    FROM transactions
    WHERE id = ?`,
    [id],
  );

  return rows[0] || null;
}

export async function createTransactionRecord(payload: Partial<LedgerTransaction>): Promise<LedgerTransaction | null> {
  const result = await query(
    `INSERT INTO transactions (
      transaction_no,
      type,
      date,
      posting_date,
      account_id,
      to_account_id,
      amount,
      transfer_in_amount,
      currency,
      exchange_rate,
      amount_cny,
      payment_account,
      category_id,
      counterparty,
      project_name,
      description,
      remark,
      reimbursement_required,
      reimbursement_status,
      invoice_required,
      status,
      created_by
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.transactionNo,
      payload.transactionType,
      payload.transactionDate,
      payload.postingDate,
      payload.accountId || payload.transferOutAccountId,
      payload.transferInAccountId,
      payload.amount,
      payload.transferInAmount,
      payload.currency,
      payload.exchangeRate,
      payload.amountCny,
      payload.paymentAccount,
      payload.categoryId,
      payload.counterpartyName,
      payload.projectName,
      payload.summary,
      payload.remark,
      payload.reimbursementRequired,
      payload.reimbursementStatus,
      payload.invoiceRequired,
      (payload as any).status || 'submitted',
      payload.createdBy,
    ],
  );

  return await getTransactionById(Number((result as any).insertId));
}

export async function updateTransactionRecord(id: number, payload: Record<string, unknown>) {
  const sets: string[] = [];
  const params: unknown[] = [];
  const fieldMap: Record<string, string> = {
    transactionType: 'type',
    transactionDate: 'date',
    postingDate: 'posting_date',
    accountId: 'account_id',
    transferOutAccountId: 'account_id',
    transferInAccountId: 'to_account_id',
    amount: 'amount',
    transferInAmount: 'transfer_in_amount',
    currency: 'currency',
    exchangeRate: 'exchange_rate',
    amountCny: 'amount_cny',
    paymentAccount: 'payment_account',
    categoryId: 'category_id',
    counterpartyName: 'counterparty',
    projectName: 'project_name',
    summary: 'description',
    remark: 'remark',
    reimbursementRequired: 'reimbursement_required',
    reimbursementStatus: 'reimbursement_status',
    invoiceRequired: 'invoice_required',
    status: 'status',
  };

  for (const [key, column] of Object.entries(fieldMap)) {
    if (payload[key] !== undefined) {
      sets.push(`${column} = ?`);
      params.push(payload[key]);
    }
  }

  if (!sets.length) return await getTransactionById(id);
  await query(`UPDATE transactions SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
  return await getTransactionById(id);
}

export async function deleteTransactionRecord(id: number, transaction: { transactionType: string; amount: number; accountId: number | null; transferInAccountId?: number | null; transferInAmount?: number | null }, operatorId?: string | number | null) {
  const conn = await getConnection();
  try {
    await conn.beginTransaction();

    // 1. Balance rollback
    if (transaction.accountId) {
      if (transaction.transactionType === 'income') {
        await conn.query('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [transaction.amount, transaction.accountId]);
      } else if (transaction.transactionType === 'expense') {
        await conn.query('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [transaction.amount, transaction.accountId]);
      } else if (transaction.transactionType === 'transfer') {
        await conn.query('UPDATE accounts SET current_balance = current_balance + ? WHERE id = ?', [transaction.amount, transaction.accountId]);
        if (transaction.transferInAccountId) {
          await conn.query('UPDATE accounts SET current_balance = current_balance - ? WHERE id = ?', [transaction.transferInAmount ?? transaction.amount, transaction.transferInAccountId]);
        }
      }
    }

    // 2. Delete related records
    await conn.query('DELETE FROM transaction_attachments WHERE transaction_id = ?', [id]);
    await conn.query('DELETE FROM transaction_external_matches WHERE transaction_id = ?', [id]);
    await conn.query('DELETE FROM transactions WHERE id = ?', [id]);

    // 3. Audit log
    await conn.query(
      `INSERT INTO audit_logs (log_type, module_key, object_type, object_id, action, operator_id, result_status)
       VALUES ('write', 'ledger', 'transaction', ?, 'delete_transaction', ?, 'success')`,
      [id, operatorId ?? null],
    );

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

// ── Account update ──
export async function updateAccountRecord(id: number, payload: Record<string, unknown>) {
  const fieldMap: Record<string, string> = {
    accountName: 'name',
    accountType: 'type',
    accountSourceType: 'account_source_type',
    currency: 'currency',
    openingBalance: 'initial_balance',
    currentBalance: 'current_balance',
    status: 'status',
    remark: 'remark',
    bankName: 'bank_name',
    accountNumber: 'account_number',
  };
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [key, column] of Object.entries(fieldMap)) {
    if (payload[key] !== undefined) {
      sets.push(`${column} = ?`);
      params.push(payload[key]);
    }
  }
  if (!sets.length) return await getAccountById(id);
  await query(`UPDATE accounts SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
  return await getAccountById(id);
}

// ── Category update ──
export async function updateCategoryRecord(id: number, payload: Record<string, unknown>) {
  const fieldMap: Record<string, string> = {
    categoryName: 'name',
    categoryType: 'type',
    parentId: 'parent_id',
    sortNo: 'sort_order',
    status: 'status',
  };
  const sets: string[] = [];
  const params: unknown[] = [];
  for (const [key, column] of Object.entries(fieldMap)) {
    if (payload[key] !== undefined) {
      sets.push(`${column} = ?`);
      params.push(payload[key]);
    }
  }
  if (!sets.length) return;
  await query(`UPDATE categories SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
}

export async function getCategoryById(id: number): Promise<LedgerCategory | null> {
  const rows = await query<LedgerCategory>(
    `SELECT id, parent_id AS parentId, name AS categoryName, type AS categoryType, sort_order AS sortNo, status
     FROM categories WHERE id = ?`,
    [id],
  );
  return rows[0] || null;
}

// ── Monthly summary for navigator ──
export async function getMonthlySummary(year?: number) {
  const whereYear = year ? 'WHERE YEAR(date) = ?' : '';
  const params = year ? [year] : [];
  return await query(
    `SELECT
      YEAR(date) AS year,
      MONTH(date) AS month,
      SUM(CASE WHEN type = 'income' AND status = 'submitted' THEN amount ELSE 0 END) AS income,
      SUM(CASE WHEN type = 'expense' AND status = 'submitted' THEN amount ELSE 0 END) AS expense,
      SUM(CASE WHEN type = 'income' AND status = 'submitted' THEN amount ELSE 0 END) -
      SUM(CASE WHEN type = 'expense' AND status = 'submitted' THEN amount ELSE 0 END) AS balance
    FROM transactions
    ${whereYear}
    GROUP BY YEAR(date), MONTH(date)
    ORDER BY year DESC, month DESC`,
    params,
  );
}

// ── Counterparty auto-suggest ──
export async function getDistinctCounterparties(keyword: string, limit = 10) {
  return await query(
    `SELECT DISTINCT counterparty AS name
     FROM transactions
     WHERE counterparty IS NOT NULL AND counterparty != '' AND counterparty LIKE ?
     ORDER BY counterparty
     LIMIT ?`,
    [`%${keyword}%`, limit],
  );
}

// ── Global stats (all-time) ──
export async function getGlobalStats() {
  const rows = await query(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'income' AND status = 'submitted' THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'submitted' THEN amount ELSE 0 END), 0) AS expense,
      COALESCE(SUM(CASE WHEN type = 'income' AND status = 'submitted' THEN amount ELSE 0 END), 0) -
      COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'submitted' THEN amount ELSE 0 END), 0) AS balance,
      COUNT(CASE WHEN status = 'submitted' THEN 1 END) AS totalCount
    FROM transactions`,
  );
  return rows[0] || { income: 0, expense: 0, balance: 0, totalCount: 0 };
}

// ── Batch create transactions ──
export async function batchCreateTransactions(payloads: Partial<LedgerTransaction>[]): Promise<{ success: number; failed: number; ids: number[] }> {
  const ids: number[] = [];
  let failed = 0;
  for (const payload of payloads) {
    try {
      const result: any = await query(
        `INSERT INTO transactions (
          transaction_no, type, date, posting_date, account_id, to_account_id,
          amount, transfer_in_amount, currency, exchange_rate, amount_cny,
          payment_account, category_id, counterparty, project_name, description,
          remark, reimbursement_required, reimbursement_status, invoice_required,
          status, created_by
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          payload.transactionNo || `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          payload.transactionType || 'expense',
          payload.transactionDate || new Date().toISOString().slice(0, 10),
          payload.postingDate || null,
          payload.accountId || payload.transferOutAccountId,
          payload.transferInAccountId || null,
          payload.amount || 0,
          payload.transferInAmount || null,
          payload.currency || 'CNY',
          payload.exchangeRate || null,
          payload.amountCny || null,
          payload.paymentAccount || null,
          payload.categoryId || null,
          payload.counterpartyName || null,
          payload.projectName || null,
          payload.summary || null,
          payload.remark || null,
          payload.reimbursementRequired || 0,
          payload.reimbursementStatus || 'none',
          payload.invoiceRequired || 0,
          (payload as any).status || 'submitted',
          payload.createdBy || null,
        ],
      );
      ids.push(Number(result.insertId));
    } catch {
      failed++;
    }
  }
  return { success: ids.length, failed, ids };
}

// ── Exchange rates ──
export async function upsertExchangeRate(sourceCurrency: string, targetCurrency: string, rate: number, rateDate: string, source: string) {
  await query(
    `INSERT INTO exchange_rates (source_currency, target_currency, rate, rate_date, source)
     VALUES (?, ?, ?, ?, ?)
     ON DUPLICATE KEY UPDATE rate = VALUES(rate), source = VALUES(source)`,
    [sourceCurrency, targetCurrency, rate, rateDate, source],
  );
}

export async function getExchangeRate(sourceCurrency: string, targetCurrency: string, rateDate: string) {
  const rows = await query(
    `SELECT rate FROM exchange_rates
     WHERE source_currency = ? AND target_currency = ? AND rate_date <= ?
     ORDER BY rate_date DESC LIMIT 1`,
    [sourceCurrency, targetCurrency, rateDate],
  );
  return rows[0] || null;
}

export async function createMatchRecord(transactionId: number, externalTransactionId: number, matchStatus: string) {
  const result: any = await query(
    `INSERT INTO transaction_external_matches (transaction_id, external_transaction_id, match_status, confirmed_at)
     VALUES (?, ?, ?, NOW())`,
    [transactionId, externalTransactionId, matchStatus],
  );
  return { id: Number(result.insertId), transactionId, externalTransactionId, matchStatus };
}

export async function updateMatchRecord(matchId: number, payload: { externalTransactionId?: number; matchStatus?: string }) {
  const sets: string[] = [];
  const params: unknown[] = [];
  if (payload.externalTransactionId !== undefined) { sets.push('external_transaction_id = ?'); params.push(payload.externalTransactionId); }
  if (payload.matchStatus !== undefined) { sets.push('match_status = ?'); params.push(payload.matchStatus); }
  if (!sets.length) return;
  await query(`UPDATE transaction_external_matches SET ${sets.join(', ')} WHERE id = ?`, [...params, matchId]);
}

export async function deleteMatchRecord(matchId: number) {
  await query('DELETE FROM transaction_external_matches WHERE id = ?', [matchId]);
}

export async function getMatchById(matchId: number): Promise<TransactionMatch | null> {
  const rows = await query<TransactionMatch>(
    `SELECT id, transaction_id AS transactionId, external_transaction_id AS externalTransactionId,
            match_status AS matchStatus, confirmed_by AS confirmedBy, confirmed_at AS confirmedAt
     FROM transaction_external_matches WHERE id = ?`,
    [matchId],
  );
  return rows[0] || null;
}

export async function listTransactionAttachmentsByTransactionId(transactionId: number): Promise<TransactionAttachment[]> {
  return await query<TransactionAttachment>(
    `SELECT
      id,
      transaction_id AS transactionId,
      file_name AS fileName,
      file_url AS fileUrl
    FROM transaction_attachments
    WHERE transaction_id = ?
    ORDER BY id DESC`,
    [transactionId],
  );
}

export async function createTransactionAttachment(transactionId: number, fileName: string, fileUrl: string): Promise<TransactionAttachment> {
  const result = await query(
    `INSERT INTO transaction_attachments (transaction_id, file_name, file_url)
    VALUES (?, ?, ?)`,
    [transactionId, fileName, fileUrl],
  );

  return {
    id: Number((result as any).insertId),
    transactionId,
    fileName,
    fileUrl,
  };
}

export async function listImportBatches(filters: LedgerFilters, page: number, pageSize: number): Promise<PagedResult<ImportBatch>> {
  const whereClauses: string[] = [];
  const params: unknown[] = [];

  if (filters.status) {
    whereClauses.push('status = ?');
    params.push(filters.status);
  }

  if (filters.sourceType) {
    whereClauses.push('source_type = ?');
    params.push(filters.sourceType);
  }

  if (filters.keyword) {
    whereClauses.push('(batch_no LIKE ? OR file_name LIKE ?)');
    params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
  }

  return await queryPagedList<ImportBatch>(
    `SELECT
      id,
      batch_no AS batchNo,
      source_type AS sourceType,
      file_name AS fileName,
      imported_by AS importedBy,
      status,
      created_at AS createdAt`,
    'FROM external_import_batches',
    whereClauses,
    params,
    'ORDER BY id DESC',
    page,
    pageSize,
  );
}

export async function getImportBatchById(id: number): Promise<ImportBatch | null> {
  const rows = await query<ImportBatch>(
    `SELECT
      id,
      batch_no AS batchNo,
      source_type AS sourceType,
      file_name AS fileName,
      imported_by AS importedBy,
      status,
      created_at AS createdAt
    FROM external_import_batches
    WHERE id = ?`,
    [id],
  );

  return rows[0] || null;
}

export async function createImportBatchRecord(payload: Partial<ImportBatch>): Promise<ImportBatch | null> {
  const result = await query(
    `INSERT INTO external_import_batches (
      batch_no,
      source_type,
      file_name,
      imported_by,
      status
    ) VALUES (?, ?, ?, ?, ?)`,
    [payload.batchNo, payload.sourceType, payload.fileName, payload.importedBy, payload.status],
  );

  return await getImportBatchById(Number((result as any).insertId));
}

export async function listExternalTransactions(filters: LedgerFilters, page: number, pageSize: number): Promise<PagedResult<ExternalTransaction>> {
  const whereClauses: string[] = [];
  const params: unknown[] = [];

  if (filters.sourceType) {
    whereClauses.push('source_type = ?');
    params.push(filters.sourceType);
  }

  if (filters.matchStatus) {
    whereClauses.push('match_status = ?');
    params.push(filters.matchStatus);
  }

  if (filters.importBatchId) {
    whereClauses.push('import_batch_id = ?');
    params.push(filters.importBatchId);
  }

  if (filters.keyword) {
    whereClauses.push('(external_no LIKE ? OR counterparty_name LIKE ? OR bank_summary LIKE ? OR payment_account LIKE ?)');
    params.push(`%${filters.keyword}%`, `%${filters.keyword}%`, `%${filters.keyword}%`, `%${filters.keyword}%`);
  }

  return await queryPagedList<ExternalTransaction>(
    `SELECT
      id,
      import_batch_id AS importBatchId,
      source_type AS sourceType,
      external_no AS externalNo,
      transaction_date AS transactionDate,
      amount,
      currency,
      payment_account AS paymentAccount,
      counterparty_account AS counterpartyAccount,
      counterparty_name AS counterpartyName,
      bank_summary AS bankSummary,
      match_status AS matchStatus`,
    'FROM external_transactions',
    whereClauses,
    params,
    'ORDER BY id DESC',
    page,
    pageSize,
  );
}

export async function updateImportBatchStatus(id: number, status: string) {
  await query('UPDATE external_import_batches SET status = ? WHERE id = ?', [status, id]);
  return await getImportBatchById(id);
}

export async function createExternalTransactionRows(importBatchId: number, rows: Partial<ExternalTransaction>[]): Promise<Partial<ExternalTransaction>[]> {
  const inserted: Partial<ExternalTransaction>[] = [];
  for (const row of rows) {
    const result: any = await query(
      `INSERT INTO external_transactions (
        import_batch_id, source_type, external_no, transaction_date,
        amount, currency, payment_account, counterparty_account,
        counterparty_name, bank_summary, match_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        importBatchId,
        row.sourceType || 'bank',
        row.externalNo || null,
        row.transactionDate || null,
        row.amount || 0,
        row.currency || 'CNY',
        row.paymentAccount || null,
        row.counterpartyAccount || null,
        row.counterpartyName || null,
        row.bankSummary || null,
        row.matchStatus || 'pending',
      ],
    );
    inserted.push({ id: Number(result.insertId), ...row });
  }
  return inserted;
}

export async function getExternalTransactionById(id: number): Promise<ExternalTransaction | null> {
  const rows = await query<ExternalTransaction>(
    `SELECT
      id,
      import_batch_id AS importBatchId,
      source_type AS sourceType,
      external_no AS externalNo,
      transaction_date AS transactionDate,
      amount,
      currency,
      payment_account AS paymentAccount,
      counterparty_account AS counterpartyAccount,
      counterparty_name AS counterpartyName,
      bank_summary AS bankSummary,
      match_status AS matchStatus
    FROM external_transactions WHERE id = ?`,
    [id],
  );
  return rows[0] || null;
}

export async function updateExternalTransactionMatchStatus(id: number, matchStatus: string) {
  await query('UPDATE external_transactions SET match_status = ? WHERE id = ?', [matchStatus, id]);
  return await getExternalTransactionById(id);
}

export async function listExternalTransactionsByBatchId(importBatchId: number): Promise<ExternalTransaction[]> {
  return await query<ExternalTransaction>(
    `SELECT
      id,
      import_batch_id AS importBatchId,
      source_type AS sourceType,
      external_no AS externalNo,
      transaction_date AS transactionDate,
      amount,
      currency,
      payment_account AS paymentAccount,
      counterparty_account AS counterpartyAccount,
      counterparty_name AS counterpartyName,
      bank_summary AS bankSummary,
      match_status AS matchStatus
    FROM external_transactions
    WHERE import_batch_id = ?
    ORDER BY id ASC`,
    [importBatchId],
  );
}

export async function listMatches(filters: LedgerFilters, page: number, pageSize: number): Promise<PagedResult<TransactionMatch>> {
  const whereClauses: string[] = [];
  const params: unknown[] = [];

  if (filters.matchStatus) {
    whereClauses.push('match_status = ?');
    params.push(filters.matchStatus);
  }

  if (filters.transactionId) {
    whereClauses.push('transaction_id = ?');
    params.push(filters.transactionId);
  }

  if (filters.externalTransactionId) {
    whereClauses.push('external_transaction_id = ?');
    params.push(filters.externalTransactionId);
  }

  if (filters.keyword) {
    whereClauses.push('(CAST(transaction_id AS CHAR) LIKE ? OR CAST(external_transaction_id AS CHAR) LIKE ?)');
    params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
  }

  return await queryPagedList<TransactionMatch>(
    `SELECT
      id,
      transaction_id AS transactionId,
      external_transaction_id AS externalTransactionId,
      match_status AS matchStatus,
      confirmed_by AS confirmedBy,
      confirmed_at AS confirmedAt`,
    'FROM transaction_external_matches',
    whereClauses,
    params,
    'ORDER BY id DESC',
    page,
    pageSize,
  );
}

export async function listMatchesByTransactionId(transactionId: number): Promise<TransactionMatch[]> {
  return await query<TransactionMatch>(
    `SELECT
      id,
      transaction_id AS transactionId,
      external_transaction_id AS externalTransactionId,
      match_status AS matchStatus,
      confirmed_by AS confirmedBy,
      confirmed_at AS confirmedAt
    FROM transaction_external_matches
    WHERE transaction_id = ?
    ORDER BY id ASC`,
    [transactionId],
  );
}

// ══════════════════════════════════════
// Ledger Projects CRUD (T-2.1)
// ══════════════════════════════════════
export interface LedgerProject {
  id: number;
  name: string;
  description: string | null;
  parentId: number | null;
  depth: number;
  sortOrder: number;
  status: string;
  createdAt?: string;
  updatedAt?: string;
}

export async function listLedgerProjects(status?: string): Promise<LedgerProject[]> {
  const where = status ? 'WHERE status = ?' : '';
  const params = status ? [status] : [];
  return await query<LedgerProject>(
    `SELECT id, name, description, parent_id AS parentId, depth, sort_order AS sortOrder, status, created_at AS createdAt
     FROM ledger_projects ${where} ORDER BY sort_order ASC, id ASC`,
    params,
  );
}

export async function getLedgerProjectById(id: number): Promise<LedgerProject | null> {
  const rows = await query<LedgerProject>(
    `SELECT id, name, description, parent_id AS parentId, depth, sort_order AS sortOrder, status
     FROM ledger_projects WHERE id = ?`,
    [id],
  );
  return rows[0] || null;
}

export async function createLedgerProject(payload: Partial<LedgerProject>): Promise<LedgerProject | null> {
  const result: any = await query(
    `INSERT INTO ledger_projects (name, description, parent_id, depth, sort_order, status)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [payload.name, payload.description || null, payload.parentId || null, payload.depth || 1, payload.sortOrder || 0, payload.status || 'active'],
  );
  return await getLedgerProjectById(Number(result.insertId));
}

export async function updateLedgerProject(id: number, payload: Partial<LedgerProject>): Promise<LedgerProject | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  const fieldMap: Record<string, string> = { name: 'name', description: 'description', parentId: 'parent_id', depth: 'depth', sortOrder: 'sort_order', status: 'status' };
  for (const [key, col] of Object.entries(fieldMap)) {
    if ((payload as any)[key] !== undefined) {
      sets.push(`${col} = ?`);
      params.push((payload as any)[key]);
    }
  }
  if (!sets.length) return await getLedgerProjectById(id);
  await query(`UPDATE ledger_projects SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
  return await getLedgerProjectById(id);
}

export async function deleteLedgerProject(id: number): Promise<void> {
  // Delete self + all descendants
  await query('DELETE FROM ledger_projects WHERE id = ? OR parent_id = ?', [id, id]);
  // Also clean grandchildren (depth 3 whose parent was a depth-2 child of id)
  // Simpler: delete by ids
}

export async function deleteLedgerProjectCascade(ids: number[]): Promise<void> {
  if (!ids.length) return;
  const placeholders = ids.map(() => '?').join(',');
  await query(`DELETE FROM ledger_projects WHERE id IN (${placeholders})`, ids);
}

export async function getChildProjectIds(parentId: number): Promise<number[]> {
  const rows = await query<{ id: number }>('SELECT id FROM ledger_projects WHERE parent_id = ?', [parentId]);
  return rows.map((r) => r.id);
}

export async function batchUpdateProjectSort(items: { id: number; sortOrder: number }[]): Promise<void> {
  for (const item of items) {
    await query('UPDATE ledger_projects SET sort_order = ? WHERE id = ?', [item.sortOrder, item.id]);
  }
}

export async function getProjectTransactionStats(): Promise<Record<number, { income: number; expense: number; count: number }>> {
  const rows = await query<{ projectId: number; income: number; expense: number; cnt: number }>(
    `SELECT
       p.id AS projectId,
       COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS expense,
       COUNT(t.id) AS cnt
     FROM ledger_projects p
     LEFT JOIN transactions t ON t.project_id = p.id
     GROUP BY p.id`,
  );
  const map: Record<number, { income: number; expense: number; count: number }> = {};
  for (const r of rows) {
    map[r.projectId] = { income: Number(r.income), expense: Number(r.expense), count: Number(r.cnt) };
  }
  return map;
}

// ══════════════════════════════════════
// Ledger Counterparties CRUD (T-2.2)
// ══════════════════════════════════════
export interface LedgerCounterparty {
  id: number;
  name: string;
  description: string | null;
  sortOrder: number;
  status: string;
}

export async function listLedgerCounterparties(status?: string): Promise<LedgerCounterparty[]> {
  const where = status ? 'WHERE status = ?' : '';
  const params = status ? [status] : [];
  return await query<LedgerCounterparty>(
    `SELECT id, name, description, sort_order AS sortOrder, status
     FROM ledger_counterparties ${where} ORDER BY sort_order ASC, id ASC`,
    params,
  );
}

export async function getLedgerCounterpartyById(id: number): Promise<LedgerCounterparty | null> {
  const rows = await query<LedgerCounterparty>(
    'SELECT id, name, description, sort_order AS sortOrder, status FROM ledger_counterparties WHERE id = ?',
    [id],
  );
  return rows[0] || null;
}

export async function createLedgerCounterparty(payload: Partial<LedgerCounterparty>): Promise<LedgerCounterparty | null> {
  const result: any = await query(
    'INSERT INTO ledger_counterparties (name, description, sort_order, status) VALUES (?, ?, ?, ?)',
    [payload.name, payload.description || null, payload.sortOrder || 0, payload.status || 'active'],
  );
  return await getLedgerCounterpartyById(Number(result.insertId));
}

export async function updateLedgerCounterparty(id: number, payload: Partial<LedgerCounterparty>): Promise<LedgerCounterparty | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  const fieldMap: Record<string, string> = { name: 'name', description: 'description', sortOrder: 'sort_order', status: 'status' };
  for (const [key, col] of Object.entries(fieldMap)) {
    if ((payload as any)[key] !== undefined) {
      sets.push(`${col} = ?`);
      params.push((payload as any)[key]);
    }
  }
  if (!sets.length) return await getLedgerCounterpartyById(id);
  await query(`UPDATE ledger_counterparties SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
  return await getLedgerCounterpartyById(id);
}

export async function deleteLedgerCounterparty(id: number): Promise<void> {
  await query('DELETE FROM ledger_counterparties WHERE id = ?', [id]);
}

export async function batchUpdateCounterpartySort(items: { id: number; sortOrder: number }[]): Promise<void> {
  for (const item of items) {
    await query('UPDATE ledger_counterparties SET sort_order = ? WHERE id = ?', [item.sortOrder, item.id]);
  }
}

export async function getCounterpartyTransactionStats(): Promise<Record<number, { income: number; expense: number; count: number }>> {
  const rows = await query<{ counterpartyId: number; income: number; expense: number; cnt: number }>(
    `SELECT
       cp.id AS counterpartyId,
       COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS income,
       COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS expense,
       COUNT(t.id) AS cnt
     FROM ledger_counterparties cp
     LEFT JOIN transactions t ON t.counterparty_id = cp.id
     GROUP BY cp.id`,
  );
  const map: Record<number, { income: number; expense: number; count: number }> = {};
  for (const r of rows) {
    map[r.counterpartyId] = { income: Number(r.income), expense: Number(r.expense), count: Number(r.cnt) };
  }
  return map;
}

// ══════════════════════════════════════
// Account sort + soft-delete (T-2.3)
// ══════════════════════════════════════
export async function softDeleteAccount(id: number): Promise<void> {
  await query("UPDATE accounts SET status = 'disabled', is_active = 0 WHERE id = ?", [id]);
}

export async function batchUpdateAccountSort(items: { id: number; sortOrder: number }[]): Promise<void> {
  for (const item of items) {
    await query('UPDATE accounts SET sort_order = ? WHERE id = ?', [item.sortOrder, item.id]);
  }
}

// ══════════════════════════════════════
// Category delete + sort (T-2.4)
// ══════════════════════════════════════
export async function deleteCategoryRecord(id: number): Promise<number[]> {
  // Find children
  const children = await query<{ id: number }>('SELECT id FROM categories WHERE parent_id = ?', [id]);
  const allIds = [id, ...children.map((c) => c.id)];
  const placeholders = allIds.map(() => '?').join(',');
  await query(`DELETE FROM categories WHERE id IN (${placeholders})`, allIds);
  return allIds;
}

export async function batchUpdateCategorySort(items: { id: number; sortOrder: number }[]): Promise<void> {
  for (const item of items) {
    await query('UPDATE categories SET sort_order = ? WHERE id = ?', [item.sortOrder, item.id]);
  }
}
