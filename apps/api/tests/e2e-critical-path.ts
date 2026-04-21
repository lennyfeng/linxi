/**
 * E2E Critical Path Test
 *
 * Flow: Login → Create Transaction → List Transactions →
 *       List POs → List Invoices → Create Project → List Projects
 *
 * Run: npx tsx tests/e2e-critical-path.ts
 */

const API_BASE = process.env.API_BASE || 'http://localhost:3100';

async function json(method: string, path: string, opts?: { body?: any; token?: string }) {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (opts?.token) headers['Authorization'] = `Bearer ${opts.token}`;

  const res = await fetch(`${API_BASE}${path}`, {
    method,
    headers,
    body: opts?.body ? JSON.stringify(opts.body) : undefined,
  });

  const data = await res.json().catch(() => null);
  return { status: res.status, data };
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(`ASSERTION FAILED: ${msg}`);
  console.log(`  ✅ ${msg}`);
}

async function run() {
  console.log('=== E2E Critical Path Test ===\n');

  // Step 1: Login
  console.log('Step 1: Login');
  const loginRes = await json('POST', '/auth/login', { body: { username: 'admin', password: 'admin123' } });
  assert(loginRes.status === 200, 'Login returns 200');
  const token = loginRes.data?.data?.token;
  assert(!!token, 'Login returns a token');

  // Step 2: Create transaction
  console.log('\nStep 2: Create Transaction');
  const txRes = await json('POST', '/ledger/transactions', {
    token,
    body: {
      transactionDate: new Date().toISOString().split('T')[0],
      type: 'expense',
      amount: 100.50,
      currency: 'CNY',
      categoryId: 1,
      accountId: 1,
      description: 'E2E test transaction',
      counterparty: 'E2E Vendor',
    },
  });
  assert(txRes.status === 200 || txRes.status === 201, `Create transaction returns ${txRes.status}`);

  // Step 3: List transactions
  console.log('\nStep 3: List Transactions');
  const txListRes = await json('GET', '/ledger/transactions', { token });
  assert(txListRes.status === 200, 'List transactions returns 200');

  // Step 4: Reconciliation - list POs
  console.log('\nStep 4: List Purchase Orders');
  const poRes = await json('GET', '/reconciliation/purchase-orders', { token });
  assert(poRes.status === 200, 'List POs returns 200');

  // Step 5: Reconciliation - list invoices
  console.log('\nStep 5: List Invoices');
  const invRes = await json('GET', '/reconciliation/invoices', { token });
  assert(invRes.status === 200, 'List invoices returns 200');

  // Step 6: Create project
  console.log('\nStep 6: Create Project');
  const projRes = await json('POST', '/product-dev/projects', {
    token,
    body: {
      productName: 'E2E Test Product',
      sku: 'E2E-SKU-001',
      developerName: 'E2E Tester',
      targetPlatform: 'Amazon US',
      estimatedCost: 50,
      targetPrice: 19.99,
    },
  });
  assert(projRes.status === 200 || projRes.status === 201, `Create project returns ${projRes.status}`);

  // Step 7: List projects
  console.log('\nStep 7: List Projects');
  const projListRes = await json('GET', '/product-dev/projects', { token });
  assert(projListRes.status === 200, 'List projects returns 200');

  // Step 8: Dashboard
  console.log('\nStep 8: Dashboard');
  const dashRes = await json('GET', '/dashboard', { token });
  assert(dashRes.status === 200, 'Dashboard returns 200');

  // Step 9: Search
  console.log('\nStep 9: Global Search');
  const searchRes = await json('GET', '/search?q=E2E', { token });
  assert(searchRes.status === 200, 'Search returns 200');

  console.log('\n=== All E2E tests passed! ===');
}

run().catch((err) => {
  console.error(`\n❌ ${err.message}`);
  process.exit(1);
});
