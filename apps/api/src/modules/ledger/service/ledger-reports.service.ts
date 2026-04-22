import { query } from '../../../database/index.js';

// ── Overview composite data ──
export async function getLedgerOverview() {
  const [todaySummary, periodSummaries, dailyTrend, categoryRanking, incomeBreakdown, userStats] = await Promise.all([
    getTodaySummary(),
    getPeriodSummaries(),
    getDailyTrend(),
    getCategoryRanking(),
    getIncomeBreakdown(),
    getUserStats(),
  ]);

  return { todaySummary, periodSummaries, dailyTrend, categoryRanking, incomeBreakdown, userStats };
}

async function getTodaySummary() {
  const rows = await query(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'income' AND status = 'submitted' THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'submitted' THEN amount ELSE 0 END), 0) AS expense
    FROM transactions
    WHERE date = CURDATE()`,
  );
  const row = rows[0] as any || { income: 0, expense: 0 };
  return { income: Number(row.income), expense: Number(row.expense), balance: Number(row.income) - Number(row.expense) };
}

async function getPeriodSummaries() {
  // This week (Monday–Sunday)
  const weekRows = await query(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'income' AND status = 'submitted' THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'submitted' THEN amount ELSE 0 END), 0) AS expense
    FROM transactions
    WHERE YEARWEEK(date, 1) = YEARWEEK(CURDATE(), 1)`,
  );
  // This month
  const monthRows = await query(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'income' AND status = 'submitted' THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'submitted' THEN amount ELSE 0 END), 0) AS expense
    FROM transactions
    WHERE YEAR(date) = YEAR(CURDATE()) AND MONTH(date) = MONTH(CURDATE())`,
  );
  // This year
  const yearRows = await query(
    `SELECT
      COALESCE(SUM(CASE WHEN type = 'income' AND status = 'submitted' THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'submitted' THEN amount ELSE 0 END), 0) AS expense
    FROM transactions
    WHERE YEAR(date) = YEAR(CURDATE())`,
  );

  const toObj = (r: any) => ({ income: Number(r.income), expense: Number(r.expense) });
  return {
    week: toObj((weekRows as any[])[0] || {}),
    month: toObj((monthRows as any[])[0] || {}),
    year: toObj((yearRows as any[])[0] || {}),
  };
}

async function getDailyTrend() {
  const rows = await query(
    `SELECT
      DATE_FORMAT(date, '%Y-%m-%d') AS date,
      COALESCE(SUM(CASE WHEN type = 'income' AND status = 'submitted' THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'submitted' THEN amount ELSE 0 END), 0) AS expense
    FROM transactions
    WHERE YEAR(date) = YEAR(CURDATE()) AND MONTH(date) = MONTH(CURDATE())
    GROUP BY date
    ORDER BY date ASC`,
  );
  return (rows as any[]).map((r) => ({ date: r.date, income: Number(r.income), expense: Number(r.expense) }));
}

async function getCategoryRanking() {
  const rows = await query(
    `SELECT
      c.id,
      c.category_name AS name,
      COALESCE(SUM(t.amount), 0) AS totalAmount,
      COUNT(t.id) AS txCount
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.type = 'expense' AND t.status = 'submitted'
      AND YEAR(t.date) = YEAR(CURDATE()) AND MONTH(t.date) = MONTH(CURDATE())
    GROUP BY c.id, c.category_name
    ORDER BY totalAmount DESC
    LIMIT 10`,
  );
  const total = (rows as any[]).reduce((s, r) => s + Number(r.totalAmount), 0);
  return {
    totalExpense: total,
    totalCount: (rows as any[]).reduce((s, r) => s + Number(r.txCount), 0),
    items: (rows as any[]).map((r) => ({
      id: r.id,
      name: r.name,
      amount: Number(r.totalAmount),
      count: Number(r.txCount),
      percentage: total > 0 ? Number(((Number(r.totalAmount) / total) * 100).toFixed(2)) : 0,
    })),
  };
}

async function getIncomeBreakdown() {
  const rows = await query(
    `SELECT
      c.id,
      c.category_name AS name,
      COALESCE(SUM(t.amount), 0) AS totalAmount,
      COUNT(t.id) AS txCount
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.type = 'income' AND t.status = 'submitted'
      AND YEAR(t.date) = YEAR(CURDATE()) AND MONTH(t.date) = MONTH(CURDATE())
    GROUP BY c.id, c.category_name
    ORDER BY totalAmount DESC`,
  );
  const total = (rows as any[]).reduce((s, r) => s + Number(r.totalAmount), 0);
  return {
    totalIncome: total,
    totalCount: (rows as any[]).reduce((s, r) => s + Number(r.txCount), 0),
    items: (rows as any[]).map((r) => ({
      id: r.id,
      name: r.name,
      amount: Number(r.totalAmount),
      count: Number(r.txCount),
    })),
  };
}

async function getUserStats() {
  const rows = await query(
    `SELECT
      t.created_by AS userId,
      COALESCE(u.name, t.created_by, 'Unknown') AS userName,
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS expense
    FROM transactions t
    LEFT JOIN users u ON t.created_by = u.username OR CAST(t.created_by AS CHAR) = CAST(u.id AS CHAR)
    WHERE t.status = 'submitted'
      AND YEAR(t.date) = YEAR(CURDATE()) AND MONTH(t.date) = MONTH(CURDATE())
    GROUP BY t.created_by, u.name
    ORDER BY expense DESC`,
  );
  return (rows as any[]).map((r) => ({
    userId: r.userId,
    userName: r.userName,
    income: Number(r.income),
    expense: Number(r.expense),
  }));
}

// ── Reports: Category Breakdown ──
export async function getCategoryBreakdown(startDate: string, endDate: string, type: string) {
  const rows = await query(
    `SELECT
      c.id,
      c.category_name AS name,
      c.parent_id AS parentId,
      COALESCE(SUM(t.amount), 0) AS totalAmount,
      COUNT(t.id) AS txCount
    FROM transactions t
    JOIN categories c ON t.category_id = c.id
    WHERE t.type = ? AND t.status = 'submitted'
      AND t.date BETWEEN ? AND ?
    GROUP BY c.id, c.category_name, c.parent_id
    ORDER BY totalAmount DESC`,
    [type, startDate, endDate],
  );
  const total = (rows as any[]).reduce((s, r) => s + Number(r.totalAmount), 0);
  return {
    total,
    items: (rows as any[]).map((r) => ({
      id: r.id,
      name: r.name,
      parentId: r.parentId,
      amount: Number(r.totalAmount),
      count: Number(r.txCount),
      percentage: total > 0 ? Number(((Number(r.totalAmount) / total) * 100).toFixed(2)) : 0,
    })),
  };
}

// ── Reports: Account Breakdown ──
export async function getAccountBreakdown(startDate: string, endDate: string) {
  const rows = await query(
    `SELECT
      a.id,
      a.account_name AS name,
      a.account_type AS accountType,
      a.current_balance AS currentBalance,
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS expense,
      COUNT(t.id) AS txCount
    FROM accounts a
    LEFT JOIN transactions t ON a.id = t.account_id AND t.status = 'submitted' AND t.date BETWEEN ? AND ?
    WHERE a.status = 'active'
    GROUP BY a.id, a.account_name, a.account_type, a.current_balance
    ORDER BY expense DESC`,
    [startDate, endDate],
  );
  return (rows as any[]).map((r) => ({
    id: r.id,
    name: r.name,
    accountType: r.accountType,
    currentBalance: Number(r.currentBalance),
    income: Number(r.income),
    expense: Number(r.expense),
    net: Number(r.income) - Number(r.expense),
    count: Number(r.txCount),
  }));
}

// ── Reports: Project Breakdown ──
export async function getProjectBreakdown(startDate: string, endDate: string) {
  const rows = await query(
    `SELECT
      COALESCE(project_name, '(Unassigned)') AS name,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
      COUNT(id) AS txCount
    FROM transactions
    WHERE status = 'submitted' AND date BETWEEN ? AND ?
    GROUP BY COALESCE(project_name, '(Unassigned)')
    ORDER BY expense DESC`,
    [startDate, endDate],
  );
  return (rows as any[]).map((r) => ({
    name: r.name,
    income: Number(r.income),
    expense: Number(r.expense),
    net: Number(r.income) - Number(r.expense),
    count: Number(r.txCount),
  }));
}

// ── Reports: Counterparty Breakdown ──
export async function getCounterpartyBreakdown(startDate: string, endDate: string) {
  const rows = await query(
    `SELECT
      COALESCE(counterparty, '(Unspecified)') AS name,
      COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS expense,
      COUNT(id) AS txCount
    FROM transactions
    WHERE status = 'submitted' AND date BETWEEN ? AND ?
    GROUP BY COALESCE(counterparty, '(Unspecified)')
    ORDER BY expense DESC`,
    [startDate, endDate],
  );
  return (rows as any[]).map((r) => ({
    name: r.name,
    income: Number(r.income),
    expense: Number(r.expense),
    net: Number(r.income) - Number(r.expense),
    count: Number(r.txCount),
  }));
}

// ── Reports: Monthly Trend (year) ──
export async function getMonthlyTrend(year: number) {
  const rows = await query(
    `SELECT
      MONTH(date) AS month,
      COALESCE(SUM(CASE WHEN type = 'income' AND status = 'submitted' THEN amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN type = 'expense' AND status = 'submitted' THEN amount ELSE 0 END), 0) AS expense
    FROM transactions
    WHERE YEAR(date) = ?
    GROUP BY MONTH(date)
    ORDER BY month ASC`,
    [year],
  );
  return (rows as any[]).map((r) => ({
    month: Number(r.month),
    income: Number(r.income),
    expense: Number(r.expense),
  }));
}

// ── Reports: Member Breakdown ──
export async function getMemberBreakdown(startDate: string, endDate: string) {
  const rows = await query(
    `SELECT
      t.created_by AS userId,
      COALESCE(u.name, t.created_by, 'Unknown') AS userName,
      COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE 0 END), 0) AS income,
      COALESCE(SUM(CASE WHEN t.type = 'expense' THEN t.amount ELSE 0 END), 0) AS expense,
      COUNT(t.id) AS txCount
    FROM transactions t
    LEFT JOIN users u ON t.created_by = u.username OR CAST(t.created_by AS CHAR) = CAST(u.id AS CHAR)
    WHERE t.status = 'submitted' AND t.date BETWEEN ? AND ?
    GROUP BY t.created_by, u.name
    ORDER BY expense DESC`,
    [startDate, endDate],
  );
  return (rows as any[]).map((r) => ({
    userId: r.userId,
    userName: r.userName,
    income: Number(r.income),
    expense: Number(r.expense),
    count: Number(r.txCount),
  }));
}
