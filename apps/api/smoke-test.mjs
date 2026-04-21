const baseUrl = process.env.API_BASE_URL || 'http://127.0.0.1:3000';

const checks = [
  { name: 'health', path: '/health' },
  { name: 'modules', path: '/modules' },
  { name: 'root', path: '/' },
  { name: 'users', path: '/users' },
  { name: 'departments', path: '/departments' },
  { name: 'roles', path: '/roles' },
  { name: 'permissions', path: '/permissions' },
  { name: 'ledger.accounts', path: '/ledger/accounts' },
  { name: 'ledger.categories', path: '/ledger/categories' },
  { name: 'ledger.transactions', path: '/ledger/transactions' },
  { name: 'ledger.imports', path: '/ledger/imports' },
  { name: 'ledger.external-transactions', path: '/ledger/external-transactions' },
  { name: 'ledger.matches', path: '/ledger/matches' },
  { name: 'reconciliation.purchase-orders', path: '/reconciliation/purchase-orders' },
  { name: 'reconciliation.payment-requests', path: '/reconciliation/payment-requests' },
  { name: 'reconciliation.delivery-orders', path: '/reconciliation/delivery-orders' },
  { name: 'reconciliation.invoices', path: '/reconciliation/invoices' },
  { name: 'reconciliation.status-snapshots', path: '/reconciliation/status-snapshots' },
  { name: 'reconciliation.relations', path: '/reconciliation/relations' },
  { name: 'product-dev.projects', path: '/product-dev/projects' },
  { name: 'product-dev.quotes', path: '/product-dev/quotes' },
  { name: 'product-dev.profit-calculations', path: '/product-dev/profit-calculations' },
  { name: 'product-dev.sync-records', path: '/product-dev/sync-records' },
];

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

async function runCheck(check) {
  const response = await fetch(`${baseUrl}${check.path}`);
  const rawText = await response.text();

  let body = null;
  try {
    body = JSON.parse(rawText);
  } catch {
    throw new Error(`non-json response: ${rawText.slice(0, 120)}`);
  }

  if (!response.ok) {
    throw new Error(`http ${response.status}: ${body?.message || rawText}`);
  }

  if (!isObject(body)) {
    throw new Error('response body is not an object');
  }

  if (!('data' in body)) {
    throw new Error('response body missing data field');
  }

  return {
    status: response.status,
    message: body.message || 'ok',
  };
}

async function main() {
  console.log(`Smoke testing API base URL: ${baseUrl}`);

  let failed = 0;

  for (const check of checks) {
    try {
      const result = await runCheck(check);
      console.log(`PASS ${check.name} -> ${result.status} ${result.message}`);
    } catch (error) {
      failed += 1;
      console.error(`FAIL ${check.name} -> ${error.message}`);
    }
  }

  if (failed > 0) {
    console.error(`\nSmoke test failed: ${failed} endpoint(s) failed.`);
    process.exit(1);
  }

  console.log(`\nSmoke test passed: ${checks.length} endpoint(s) ok.`);
}

main().catch((error) => {
  console.error(`Smoke test crashed: ${error.message}`);
  process.exit(1);
});
