import type { IncomingMessage, ServerResponse } from 'http';
import { getPool } from '../../database/pool.js';
import type { RowDataPacket } from 'mysql2';

interface SyncJobRow extends RowDataPacket {
  id: number;
  name: string;
  job_type: string;
  status: string;
  last_run_at: string | null;
  next_run_at: string | null;
  retry_count: number;
  interval_seconds: number | null;
}

interface SyncJobLogRow extends RowDataPacket {
  id: number;
  status: string;
  started_at: string;
  finished_at: string | null;
  duration_ms: number | null;
  records_processed: number | null;
  error_message: string | null;
}

export async function handleSyncJobsRoute(
  req: IncomingMessage,
  res: ServerResponse,
  pathname: string,
) {
  const pool = getPool();

  // GET /api/sync-jobs
  if (req.method === 'GET' && pathname === '/api/sync-jobs') {
    const [rows] = await pool.query<SyncJobRow[]>(
      'SELECT id, name, job_type, status, last_run_at, next_run_at, retry_count, interval_seconds FROM sync_jobs ORDER BY id',
    );
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code: 0, message: 'ok', data: rows, requestId: '' }));
    return;
  }

  // POST /api/sync-jobs/:id/trigger
  const triggerMatch = pathname.match(/^\/api\/sync-jobs\/(\d+)\/trigger$/);
  if (req.method === 'POST' && triggerMatch) {
    const jobId = Number(triggerMatch[1]);
    await pool.execute(
      `UPDATE sync_jobs SET next_run_at = NOW(), status = 'idle' WHERE id = ?`,
      [jobId],
    );
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code: 0, message: 'Job triggered', data: null, requestId: '' }));
    return;
  }

  // GET /api/sync-jobs/:id/logs
  const logsMatch = pathname.match(/^\/api\/sync-jobs\/(\d+)\/logs$/);
  if (req.method === 'GET' && logsMatch) {
    const jobId = Number(logsMatch[1]);
    const [rows] = await pool.query<SyncJobLogRow[]>(
      'SELECT id, status, started_at, finished_at, duration_ms, records_processed, error_message FROM sync_job_logs WHERE job_id = ? ORDER BY started_at DESC LIMIT 50',
      [jobId],
    );
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ code: 0, message: 'ok', data: rows, requestId: '' }));
    return;
  }

  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ code: 404, message: 'Not found' }));
}
