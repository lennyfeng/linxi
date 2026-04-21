import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

async function migrate() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || '127.0.0.1',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'metabase',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'internal_platform',
    multipleStatements: true,
  });

  console.log('Connected to database, running migrations...');

  // Create migrations tracking table
  await connection.execute(`
    CREATE TABLE IF NOT EXISTS _migrations (
      id INT UNSIGNED NOT NULL AUTO_INCREMENT,
      filename VARCHAR(200) NOT NULL,
      executed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      PRIMARY KEY (id),
      UNIQUE KEY uk_filename (filename)
    ) ENGINE=InnoDB
  `);

  const migrationsDir = path.join(__dirname, 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  const [rows] = await connection.execute('SELECT filename FROM _migrations');
  const executed = new Set((rows as Array<{ filename: string }>).map((r) => r.filename));

  for (const file of files) {
    if (executed.has(file)) {
      console.log(`  SKIP: ${file} (already executed)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    console.log(`  RUN:  ${file}`);

    try {
      await connection.query(sql);
      await connection.execute('INSERT INTO _migrations (filename) VALUES (?)', [file]);
      console.log(`  DONE: ${file}`);
    } catch (err) {
      console.error(`  FAIL: ${file}`, err);
      throw err;
    }
  }

  console.log('All migrations completed.');
  await connection.end();
}

migrate().catch((err) => {
  console.error('Migration failed:', err);
  process.exit(1);
});
