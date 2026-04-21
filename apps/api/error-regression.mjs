const base = process.env.API_BASE_URL || 'http://127.0.0.1:3000';
const tag = `err-${Date.now()}`;

const ok = (c, m) => {
  if (!c) throw new Error(m);
};

async function req(method, path, body, expected = 200) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${method} ${path} non-json: ${text.slice(0, 120)}`);
  }
  if (res.status !== expected) {
    throw new Error(`${method} ${path} expected ${expected}, got ${res.status}: ${json?.message || text}`);
  }
  ok(json && typeof json === 'object' && 'data' in json, `${method} ${path} invalid envelope`);
  return json.data;
}

async function expectErr(method, path, body, status, message, field, reason) {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`${method} ${path} expected json error, got: ${text.slice(0, 120)}`);
  }
  ok(res.status === status, `${method} ${path} expected ${status}, got ${res.status}`);
  ok(json?.message === message, `${method} ${path} expected message ${message}, got ${json?.message}`);
  if (field) ok(json?.data?.field === field, `${method} ${path} expected field ${field}, got ${json?.data?.field}`);
  if (reason) ok(json?.data?.reason === reason, `${method} ${path} expected reason ${reason}, got ${json?.data?.reason}`);
  return json;
}

async function ledgerErrors() {
  console.log('\n[ledger-errors]');
  await expectErr('POST', '/ledger/accounts', { accountName: `坏账户-${tag}`, openingBalance: -1 }, 400, 'invalid_request', 'openingBalance', 'must_be_non_negative');
  await expectErr('POST', '/ledger/categories', { categoryName: `坏分类-${tag}`, parentId: 999999 }, 400, 'invalid_request', 'parentId', 'not_found');
  await expectErr('POST', '/ledger/transactions', { accountId: 999999, amount: 1 }, 400, 'invalid_request', 'accountId', 'not_found');
  await expectErr('POST', '/ledger/transactions', { amount: -10 }, 400, 'invalid_request', 'amount', 'must_be_non_negative');
  await expectErr('POST', '/ledger/transactions/999999/attachments', { fileUrl: 'https://example.com/x.jpg' }, 404, 'resource_not_found', 'transactionId');
  console.log('PASS negative/account/category/not-found branches');
}

async function productDevErrors() {
  console.log('\n[product-dev-errors]');
  await expectErr('POST', '/product-dev/projects', { productName: `坏项目-${tag}`, estimatedCost: -1 }, 400, 'invalid_request', 'estimatedCost', 'must_be_non_negative');
  await expectErr('POST', '/product-dev/quotes', { projectId: 999999, supplierName: '坏供应商', quotePrice: 1 }, 404, 'resource_not_found', 'projectId');
  await expectErr('PUT', '/product-dev/projects/999999', { productName: `不存在项目-${tag}` }, 404, 'resource_not_found', 'id');

  const project = await req('POST', '/product-dev/projects', {
    projectCode: `NP-E-${tag}`,
    productName: `删除保护项目-${tag}`,
    sku: `SKU-E-${tag}`,
    estimatedCost: 10,
    targetPrice: 20,
  }, 201);
  const quote = await req('POST', '/product-dev/quotes', {
    projectId: project.id,
    supplierName: `删除保护供应商-${tag}`,
    quotePrice: 6.6,
  }, 201);

  await expectErr('DELETE', `/product-dev/projects/${project.id}`, null, 400, 'invalid_request', 'id', 'has_child_records');

  await req('DELETE', `/product-dev/quotes/${quote.id}`);
  ok((await req('DELETE', `/product-dev/projects/${project.id}`))?.deleted === true, 'cleanup project delete failed');
  console.log('PASS project child-delete protection and not-found branches');
}

async function reconciliationErrors() {
  console.log('\n[reconciliation-errors]');
  const [invoices, pos, prs, dos] = await Promise.all([
    req('GET', '/reconciliation/invoices'),
    req('GET', '/reconciliation/purchase-orders'),
    req('GET', '/reconciliation/payment-requests'),
    req('GET', '/reconciliation/delivery-orders'),
  ]);
  const invoice = invoices[0], po = pos[0], pr = prs[0], del = dos[0];
  ok(invoice && po && pr && del, 'reconciliation seed data missing');

  await expectErr('POST', '/reconciliation/relations/purchase', {
    invoiceId: invoice.id,
    purchaseOrderId: po.id,
    relationAmount: Number(po.amount || 0) + 1,
  }, 400, 'invalid_request', 'relationAmount', 'exceeds_purchase_order_amount');

  const purchase = await req('POST', '/reconciliation/relations/purchase', {
    invoiceId: invoice.id,
    purchaseOrderId: po.id,
    relationAmount: 1,
    remark: tag,
  }, 201);
  await expectErr('POST', '/reconciliation/relations/purchase', {
    invoiceId: invoice.id,
    purchaseOrderId: po.id,
    relationAmount: 1,
    remark: `${tag}-dup`,
  }, 400, 'invalid_request', 'relation', 'duplicate');
  await req('DELETE', `/reconciliation/relations/purchase/${purchase.relation.id}`);
  await expectErr('DELETE', '/reconciliation/relations/purchase/999999', null, 404, 'resource_not_found', 'id');

  await expectErr('POST', '/reconciliation/relations/payment-requests', {
    invoiceId: invoice.id,
    paymentRequestId: pr.id,
    relationAmount: Number(pr.amount || 0) + 1,
  }, 400, 'invalid_request', 'relationAmount', 'exceeds_payment_request_amount');

  const payment = await req('POST', '/reconciliation/relations/payment-requests', {
    invoiceId: invoice.id,
    paymentRequestId: pr.id,
    relationAmount: 1,
    remark: tag,
  }, 201);
  await expectErr('POST', '/reconciliation/relations/payment-requests', {
    invoiceId: invoice.id,
    paymentRequestId: pr.id,
    relationAmount: 1,
    remark: `${tag}-dup`,
  }, 400, 'invalid_request', 'relation', 'duplicate');
  await req('DELETE', `/reconciliation/relations/payment-requests/${payment.relation.id}`);
  await expectErr('DELETE', '/reconciliation/relations/payment-requests/999999', null, 404, 'resource_not_found', 'id');

  await expectErr('POST', '/reconciliation/relations/delivery', {
    invoiceId: invoice.id,
    deliveryOrderId: del.id,
    relationAmount: Number(del.amount || 0) + 1,
  }, 400, 'invalid_request', 'relationAmount', 'exceeds_delivery_order_amount');

  const delivery = await req('POST', '/reconciliation/relations/delivery', {
    invoiceId: invoice.id,
    deliveryOrderId: del.id,
    relationAmount: 1,
    remark: tag,
  }, 201);
  await expectErr('POST', '/reconciliation/relations/delivery', {
    invoiceId: invoice.id,
    deliveryOrderId: del.id,
    relationAmount: 1,
    remark: `${tag}-dup`,
  }, 400, 'invalid_request', 'relation', 'duplicate');
  await req('DELETE', `/reconciliation/relations/delivery/${delivery.relation.id}`);
  await expectErr('DELETE', '/reconciliation/relations/delivery/999999', null, 404, 'resource_not_found', 'id');

  console.log('PASS duplicate/exceed/delete-not-found branches');
}

async function main() {
  console.log(`Error regression testing: ${base}`);
  console.log(`Run tag: ${tag}`);
  await req('GET', '/health');
  await ledgerErrors();
  await productDevErrors();
  await reconciliationErrors();
  console.log('\nError regression passed.');
}

main().catch((e) => {
  console.error(`\nError regression failed: ${e.message}`);
  process.exit(1);
});
