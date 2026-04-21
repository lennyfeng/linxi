const base = process.env.API_BASE_URL || 'http://127.0.0.1:3000';
const tag = `reg-${Date.now()}`;

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

async function expectErr(method, path, body, status = 400, msg = 'invalid_request') {
  const res = await fetch(`${base}${path}`, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body == null ? undefined : JSON.stringify(body),
  });
  const json = await res.json();
  ok(res.status === status, `${method} ${path} expected ${status}, got ${res.status}`);
  ok(json?.message === msg, `${method} ${path} expected ${msg}, got ${json?.message}`);
}

async function ledger() {
  console.log('\n[ledger]');
  await expectErr('POST', '/ledger/accounts', { openingBalance: 1 });
  await expectErr('POST', '/ledger/transactions', { amount: -1 });

  const acc = await req('POST', '/ledger/accounts', {
    accountName: `回归账户-${tag}`,
    openingBalance: 1000,
    currentBalance: 1000,
    remark: 'write regression',
  }, 201);
  ok(acc?.id, 'account missing id');

  const cat = await req('POST', '/ledger/categories', {
    categoryName: `回归分类-${tag}`,
    categoryType: 'expense',
    sortNo: 9999,
  }, 201);
  ok(cat?.id, 'category missing id');

  const txn = await req('POST', '/ledger/transactions', {
    transactionNo: `TXN-${tag}`,
    accountId: acc.id,
    categoryId: cat.id,
    amount: 88.6,
    amountCny: 88.6,
    counterpartyName: '回归供应商',
    summary: 'write regression txn',
    invoiceRequired: 1,
  }, 201);
  ok(txn?.id, 'transaction missing id');

  const att = await req('POST', `/ledger/transactions/${txn.id}/attachments`, {
    fileName: `${tag}.jpg`,
    fileUrl: `https://example.com/${tag}.jpg`,
  }, 201);
  ok(att?.id, 'attachment missing id');

  const detail = await req('GET', `/ledger/transactions/${txn.id}`);
  ok(detail?.transaction?.id === txn.id, 'transaction detail mismatch');
  ok(Array.isArray(detail?.attachments) && detail.attachments.some((x) => x.id === att.id), 'attachment not found');

  const imp = await req('POST', '/ledger/imports', {
    batchNo: `IMP-${tag}`,
    fileName: `${tag}.xlsx`,
    importedBy: 1,
  }, 201);
  ok(imp?.id, 'import batch missing id');
  ok((await req('GET', `/ledger/imports/${imp.id}`))?.batch?.id === imp.id, 'import detail mismatch');

  console.log(`PASS account=${acc.id} category=${cat.id} transaction=${txn.id} import=${imp.id}`);
}

async function productDev() {
  console.log('\n[product-dev]');
  await expectErr('POST', '/product-dev/projects', { targetPrice: 10 });

  const project = await req('POST', '/product-dev/projects', {
    projectCode: `NP-${tag}`,
    productName: `回归新品-${tag}`,
    sku: `SKU-${tag}`,
    targetPlatform: 'Amazon',
    targetMarket: 'US',
    estimatedCost: 15.2,
    targetPrice: 29.9,
    grossMarginTarget: 0.32,
  }, 201);
  ok(project?.id, 'project missing id');

  ok((await req('PUT', `/product-dev/projects/${project.id}`, {
    projectCode: `NP-${tag}-U`,
    productName: `回归新品更新-${tag}`,
    sku: `SKU-${tag}`,
    targetPlatform: 'Amazon',
    targetMarket: 'EU',
    estimatedCost: 16.8,
    targetPrice: 31.5,
    grossMarginTarget: 0.35,
    projectStatus: '打样中',
  }))?.id === project.id, 'project update mismatch');

  const quote = await req('POST', '/product-dev/quotes', {
    projectId: project.id,
    supplierName: `回归供应商-${tag}`,
    quotePrice: 10.5,
    moq: 200,
    deliveryDays: 18,
    preferred: 1,
  }, 201);
  const profit = await req('POST', '/product-dev/profit-calculations', {
    projectId: project.id,
    salesPriceUsd: 14.9,
    exchangeRate: 7.2,
    productCostRmb: 11.2,
    accessoryCostRmb: 0.8,
    shippingAir: 9,
    selectedPlan: 'air',
    selectedProfit: 16.2,
    selectedProfitRate: 0.19,
  }, 201);
  const sample = await req('POST', '/product-dev/samples', {
    projectId: project.id,
    roundNo: 1,
    supplierName: `打样供应商-${tag}`,
    sampleFee: 168,
    reviewResult: 'pending',
  }, 201);
  const sync = await req('POST', '/product-dev/sync-records', {
    projectId: project.id,
    syncStatus: 'pending',
    syncedBy: 'regression-script',
    syncTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
  }, 201);

  ok(quote?.id && profit?.id && sample?.id && sync?.id, 'child record creation failed');

  await req('PUT', `/product-dev/quotes/${quote.id}`, {
    projectId: project.id,
    supplierName: `回归供应商更新-${tag}`,
    quotePrice: 11.2,
    moq: 240,
    deliveryDays: 20,
    preferred: 0,
  });
  await req('PUT', `/product-dev/profit-calculations/${profit.id}`, {
    projectId: project.id,
    salesPriceUsd: 15.5,
    exchangeRate: 7.18,
    productCostRmb: 11.8,
    accessoryCostRmb: 1.2,
    shippingSea: 4,
    selectedPlan: 'sea',
    selectedProfit: 18.8,
    selectedProfitRate: 0.21,
  });
  await req('PUT', `/product-dev/samples/${sample.id}`, {
    projectId: project.id,
    roundNo: 2,
    supplierName: `打样供应商更新-${tag}`,
    sampleFee: 188,
    reviewResult: 'approved',
  });
  await req('PUT', `/product-dev/sync-records/${sync.id}`, {
    projectId: project.id,
    syncStatus: 'success',
    syncedBy: 'regression-script',
    syncTime: new Date().toISOString().slice(0, 19).replace('T', ' '),
    resultMessage: 'sync ok',
  });

  const detail = await req('GET', `/product-dev/projects/${project.id}`);
  ok(detail?.project?.id === project.id, 'project detail mismatch');
  ok(detail.quotes.some((x) => x.id === quote.id), 'quote missing in detail');
  ok(detail.profitCalculations.some((x) => x.id === profit.id), 'profit missing in detail');
  ok(detail.sampleRecords.some((x) => x.id === sample.id), 'sample missing in detail');
  ok(detail.syncRecords.some((x) => x.id === sync.id), 'sync missing in detail');

  await req('DELETE', `/product-dev/sync-records/${sync.id}`);
  await req('DELETE', `/product-dev/samples/${sample.id}`);
  await req('DELETE', `/product-dev/profit-calculations/${profit.id}`);
  await req('DELETE', `/product-dev/quotes/${quote.id}`);
  ok((await req('DELETE', `/product-dev/projects/${project.id}`))?.deleted === true, 'project delete failed');

  console.log(`PASS project=${project.id} quote=${quote.id} profit=${profit.id} sample=${sample.id} sync=${sync.id}`);
}

