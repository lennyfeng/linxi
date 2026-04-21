const $ = (id) => document.getElementById(id);

const state = {
  token: localStorage.getItem('token') || '',
  activeTab: 'purchase',
  purchaseOrders: [],
  paymentRequests: [],
  deliveryOrders: [],
  invoices: [],
  statusSnapshots: [],
  selectedId: null,
  detail: null,
};

async function request(path, params = {}) {
  const query = Object.entries(params).filter(([, v]) => v != null && v !== '').map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join('&');
  const response = await fetch(query ? `${path}?${query}` : path, {
    headers: state.token ? { Authorization: `Bearer ${state.token}` } : {},
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.message || 'request_failed');
  return payload.data;
}

async function submitJson(path, body, method = 'POST') {
  const response = await fetch(path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(state.token ? { Authorization: `Bearer ${state.token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.message || 'request_failed');
  return payload.data;
}

async function login() {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin' }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(payload?.message || 'login_failed');
  state.token = payload.data?.access_token || '';
  localStorage.setItem('token', state.token);
  await loadAll();
}

function statusBadge(status) {
  const s = status || 'pending';
  return `<span class="status-badge ${s}">${s}</span>`;
}

async function loadOverview() {
  try {
    const snapshots = await request('/reconciliation/status-snapshots');
    state.statusSnapshots = snapshots || [];
    const matched = snapshots.filter((s) => s.relationStatus === 'matched').length;
    const partial = snapshots.filter((s) => s.relationStatus === 'partial').length;
    const pending = snapshots.filter((s) => s.relationStatus === 'pending').length;
    $('ov-matched').textContent = String(matched);
    $('ov-partial').textContent = String(partial);
    $('ov-pending').textContent = String(pending);

    const relations = await request('/reconciliation/relations');
    const total = (relations.invoicePurchaseRelations?.length || 0)
      + (relations.invoicePaymentRequestRelations?.length || 0)
      + (relations.invoiceDeliveryRelations?.length || 0);
    $('ov-relations').textContent = String(total);
  } catch { /* ignore */ }
}

async function loadList() {
  const tab = state.activeTab;
  let items = [];
  try {
    if (tab === 'purchase') {
      items = await request('/reconciliation/purchase-orders');
      state.purchaseOrders = items;
    } else if (tab === 'payment') {
      items = await request('/reconciliation/payment-requests');
      state.paymentRequests = items;
    } else if (tab === 'delivery') {
      items = await request('/reconciliation/delivery-orders');
      state.deliveryOrders = items;
    } else if (tab === 'invoice') {
      items = await request('/reconciliation/invoices');
      state.invoices = items;
    }
  } catch (error) {
    $('list-hint').textContent = `Load failed: ${error.message}`;
    $('list-hint').classList.add('error-text');
    return;
  }

  $('list-hint').textContent = items.length ? '' : 'No records found.';
  $('list-hint').classList.remove('error-text');
  renderList(items);
}

function renderList(items) {
  const tab = state.activeTab;
  const titles = { purchase: 'Purchase Orders', payment: 'Payment Requests', delivery: 'Delivery Orders', invoice: 'Invoices' };
  $('list-title').textContent = titles[tab] || '';

  let headHtml = '';
  let bodyHtml = '';

  if (tab === 'purchase') {
    headHtml = '<tr><th>Order No</th><th>Supplier</th><th>Amount</th><th>Status</th></tr>';
    bodyHtml = items.map((item) => `<tr data-id="${item.id}" class="${state.selectedId === item.id ? 'selected' : ''}"><td>${item.orderNo}</td><td>${item.supplierName || '--'}</td><td>${Number(item.amount).toLocaleString()}</td><td>${statusBadge(item.invoiceStatus)}</td></tr>`).join('');
  } else if (tab === 'payment') {
    headHtml = '<tr><th>Request No</th><th>Supplier</th><th>Amount</th><th>Status</th></tr>';
    bodyHtml = items.map((item) => `<tr data-id="${item.id}" class="${state.selectedId === item.id ? 'selected' : ''}"><td>${item.requestNo}</td><td>${item.supplierName || '--'}</td><td>${Number(item.amount).toLocaleString()}</td><td>${statusBadge(item.invoiceStatus)}</td></tr>`).join('');
  } else if (tab === 'delivery') {
    headHtml = '<tr><th>Order No</th><th>Supplier</th><th>Amount</th><th>Status</th></tr>';
    bodyHtml = items.map((item) => `<tr data-id="${item.id}" class="${state.selectedId === item.id ? 'selected' : ''}"><td>${item.orderNo}</td><td>${item.supplierName || '--'}</td><td>${Number(item.amount).toLocaleString()}</td><td>${statusBadge(item.invoiceStatus)}</td></tr>`).join('');
  } else if (tab === 'invoice') {
    headHtml = '<tr><th>Invoice No</th><th>Type</th><th>Amount</th><th>Status</th></tr>';
    bodyHtml = items.map((item) => `<tr data-id="${item.id}" class="${state.selectedId === item.id ? 'selected' : ''}"><td>${item.invoiceNo}</td><td>${item.invoiceType || '--'}</td><td>${Number(item.amount).toLocaleString()}</td><td>${statusBadge(item.matchStatus)}</td></tr>`).join('');
  }

  $('list-thead').innerHTML = headHtml;
  $('list-tbody').innerHTML = bodyHtml;

  $('list-tbody').querySelectorAll('tr[data-id]').forEach((tr) => {
    tr.addEventListener('click', () => {
      state.selectedId = Number(tr.dataset.id);
      renderList(items);
      loadDetail();
    });
  });
}

async function loadDetail() {
  if (!state.selectedId) return;
  const tab = state.activeTab;
  $('detail-content').innerHTML = '<p class="hint-text">Loading detail...</p>';

  try {
    let detail;
    if (tab === 'purchase') {
      detail = await request(`/reconciliation/purchase-orders/${state.selectedId}`);
      renderPurchaseDetail(detail);
    } else if (tab === 'payment') {
      detail = await request(`/reconciliation/payment-requests/${state.selectedId}`);
      renderPaymentDetail(detail);
    } else if (tab === 'delivery') {
      detail = await request(`/reconciliation/delivery-orders/${state.selectedId}`);
      renderDeliveryDetail(detail);
    } else if (tab === 'invoice') {
      detail = await request(`/reconciliation/invoices/${state.selectedId}`);
      renderInvoiceDetail(detail);
    }
    state.detail = detail;
  } catch (error) {
    $('detail-content').innerHTML = `<p class="hint-text error-text">Load failed: ${error.message}</p>`;
  }
}

function renderKV(obj, fields) {
  return `<div class="detail-kv">${fields.map(([k, label]) => `<span class="k">${label}</span><span class="v">${obj?.[k] ?? '--'}</span>`).join('')}</div>`;
}

function renderRelationItems(relations, type) {
  if (!relations || !relations.length) return '<p class="hint-text">No relations.</p>';
  return `<div class="relation-list">${relations.map((item) => {
    const rel = item.relation || item;
    const linked = item.invoice || item.purchaseOrder || item.paymentRequest || item.deliveryOrder;
    const linkedLabel = linked ? (linked.orderNo || linked.requestNo || linked.invoiceNo || `#${linked.id}`) : '--';
    return `<div class="relation-item"><div class="info"><strong>${linkedLabel}</strong> &middot; ¥${Number(rel.relationAmount || 0).toLocaleString()} ${rel.remark ? `<em>(${rel.remark})</em>` : ''}</div><div class="actions"><button class="ghost-btn small-btn" data-delete-relation="${type}" data-relation-id="${rel.id}">Delete</button></div></div>`;
  }).join('')}</div>`;
}

function renderAddRelationForm(type) {
  const fields = {
    purchase: '<input id="rel-invoice-id" type="number" placeholder="Invoice ID" /><input id="rel-target-id" type="number" placeholder="Purchase Order ID" /><input id="rel-amount" type="number" step="0.01" placeholder="Amount" /><input id="rel-remark" type="text" placeholder="Remark" />',
    payment: '<input id="rel-invoice-id" type="number" placeholder="Invoice ID" /><input id="rel-target-id" type="number" placeholder="Payment Request ID" /><input id="rel-amount" type="number" step="0.01" placeholder="Amount" /><input id="rel-remark" type="text" placeholder="Remark" />',
    delivery: '<input id="rel-invoice-id" type="number" placeholder="Invoice ID" /><input id="rel-target-id" type="number" placeholder="Delivery Order ID" /><input id="rel-amount" type="number" step="0.01" placeholder="Amount" /><input id="rel-remark" type="text" placeholder="Remark" />',
  };
  return `<div class="add-relation-form"><div class="form-row">${fields[type] || ''}</div><button class="primary-btn small-btn" id="submit-relation-btn" data-type="${type}">Add Relation</button><span class="hint-text" id="relation-form-hint"></span></div>`;
}

function renderPurchaseDetail(detail) {
  const po = detail.purchaseOrder;
  $('detail-title').textContent = po ? `Purchase: ${po.orderNo}` : 'Detail';
  $('detail-content').innerHTML = `
    <div class="detail-section">${renderKV(po, [['orderNo', 'Order No'], ['supplierName', 'Supplier'], ['amount', 'Amount'], ['invoiceStatus', 'Invoice Status']])}</div>
    <div class="detail-section"><h4>Invoice Relations</h4>${renderRelationItems(detail.invoices, 'purchase')}</div>
    <div class="detail-section"><h4>Related Payment Requests</h4>${(detail.paymentRequests || []).map((p) => `<div class="relation-item"><div class="info">${p.requestNo || p.id} &middot; ¥${Number(p.amount || 0).toLocaleString()}</div></div>`).join('') || '<p class="hint-text">None</p>'}</div>
    <div class="detail-section"><h4>Related Delivery Orders</h4>${(detail.deliveryOrders || []).map((d) => `<div class="relation-item"><div class="info">${d.orderNo || d.id} &middot; ¥${Number(d.amount || 0).toLocaleString()}</div></div>`).join('') || '<p class="hint-text">None</p>'}</div>
    <div class="detail-section"><h4>Add Invoice–Purchase Relation</h4>${renderAddRelationForm('purchase')}</div>
  `;
  bindRelationActions();
}

function renderPaymentDetail(detail) {
  const pr = detail.paymentRequest;
  $('detail-title').textContent = pr ? `Payment: ${pr.requestNo}` : 'Detail';
  $('detail-content').innerHTML = `
    <div class="detail-section">${renderKV(pr, [['requestNo', 'Request No'], ['supplierName', 'Supplier'], ['amount', 'Amount'], ['invoiceStatus', 'Invoice Status']])}</div>
    <div class="detail-section"><h4>Invoice Relations</h4>${renderRelationItems(detail.invoices, 'payment')}</div>
    <div class="detail-section"><h4>Related Purchase Orders</h4>${(detail.purchaseOrders || []).map((p) => `<div class="relation-item"><div class="info">${p.orderNo || p.id} &middot; ¥${Number(p.amount || 0).toLocaleString()}</div></div>`).join('') || '<p class="hint-text">None</p>'}</div>
    <div class="detail-section"><h4>Add Invoice–Payment Relation</h4>${renderAddRelationForm('payment')}</div>
  `;
  bindRelationActions();
}

function renderDeliveryDetail(detail) {
  const d = detail.deliveryOrder;
  $('detail-title').textContent = d ? `Delivery: ${d.orderNo}` : 'Detail';
  $('detail-content').innerHTML = `
    <div class="detail-section">${renderKV(d, [['orderNo', 'Order No'], ['supplierName', 'Supplier'], ['amount', 'Amount'], ['invoiceStatus', 'Invoice Status']])}</div>
    <div class="detail-section"><h4>Invoice Relations</h4>${renderRelationItems(detail.invoices, 'delivery')}</div>
    <div class="detail-section"><h4>Related Purchase Orders</h4>${(detail.purchaseOrders || []).map((p) => `<div class="relation-item"><div class="info">${p.orderNo || p.id} &middot; ¥${Number(p.amount || 0).toLocaleString()}</div></div>`).join('') || '<p class="hint-text">None</p>'}</div>
    <div class="detail-section"><h4>Add Invoice–Delivery Relation</h4>${renderAddRelationForm('delivery')}</div>
  `;
  bindRelationActions();
}

function renderInvoiceDetail(detail) {
  const inv = detail.invoice;
  $('detail-title').textContent = inv ? `Invoice: ${inv.invoiceNo}` : 'Detail';
  $('detail-content').innerHTML = `
    <div class="detail-section">${renderKV(inv, [['invoiceNo', 'Invoice No'], ['invoiceType', 'Type'], ['supplierName', 'Supplier'], ['amount', 'Amount'], ['invoiceDate', 'Date'], ['matchStatus', 'Match Status']])}</div>
    <div class="detail-section"><h4>Purchase Relations</h4>${renderRelationItems(detail.purchaseRelations, 'purchase')}</div>
    <div class="detail-section"><h4>Payment Request Relations</h4>${renderRelationItems(detail.paymentRequestRelations, 'payment')}</div>
    <div class="detail-section"><h4>Delivery Relations</h4>${renderRelationItems(detail.deliveryRelations, 'delivery')}</div>
  `;
  bindRelationActions();
}

function bindRelationActions() {
  document.querySelectorAll('[data-delete-relation]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const type = btn.dataset.deleteRelation;
      const relationId = btn.dataset.relationId;
      const pathMap = { purchase: 'purchase', payment: 'payment-requests', delivery: 'delivery' };
      try {
        await submitJson(`/reconciliation/relations/${pathMap[type]}/${relationId}`, {}, 'DELETE');
        await loadDetail();
        await loadOverview();
      } catch (error) {
        alert(`Delete failed: ${error.message}`);
      }
    });
  });

  const submitBtn = document.getElementById('submit-relation-btn');
  if (submitBtn) {
    submitBtn.addEventListener('click', async () => {
      const type = submitBtn.dataset.type;
      const invoiceId = Number(document.getElementById('rel-invoice-id')?.value);
      const targetId = Number(document.getElementById('rel-target-id')?.value);
      const amount = Number(document.getElementById('rel-amount')?.value);
      const remark = document.getElementById('rel-remark')?.value || '';
      const hint = document.getElementById('relation-form-hint');

      if (!invoiceId || !targetId || !amount) {
        if (hint) hint.textContent = 'All fields required.';
        return;
      }

      const pathMap = { purchase: 'purchase', payment: 'payment-requests', delivery: 'delivery' };
      const bodyMap = {
        purchase: { invoiceId, purchaseOrderId: targetId, relationAmount: amount, remark },
        payment: { invoiceId, paymentRequestId: targetId, relationAmount: amount, remark },
        delivery: { invoiceId, deliveryOrderId: targetId, relationAmount: amount, remark },
      };

      try {
        await submitJson(`/reconciliation/relations/${pathMap[type]}`, bodyMap[type]);
        if (hint) hint.textContent = 'Added!';
        await loadDetail();
        await loadOverview();
      } catch (error) {
        if (hint) { hint.textContent = error.message; hint.classList.add('error-text'); }
      }
    });
  }
}

function switchTab(tab) {
  state.activeTab = tab;
  state.selectedId = null;
  state.detail = null;
  document.querySelectorAll('.recon-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
  $('detail-title').textContent = 'Detail';
  $('detail-content').innerHTML = '<p class="hint-text">Select an item from the list.</p>';
  loadList();
}

async function loadAll() {
  await loadOverview();
  await loadList();
}

function init() {
  $('login-btn').addEventListener('click', login);
  document.querySelectorAll('.recon-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
  loadAll();
}

init();
