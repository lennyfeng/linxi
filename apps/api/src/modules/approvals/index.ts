import { getPool } from '../../database/pool.js';
import { readJsonBody } from '../../common/http.js';
import { sendJson } from '../../common/send.js';
import type { RouteHandler } from '../../common/types.js';
import type { RowDataPacket } from 'mysql2';

export const approvalsModule = {
  name: 'approvals',
  description: 'Unified approval center',
  routes: ['/approvals', '/approvals/:id/approve', '/approvals/:id/reject'],
};

export const handleApprovalsRoutes: RouteHandler = async (req, res, url, ctx) => {
  const responseOptions = { requestId: ctx.requestId };
  const pool = getPool();

  // GET /approvals?status=pending|processed|all
  if (req.method === 'GET' && url.pathname === '/approvals') {
    const status = url.searchParams.get('status') || 'pending';
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Math.min(Number(url.searchParams.get('pageSize') || 20), 100);
    const offset = (page - 1) * pageSize;

    let where = '1=1';
    const params: unknown[] = [];

    if (status === 'pending') {
      where += ` AND n.is_read = 0 AND n.type = 'approval'`;
    } else if (status === 'processed') {
      where += ` AND n.is_read = 1 AND n.type = 'approval'`;
    } else {
      where += ` AND n.type = 'approval'`;
    }

    const userId = ctx.operator?.id;
    if (userId) {
      where += ` AND n.user_id = ?`;
      params.push(userId);
    }

    params.push(pageSize, offset);

    const [rows] = await pool.query<RowDataPacket[]>({
      sql: `SELECT n.id, n.user_id, n.title, n.content, n.link, n.is_read, n.created_at
            FROM notifications n WHERE ${where} ORDER BY n.created_at DESC LIMIT ? OFFSET ?`,
      values: params,
    });

    const countParams = userId ? [userId] : [];
    const [countResult] = await pool.query<RowDataPacket[]>({
      sql: `SELECT COUNT(*) AS total FROM notifications n WHERE ${where.replace(/ LIMIT.*/, '')}`,
      values: countParams,
    });

    sendJson(res, { items: rows, total: countResult[0]?.total ?? 0, page, pageSize }, responseOptions);
    return true;
  }

  // POST /approvals/:id/approve
  if (req.method === 'POST' && url.pathname.match(/^\/approvals\/\d+\/approve$/)) {
    const id = Number(url.pathname.split('/')[2]);
    await pool.execute({ sql: `UPDATE notifications SET is_read = 1 WHERE id = ?`, values: [id] });
    sendJson(res, { success: true, action: 'approved' }, responseOptions);
    return true;
  }

  // POST /approvals/:id/reject
  if (req.method === 'POST' && url.pathname.match(/^\/approvals\/\d+\/reject$/)) {
    const id = Number(url.pathname.split('/')[2]);
    const body = await readJsonBody(req);
    await pool.execute({ sql: `UPDATE notifications SET is_read = 1 WHERE id = ?`, values: [id] });
    sendJson(res, { success: true, action: 'rejected', reason: body.reason || null }, responseOptions);
    return true;
  }

  return false;
};
