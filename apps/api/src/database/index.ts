import mysql, { type Pool } from 'mysql2/promise';
import { getAppConfig } from '../config/app.config.js';
import { ErrorCodes } from '../common/error-codes.js';
import { AppError } from '../common/errors.js';

export type DbRow = Record<string, unknown>;

let pool: Pool | null = null;
let lastHealthStatus = 'not_checked';
let lastHealthError = '';

function getPool() {
  if (pool) return pool;

  const config = getAppConfig();

  pool = mysql.createPool({
    host: config.db.host,
    port: config.db.port,
    database: config.db.name,
    user: config.db.user,
    password: config.db.password,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
  });

  return pool;
}

export async function getDatabaseHealth() {
  const config = getAppConfig();

  try {
    const db = getPool();
    const connection = await db.getConnection();
    connection.release();
    lastHealthStatus = 'connected';
    lastHealthError = '';
  } catch (error) {
    lastHealthStatus = 'connection_failed';
    lastHealthError = error instanceof Error ? error.message : 'unknown_database_error';
  }

  return {
    driver: 'mysql2',
    host: config.db.host,
    port: config.db.port,
    database: config.db.name,
    status: lastHealthStatus,
    error: lastHealthError,
  };
}

export async function query<T = DbRow>(sql: string, params: unknown[] = []): Promise<T[]> {
  try {
    const db = getPool();
    const [rows] = await db.query(sql, params);
    return rows as T[];
  } catch (error) {
    throw new AppError(500, 'database_error', { details: error instanceof Error ? error.message : null }, ErrorCodes.DATABASE_ERROR);
  }
}
