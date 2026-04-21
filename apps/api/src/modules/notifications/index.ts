import { getPool } from '../../database/pool.js';
import { readJsonBody } from '../../common/http.js';
import { getIdFromPath } from '../../common/route.js';
import { sendJson } from '../../common/send.js';
import type { RouteHandler } from '../../common/types.js';
import type { RowDataPacket } from 'mysql2';

export const notificationsModule = {
  name: 'notifications',
  description: 'Notification CRUD and unread count',
  routes: ['/notifications', '/notifications/:id', '/notifications/unread-count'],
};

export const handleNotificationsRoutes: RouteHandler = async (req, res, url, ctx) => {
  const responseOptions = { requestId: ctx.requestId };
  const pool = getPool();
  const userId = ctx.operator?.id;

  // GET /notifications?page=&pageSize=
  if (req.method === 'GET' && url.pathname === '/notifications') {
    const page = Number(url.searchParams.get('page') || 1);
    const pageSize = Math.min(Number(url.searchParams.get('pageSize') || 20), 100);
    const offset = (page - 1) * pageSize;

    const where = userId ? 'WHERE user_id = ?' : '';
    const params = userId ? [userId, pageSize, offset] : [pageSize, offset];
    const [rows] = await pool.query<RowDataPacket[]>({
      sql: `SELECT id, user_id, type, title, content, link, is_read, created_at FROM notifications ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      values: params,
    });
    const [countResult] = await pool.query<RowDataPacket[]>({
      sql: `SELECT COUNT(*) AS total FROM notifications ${where}`,
      values: userId ? [userId] : [],
    });
    sendJson(res, { items: rows, total: countResult[0]?.total ?? 0, page, pageSize }, responseOptions);
    return true;
  }

  // GET /notifications/unread-count
  if (req.method === 'GET' && url.pathname === '/notifications/unread-count') {
    if (!userId) { sendJson(res, { count: 0 }, responseOptions); return true; }
    const [result] = await pool.query<RowDataPacket[]>({
      sql: `SELECT COUNT(*) AS cnt FROM notifications WHERE user_id = ? AND is_read = 0`,
      values: [userId],
    });
    sendJson(res, { count: result[0]?.cnt ?? 0 }, responseOptions);
    return true;
  }

  // POST /notifications (create)
  if (req.method === 'POST' && url.pathname === '/notifications') {
    const body = await readJsonBody(req);
    await pool.execute({
      sql: `INSERT INTO notifications (user_id, type, title, content, link) VALUES (?, ?, ?, ?, ?)`,
      values: [body.userId ?? userId, body.type || 'system', body.title, body.content || null, body.link || null],
    });
    sendJson(res, { success: true }, { ...responseOptions, statusCode: 201 });
    return true;
  }

  // PUT /notifications/:id/read
  if (req.method === 'PUT' && url.pathname.match(/^\/notifications\/\d+\/read$/)) {
    const id = Number(url.pathname.split('/')[2]);
    await pool.execute({ sql: `UPDATE notifications SET is_read = 1 WHERE id = ?`, values: [id] });
    sendJson(res, { success: true }, responseOptions);
    return true;
  }

  // PUT /notifications/read-all
  if (req.method === 'PUT' && url.pathname === '/notifications/read-all') {
    if (userId) {
      await pool.execute({ sql: `UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0`, values: [userId] });
    }
    sendJson(res, { success: true }, responseOptions);
    return true;
  }

  // DELETE /notifications/:id
  if (req.method === 'DELETE' && url.pathname.match(/^\/notifications\/\d+$/)) {
    const id = getIdFromPath(url.pathname, '/notifications/');
    await pool.execute({ sql: `DELETE FROM notifications WHERE id = ?`, values: [id] });
    sendJson(res, { success: true }, responseOptions);
    return true;
  }

  return false;
};
