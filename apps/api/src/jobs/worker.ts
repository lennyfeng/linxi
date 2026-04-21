import { getPool } from '../database/pool.js';
import { getJobHandler } from './registry.js';
import type { RowDataPacket, ResultSetHeader } from 'mysql2';

const POLL_INTERVAL_MS = 30_000;
const MAX_RETRIES = 3;

interface SyncJobRow extends RowDataPacket {
  id: number;
  job_type: string;
  config: string | null;
  retry_count: number;
  max_retries: number;
}

async function pickAndRunJobs() {
  const pool = getPool();

  // Pick due jobs that are idle and overdue
  const [jobs] = await pool.query<SyncJobRow[]>(
    `SELECT id, job_type, config, retry_count, max_retries
     FROM sync_jobs
     WHERE status = 'idle'
       AND (next_run_at IS NULL OR next_run_at <= NOW())
     ORDER BY next_run_at ASC
     LIMIT 5`,
  );

  for (const job of jobs) {
    const handler = getJobHandler(job.job_type);
    if (!handler) {
      console.warn(`No handler registered for job type: ${job.job_type}`);
      continue;
    }

    // Mark as running
    await pool.execute(
      `UPDATE sync_jobs SET status = 'running', last_run_at = NOW() WHERE id = ?`,
      [job.id],
    );

    const startedAt = new Date();

    try {
      const config = job.config ? JSON.parse(job.config) : undefined;
      const result = await handler(config);
      const durationMs = Date.now() - startedAt.getTime();

      // Log success
      await pool.execute(
        `INSERT INTO sync_job_logs (job_id, status, started_at, finished_at, duration_ms, records_processed)
         VALUES (?, 'success', ?, NOW(), ?, ?)`,
        [job.id, startedAt, durationMs, result.recordsProcessed],
      );

      // Reset job: idle, reset retry, calculate next run
      await pool.execute(
        `UPDATE sync_jobs
         SET status = 'idle',
             retry_count = 0,
             next_run_at = DATE_ADD(NOW(), INTERVAL COALESCE(interval_seconds, 3600) SECOND)
         WHERE id = ?`,
        [job.id],
      );

      console.log(`Job ${job.job_type} completed: ${result.recordsProcessed} records in ${durationMs}ms`);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : String(err);
      const durationMs = Date.now() - startedAt.getTime();

      // Log failure
      await pool.execute(
        `INSERT INTO sync_job_logs (job_id, status, started_at, finished_at, duration_ms, error_message)
         VALUES (?, 'failed', ?, NOW(), ?, ?)`,
        [job.id, startedAt, durationMs, errorMessage],
      );

      const newRetryCount = job.retry_count + 1;
      if (newRetryCount >= (job.max_retries || MAX_RETRIES)) {
        // Max retries reached → mark as failed
        await pool.execute(
          `UPDATE sync_jobs SET status = 'failed', retry_count = ? WHERE id = ?`,
          [newRetryCount, job.id],
        );
        console.error(`Job ${job.job_type} FAILED permanently after ${newRetryCount} retries: ${errorMessage}`);
      } else {
        // Exponential backoff: 2^retryCount * 60 seconds
        const backoffSeconds = Math.pow(2, newRetryCount) * 60;
        await pool.execute(
          `UPDATE sync_jobs
           SET status = 'idle',
               retry_count = ?,
               next_run_at = DATE_ADD(NOW(), INTERVAL ? SECOND)
           WHERE id = ?`,
          [newRetryCount, backoffSeconds, job.id],
        );
        console.warn(`Job ${job.job_type} failed (retry ${newRetryCount}), backoff ${backoffSeconds}s: ${errorMessage}`);
      }
    }
  }
}

let timer: ReturnType<typeof setInterval> | null = null;

export function startWorker() {
  console.log(`Job worker started, polling every ${POLL_INTERVAL_MS / 1000}s`);
  // Initial run
  pickAndRunJobs().catch(console.error);
  timer = setInterval(() => {
    pickAndRunJobs().catch(console.error);
  }, POLL_INTERVAL_MS);
}

export function stopWorker() {
  if (timer) {
    clearInterval(timer);
    timer = null;
    console.log('Job worker stopped');
  }
}
