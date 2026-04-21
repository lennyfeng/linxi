const $ = (id) => document.getElementById(id);

const state = {
  token: localStorage.getItem('token') || '',
  projects: [],
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
  await loadProjects();
}

const STAGE_CLASS_MAP = {
  '待调研': 'pending',
  '待报价': 'pending',
  '待立项审批': 'pending',
  '立项通过': 'approved',
  '打样中': 'sampling',
  '打样通过': 'approved',
  '待同步': 'pending',
  '已同步领星': 'synced',
  '已驳回': 'rejected',
  '打样失败': 'rejected',
};

function stageBadge(status) {
  const cls = STAGE_CLASS_MAP[status] || 'pending';
  return `<span class="stage-badge ${cls}">${status || '--'}</span>`;
}

async function loadProjects() {
  try {
    state.projects = await request('/product-dev/projects') || [];
    $('list-hint').textContent = state.projects.length ? '' : 'No projects found.';
    renderProjectList();
  } catch (error) {
    $('list-hint').textContent = `Load failed: ${error.message}`;
    $('list-hint').classList.add('error-text');
  }
}

function renderProjectList() {
  const tbody = $('project-tbody');
  tbody.innerHTML = state.projects.map((p) => `
    <tr data-id="${p.id}" class="${state.selectedId === p.id ? 'selected' : ''}">
      <td>${p.projectCode || '--'}</td>
      <td>${p.productName || '--'}</td>
      <td>${p.targetMarket || '--'}</td>
      <td>${stageBadge(p.projectStatus)}</td>
    </tr>
  `).join('');

  tbody.querySelectorAll('tr[data-id]').forEach((tr) => {
    tr.addEventListener('click', () => {
      state.selectedId = Number(tr.dataset.id);
      renderProjectList();
      loadDetail();
    });
  });
}

async function loadDetail() {
  if (!state.selectedId) return;
  $('detail-content').innerHTML = '<p class="hint-text">Loading...</p>';

  try {
    const detail = await request(`/product-dev/projects/${state.selectedId}`);
    state.detail = detail;
    renderDetail(detail);
  } catch (error) {
    $('detail-content').innerHTML = `<p class="hint-text error-text">${error.message}</p>`;
  }
}

function renderDetail(detail) {
  const p = detail.project;
  if (!p) {
    $('detail-content').innerHTML = '<p class="hint-text">Project not found.</p>';
    return;
  }

  $('detail-title').textContent = `${p.projectCode} - ${p.productName}`;

  const kvHtml = `<div class="detail-kv">
    <span class="k">SKU</span><span class="v">${p.sku || '--'}</span>
    <span class="k">Developer</span><span class="v">${p.developerName || '--'}</span>
    <span class="k">Owner</span><span class="v">${p.ownerName || '--'}</span>
    <span class="k">Platform</span><span class="v">${p.targetPlatform || '--'}</span>
    <span class="k">Market</span><span class="v">${p.targetMarket || '--'}</span>
    <span class="k">Est. Cost</span><span class="v">¥${Number(p.estimatedCost || 0).toFixed(2)}</span>
    <span class="k">Target Price</span><span class="v">$${Number(p.targetPrice || 0).toFixed(2)}</span>
    <span class="k">Margin Target</span><span class="v">${((Number(p.grossMarginTarget || 0)) * 100).toFixed(1)}%</span>
    <span class="k">Status</span><span class="v">${stageBadge(p.projectStatus)}</span>
  </div>`;

  const quotesHtml = (detail.quotes || []).length
    ? `<div class="sub-list">${detail.quotes.map((q) => `<div class="sub-item">${q.supplierName} · ¥${Number(q.quotePrice || 0).toFixed(2)} · MOQ ${q.moq || '--'} · ${q.preferred ? '★ Preferred' : ''}</div>`).join('')}</div>`
    : '<p class="hint-text">No quotes yet.</p>';

  const profitsHtml = (detail.profitCalculations || []).length
    ? `<div class="sub-list">${detail.profitCalculations.map((pc) => `<div class="sub-item">$${Number(pc.salesPriceUsd || 0).toFixed(2)} · ${pc.selectedPlan || '--'} plan · Profit ¥${Number(pc.selectedProfit || 0).toFixed(2)} (${((Number(pc.selectedProfitRate || 0)) * 100).toFixed(1)}%)</div>`).join('')}</div>`
    : '<p class="hint-text">No profit calculations.</p>';

  const samplesHtml = (detail.sampleRecords || []).length
    ? `<div class="sub-list">${detail.sampleRecords.map((s) => `<div class="sub-item">Round ${s.roundNo} · ${s.supplierName || '--'} · ${s.reviewResult || 'pending'} ${s.improvementNotes ? `· ${s.improvementNotes}` : ''}</div>`).join('')}</div>`
    : '<p class="hint-text">No sample records.</p>';

  const syncsHtml = (detail.syncRecords || []).length
    ? `<div class="sub-list">${detail.syncRecords.map((s) => `<div class="sub-item">${s.syncStatus} · ${s.syncedBy || '--'} · ${s.syncTime || '--'} ${s.resultMessage ? `· ${s.resultMessage}` : ''}</div>`).join('')}</div>`
    : '<p class="hint-text">No sync records.</p>';

  $('detail-content').innerHTML = `
    <div class="detail-section">${kvHtml}</div>
    <div class="detail-section"><h4>Workflow Actions</h4><div class="workflow-actions" id="workflow-actions"></div><div id="workflow-hint" class="hint-text"></div></div>
    <div class="detail-section"><h4>Quotes (${(detail.quotes || []).length})</h4>${quotesHtml}</div>
    <div class="detail-section"><h4>Profit Calculations</h4>${profitsHtml}</div>
    <div class="detail-section"><h4>Sample Records</h4>${samplesHtml}</div>
    <div class="detail-section"><h4>Sync Records</h4>${syncsHtml}</div>
    <div class="detail-section" id="presync-section"></div>
  `;

  renderWorkflowActions(p);
}