async function reconciliation() {
  console.log('\n[reconciliation]');
  const [invoices, pos, prs, dos] = await Promise.all([
    req('GET', '/reconciliation/invoices'),
    req('GET', '/reconciliation/purchase-orders'),
    req('GET', '/reconciliation/payment-requests'),
    req('GET', '/reconciliation/delivery-orders'),
  ]);
  const invoice = invoices[0], po = pos[0], pr = prs[0], del = dos[0];
  if (!invoice || !po || !pr || !del) {
    console.log('SKIP missing prerequisite seeded records');
    return;
  }

  const a = Math.min(Number(invoice.amount || 0), Number(po.amount || 0), 1);
  const b = Math.min(Number(invoice.amount || 0), Number(pr.amount || 0), 1);
  const c = Math.min(Number(invoice.amount || 0), Number(del.amount || 0), 1);
  ok(a > 0 && b > 0 && c > 0, 'prerequisite amounts must be positive');

  const rp = await req('POST', '/reconciliation/relations/purchase', {
    invoiceId: invoice.id, purchaseOrderId: po.id, relationAmount: a, remark: tag,
  }, 201);
  const rr = await req('POST', '/reconciliation/relations/payment-requests', {
    invoiceId: invoice.id, paymentRequestId: pr.id, relationAmount: b, remark: tag,
  }, 201);
  const rd = await req('POST', '/reconciliation/relations/delivery', {
    invoiceId: invoice.id, deliveryOrderId: del.id, relationAmount: c, remark: tag,
  }, 201);

  await req('PUT', `/reconciliation/relations/purchase/${rp.relation.id}`, {
    invoiceId: invoice.id, purchaseOrderId: po.id, relationAmount: a, remark: `${tag}-u`,
  });
  await req('PUT', `/reconciliation/relations/payment-requests/${rr.relation.id}`, {
    invoiceId: invoice.id, paymentRequestId: pr.id, relationAmount: b, remark: `${tag}-u`,
  });
  await req('PUT', `/reconciliation/relations/delivery/${rd.relation.id}`, {
    invoiceId: invoice.id, deliveryOrderId: del.id, relationAmount: c, remark: `${tag}-u`,
  });

  const all = await req('GET', '/reconciliation/relations');
  ok(all.invoicePurchaseRelations.some((x) => x.id === rp.relation.id), 'purchase relation missing');
  ok(all.invoicePaymentRequestRelations.some((x) => x.id === rr.relation.id), 'payment relation missing');
  ok(all.invoiceDeliveryRelations.some((x) => x.id === rd.relation.id), 'delivery relation missing');

  await req('DELETE', `/reconciliation/relations/delivery/${rd.relation.id}`);
  await req('DELETE', `/reconciliation/relations/payment-requests/${rr.relation.id}`);
  await req('DELETE', `/reconciliation/relations/purchase/${rp.relation.id}`);

  console.log(`PASS invoice=${invoice.id} purchase=${rp.relation.id} payment=${rr.relation.id} delivery=${rd.relation.id}`);
}

async function main() {
  console.log(`Write regression testing: ${base}`);
  console.log(`Run tag: ${tag}`);
  await req('GET', '/health');
  await ledger();
  await productDev();
  await reconciliation();
  console.log('\nWrite regression passed.');
}

main().catch((e) => {
  console.error(`\nWrite regression failed: ${e.message}`);
  process.exit(1);
});
