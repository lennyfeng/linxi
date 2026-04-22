import { sendJson } from '../../common/send.js';
import type { RouteHandler } from '../../common/types.js';
import { query } from '../../database/index.js';

export const syncJobsModule = {
  name: 'sync-jobs',
  description: 'Sync job scheduling and logs',
  routes: ['/sync-jobs', '/sync-jobs/:id/trigger', '/sync-jobs/:id/logs'],
};

export const handleSyncJobsRoutes: RouteHandler = async (req, res, url, ctx) => {
  const responseOptions = { requestId: ctx.requestId };

  // GET /sync-jobs
  if (req.method === 'GET' && url.pathname === '/sync-jobs') {
    const rows = await query(
      'SELECT id, name, job_type, status, last_run_at, next_run_at, retry_count, interval_seconds FROM sync_jobs ORDER BY id',
    );
    sendJson(res, rows, responseOptions);
    return true;
  }

  // POST /sync-jobs/:id/trigger
  const triggerMatch = url.pathname.match(/^\/sync-jobs\/(\d+)\/trigger$/);
  if (req.method === 'POST' && triggerMatch) {
    const jobId = Number(triggerMatch[1]);
    await query(
      `UPDATE sync_jobs SET next_run_at = NOW(), status = 'idle' WHERE id = ?`,
      [jobId],
    );
    sendJson(res, { message: 'Job triggered' }, responseOptions);
    return true;
  }

  // GET /sync-jobs/:id/logs
  const logsMatch = url.pathname.match(/^\/sync-jobs\/(\d+)\/logs$/);
  if (req.method === 'GET' && logsMatch) {
    const jobId = Number(logsMatch[1]);
    const rows = await query(
      'SELECT id, status, started_at, finished_at, duration_ms, records_processed, error_message FROM sync_job_logs WHERE job_id = ? ORDER BY started_at DESC LIMIT 50',
      [jobId],
    );
    sendJson(res, rows, responseOptions);
    return true;
  }

  return false;
};