const TRANSITIONS = {
  '待调研': [{ target: '待报价', label: 'Move to Quoting', cls: 'ghost-btn' }],
  '待报价': [{ target: '待立项审批', label: 'Submit for Approval', cls: 'primary-btn' }],
  '待立项审批': [
    { target: '立项通过', label: '✓ Approve', cls: 'primary-btn' },
    { target: '已驳回', label: '✗ Reject', cls: 'ghost-btn' },
  ],
  '立项通过': [{ target: '打样中', label: 'Start Sampling', cls: 'ghost-btn' }],
  '已驳回': [{ target: '待调研', label: 'Back to Research', cls: 'ghost-btn' }],
  '打样中': [
    { target: '打样通过', label: '✓ Sample Pass', cls: 'primary-btn' },
    { target: '打样失败', label: '✗ Sample Fail', cls: 'ghost-btn' },
  ],
  '打样通过': [{ target: '待同步', label: 'Ready to Sync', cls: 'primary-btn' }],
  '打样失败': [{ target: '打样中', label: 'Retry Sampling', cls: 'ghost-btn' }],
  '待同步': [{ target: '已同步领星', label: 'Sync to Lingxing', cls: 'primary-btn' }],
  '已同步领星': [],
};

function renderWorkflowActions(project) {
  const container = $('workflow-actions');
  const actions = TRANSITIONS[project.projectStatus] || [];

  if (!actions.length) {
    container.innerHTML = '<span class="hint-text">No available transitions.</span>';
    return;
  }

  container.innerHTML = actions.map((a) => `<button class="${a.cls}" data-target="${a.target}">${a.label}</button>`).join('');

  // Pre-sync check button
  if (project.projectStatus === '打样通过' || project.projectStatus === '待同步') {
    container.innerHTML += '<button class="ghost-btn" id="presync-check-btn">Pre-sync Check</button>';
    document.getElementById('presync-check-btn')?.addEventListener('click', runPreSyncCheck);
  }

  container.querySelectorAll('button[data-target]').forEach((btn) => {
    btn.addEventListener('click', () => doTransition(btn.dataset.target));
  });
}

async function doTransition(targetStatus) {
  const hint = $('workflow-hint');
  hint.textContent = 'Processing...';
  hint.classList.remove('error-text');

  try {
    await submitJson(`/product-dev/projects/${state.selectedId}/transition`, { targetStatus });
    hint.textContent = `Transitioned to "${targetStatus}" successfully.`;
    await loadProjects();
    await loadDetail();
  } catch (error) {
    hint.textContent = error.message;
    hint.classList.add('error-text');
  }
}

async function runPreSyncCheck() {
  const section = $('presync-section');
  try {
    const result = await request(`/product-dev/projects/${state.selectedId}/pre-sync-check`);
    if (result.ready) {
      section.innerHTML = '<div class="presync-check"><span class="pass">✓ All pre-sync checks passed. Ready to sync.</span></div>';
    } else {
      section.innerHTML = `<div class="presync-check"><span class="fail">✗ Pre-sync validation failed:</span><ul>${result.errors.map((e) => `<li>${e}</li>`).join('')}</ul></div>`;
    }
  } catch (error) {
    section.innerHTML = `<div class="presync-check"><span class="fail">${error.message}</span></div>`;
  }
}

function init() {
  $('login-btn').addEventListener('click', login);
  loadProjects();
}

init();
