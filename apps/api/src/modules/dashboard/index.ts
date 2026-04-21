import { getPool } from '../../database/pool.js';
import { sendJson } from '../../common/send.js';
import type { RouteHandler } from '../../common/types.js';
import type { RowDataPacket } from 'mysql2';

export const dashboardModule = {
  name: 'dashboard',
  description: 'Dashboard aggregation API',
  routes: ['/dashboard'],
};

export const handleDashboardRoutes: RouteHandler = async (req, res, url, ctx) => {
  const responseOptions = { requestId: ctx.requestId };

  if (req.method === 'GET' && url.pathname === '/dashboard') {
    const pool = getPool();

    // Financial snapshot
    const [txStats] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total, COALESCE(SUM(amount),0) AS totalAmount FROM ledger_transactions WHERE deleted_at IS NULL`,
    );

    // Active projects
    const [projStats] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) AS total, SUM(CASE WHEN project_status NOT IN ('已终止','已归档') THEN 1 ELSE 0 END) AS active FROM pd_projects`,
    );

    // Reconciliation summary
    const [poCount] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS cnt FROM lx_purchase_orders`);
    const [invCount] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS cnt FROM lx_invoices`);
    const [relCount] = await pool.query<RowDataPacket[]>(`SELECT COUNT(*) AS cnt FROM recon_relations`);

    // Pending approvals for current user
    const userId = ctx.operator?.id;
    let pendingApprovals = 0;
    if (userId) {
      const [pa] = await pool.query<RowDataPacket[]>(
        `SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND is_read = 0 AND type = 'approval'`,
        [userId],
      );
      pendingApprovals = pa[0]?.cnt ?? 0;
    }

    // Recent activity (last 10 audit logs)
    const [recentActivity] = await pool.query<RowDataPacket[]>(
      `SELECT id, action, module, entity_type, entity_id, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10`,
    );

    // System status (sync jobs)
    const [syncJobs] = await pool.query<RowDataPacket[]>(
      `SELECT name, status, last_run_at FROM sync_jobs ORDER BY id LIMIT 10`,
    );

    sendJson(res, {
      financial: {
        transactions: txStats[0]?.total ?? 0,
        totalAmount: Number(txStats[0]?.totalAmount ?? 0),
      },
      projects: {
        total: projStats[0]?.total ?? 0,
        active: projStats[0]?.active ?? 0,
      },
      reconciliation: {
        purchaseOrders: poCount[0]?.cnt ?? 0,
        invoices: invCount[0]?.cnt ?? 0,
        relations: relCount[0]?.cnt ?? 0,
      },
      pendingApprovals,
      recentActivity,
      syncJobs,
    }, responseOptions);
    return true;
  }

  return false;
};
