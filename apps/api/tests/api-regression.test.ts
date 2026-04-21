/**
 * API Regression Tests
 *
 * Run: npx tsx tests/api-regression.test.ts
 *
 * Requires:
 *   - API server running on localhost:3100 (or set API_BASE env var)
 *   - Database seeded with at least one user
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3100';

interface TestResult {
  name: string;
  pass: boolean;
  status?: number;
  error?: string;
}

const results: TestResult[] = [];

async function test(name: string, method: string, path: string, options?: {
  body?: Record<string, unknown>;
  token?: string;
  expectedStatus?: number;
}) {
  const { body, token, expectedStatus = 200 } = options ?? {};
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    const pass = res.status === expectedStatus;
    results.push({ name, pass, status: res.status, error: pass ? undefined : `Expected ${expectedStatus}, got ${res.status}` });
  } catch (err: any) {
    results.push({ name, pass: false, error: err.message });
  }
}

async function run() {
  console.log('=== API Regression Tests ===\n');

  // Health
  await test('GET /health', 'GET', '/health');

  // Auth - login to get token
  let token = '';
  try {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'admin123' }),
    });
    const data = await res.json();
    token = data?.data?.token || '';
    results.push({ name: 'POST /auth/login', pass: res.status === 200 && !!token, status: res.status });
  } catch (err: any) {
    results.push({ name: 'POST /auth/login', pass: false, error: err.message });
  }

  // Users
  await test('GET /users', 'GET', '/users', { token });

  // Ledger
  await test('GET /ledger/transactions', 'GET', '/ledger/transactions', { token });
  await test('GET /ledger/categories', 'GET', '/ledger/categories', { token });
  await test('GET /ledger/accounts', 'GET', '/ledger/accounts', { token });

  // Reconciliation
  await test('GET /reconciliation/purchase-orders', 'GET', '/reconciliation/purchase-orders', { token });
  await test('GET /reconciliation/invoices', 'GET', '/reconciliation/invoices', { token });
  await test('GET /reconciliation/alerts', 'GET', '/reconciliation/alerts', { token });
  await test('GET /reconciliation/reports', 'GET', '/reconciliation/reports', { token });

  // Product Dev
  await test('GET /product-dev/projects', 'GET', '/product-dev/projects', { token });

  // Dashboard
  await test('GET /dashboard', 'GET', '/dashboard', { token });

  // Notifications
  await test('GET /notifications', 'GET', '/notifications', { token });
  await test('GET /notifications/unread-count', 'GET', '/notifications/unread-count', { token });

  // Approvals
  await test('GET /approvals', 'GET', '/approvals', { token });

  // Search
  await test('GET /search?q=test', 'GET', '/search?q=test', { token });

  // Audit logs
  await test('GET /audit-logs', 'GET', '/audit-logs', { token });

  // Saved views
  await test('GET /saved-views', 'GET', '/saved-views', { token });

  // Settings
  await test('GET /settings', 'GET', '/settings', { token });

  // Sync jobs
  await test('GET /api/sync-jobs', 'GET', '/api/sync-jobs', { token });

  // Print results
  console.log('');
  let passed = 0;
  let failed = 0;
  for (const r of results) {
    const icon = r.pass ? '✅' : '❌';
    console.log(`${icon} ${r.name} ${r.status ? `(${r.status})` : ''} ${r.error ? `— ${r.error}` : ''}`);
    if (r.pass) passed++; else failed++;
  }

  console.log(`\n${passed} passed, ${failed} failed, ${results.length} total`);
  process.exit(failed > 0 ? 1 : 0);
}

run();
