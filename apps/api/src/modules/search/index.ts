import { getPool } from '../../database/pool.js';
import { sendJson } from '../../common/send.js';
import type { RouteHandler } from '../../common/types.js';
import type { RowDataPacket } from 'mysql2';

export const searchModule = {
  name: 'search',
  description: 'Global cross-module search',
  routes: ['/search'],
};

export const handleSearchRoutes: RouteHandler = async (req, res, url, ctx) => {
  const responseOptions = { requestId: ctx.requestId };

  if (req.method === 'GET' && url.pathname === '/search') {
    const q = url.searchParams.get('q')?.trim();
    if (!q || q.length < 2) {
      sendJson(res, { results: [] }, responseOptions);
      return true;
    }

    const pool = getPool();
    const like = `%${q}%`;

    // Search across modules in parallel
    const [transactions, projects, purchaseOrders, invoices] = await Promise.all([
      pool.query<RowDataPacket[]>({
        sql: `SELECT id, 'transaction' AS type, 'ledger' AS module, description AS title, CAST(amount AS CHAR) AS subtitle
              FROM ledger_transactions WHERE deleted_at IS NULL AND (description LIKE ? OR counterparty LIKE ?) LIMIT 10`,
        values: [like, like],
      }).then(([r]) => r),
      pool.query<RowDataPacket[]>({
        sql: `SELECT id, 'project' AS type, 'product-dev' AS module, product_name AS title, project_code AS subtitle
              FROM pd_projects WHERE product_name LIKE ? OR project_code LIKE ? OR sku LIKE ? LIMIT 10`,
        values: [like, like, like],
      }).then(([r]) => r),
      pool.query<RowDataPacket[]>({
        sql: `SELECT id, 'purchase-order' AS type, 'reconciliation' AS module, order_no AS title, supplier_name AS subtitle
              FROM lx_purchase_orders WHERE order_no LIKE ? OR supplier_name LIKE ? LIMIT 10`,
        values: [like, like],
      }).then(([r]) => r),
      pool.query<RowDataPacket[]>({
        sql: `SELECT id, 'invoice' AS type, 'reconciliation' AS module, invoice_no AS title, supplier_name AS subtitle
              FROM lx_invoices WHERE invoice_no LIKE ? OR supplier_name LIKE ? LIMIT 10`,
        values: [like, like],
      }).then(([r]) => r),
    ]);

    const results = [...transactions, ...projects, ...purchaseOrders, ...invoices]
      .slice(0, 30);

    sendJson(res, { results, query: q }, responseOptions);
    return true;
  }

  return false;
};
