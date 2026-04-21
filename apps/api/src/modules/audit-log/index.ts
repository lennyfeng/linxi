import { getPool } from '../../database/pool.js';
import { sendJson } from '../../common/send.js';
import type { RouteHandler } from '../../common/types.js';
import type { RowDataPacket } from 'mysql2';

export const auditLogModule = {
  name: 'audit-log',
  description: 'Audit log query API',
  routes: ['/audit-logs'],
};

export const handleAuditLogRoutes: RouteHandler = async (req, res, url, ctx) => {
  const responseOptions = { requestId: ctx.requestId };

  if (req.method === 'GET' && url.pathname === '/audit-logs') {
    const pool = getPool();
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Math.min(Number(url.searchParams.get('pageSize') || 20), 100);
    const offset = (page - 1) * pageSize;

    const conditions: string[] = ['1=1'];
    const params: unknown[] = [];

    const userId = url.searchParams.get('userId');
    if (userId) { conditions.push('user_id = ?'); params.push(Number(userId)); }

    const module = url.searchParams.get('module');
    if (module) { conditions.push('module = ?'); params.push(module); }

    const action = url.searchParams.get('action');
    if (action) { conditions.push('action = ?'); params.push(action); }

    const entityType = url.searchParams.get('entityType');
    if (entityType) { conditions.push('entity_type = ?'); params.push(entityType); }

    const startDate = url.searchParams.get('startDate');
    if (startDate) { conditions.push('created_at >= ?'); params.push(startDate); }

    const endDate = url.searchParams.get('endDate');
    if (endDate) { conditions.push('created_at <= ?'); params.push(endDate + ' 23:59:59'); }

    const where = conditions.join(' AND ');

    const countParams = [...params];
    params.push(pageSize, offset);

    const [rows] = await pool.query<RowDataPacket[]>({
      sql: `SELECT id, user_id, action, module, entity_type, entity_id, before_data, after_data, ip_address, created_at
            FROM audit_logs WHERE ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      values: params,
    });

    const [countResult] = await pool.query<RowDataPacket[]>({
      sql: `SELECT COUNT(*) AS total FROM audit_logs WHERE ${where}`,
      values: countParams,
    });

    sendJson(res, { items: rows, total: countResult[0]?.total ?? 0, page, pageSize }, responseOptions);
    return true;
  }

  return false;
};
