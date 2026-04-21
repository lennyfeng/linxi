const state = {
  token: '',
  transactions: [],
  accounts: [],
  categories: [],
  pagination: { page: 1, total_pages: 1, total: 0 },
  selectedTransactionId: null,
  selectedDetail: null,
  isEditingDetail: false,
  entryType: 'expense',
  multiRows: [],
  importRows: [],
  importBatches: [],
  selectedImportBatchNo: '',
  batchFilter: 'all',
  savedViews: [],
  activeSavedViewId: null,
  workspaceMode: 'list',
  filters: {
    keyword: '',
    transactionType: '',
    reimbursementStatus: '',
    startDate: '',
    endDate: '',
    accountId: '',
    categoryId: '',
    page: 1,
    pageSize: 20,
  },
};

const $ = (id) => document.getElementById(id);

const SAVED_VIEWS_STORAGE_KEY = 'ledger-workspace-saved-views';
const FILTERS_STORAGE_KEY = 'ledger-workspace-filters';
const SELECTED_TRANSACTION_STORAGE_KEY = 'ledger-workspace-selected-transaction';
const WORKSPACE_MODE_STORAGE_KEY = 'ledger-workspace-mode';
const IMPORT_STATE_STORAGE_KEY = 'ledger-workspace-import-state';
const MULTI_ENTRY_DRAFT_STORAGE_KEY = 'ledger-workspace-multi-entry-draft';

function currency(value) {
  const amount = Number(value || 0);
  return `¥ ${amount.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function typeLabel(type) {
  return {
    expense: '支出',
    income: '收入',
    transfer: '转账',
    refund: '退款',
    balance: '余额',
  }[type] || type || '未知';
}

function reimbursementLabel(status) {
  return {
    none: '未报销',
    pending: '审批中',
    approved: '已通过',
    rejected: '已驳回',
  }[status] || status || '无';
}

function buildQuery(params) {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === '' || value === null || value === undefined) return;
    search.set(key, String(value));
  });
  return search.toString();
}

function setHint(id, type, message) {
  const el = $(id);
  if (!el) return;
  el.dataset.state = type;
  el.textContent = message;
}

function setIdleHint(id, message) {
  setHint(id, 'idle', message);
}

function setLoadingHint(id, message) {
  setHint(id, 'loading', message);
}

function setSuccessHint(id, message) {
  setHint(id, 'success', message);
}

function setErrorHint(id, message) {
  setHint(id, 'error', message);
}

async function request(path, params = {}) {
  const query = buildQuery(params);
  const response = await fetch(query ? `${path}?${query}` : path, {
    headers: state.token ? { Authorization: `Bearer ${state.token}` } : {},
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || 'request_failed');
  }

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
  if (!response.ok) {
    throw new Error(payload?.message || 'request_failed');
  }

  return payload.data;
}

async function submitFormData(path, formData, method = 'POST') {
  const response = await fetch(path, {
    method,
    headers: state.token ? { Authorization: `Bearer ${state.token}` } : {},
    body: formData,
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || 'request_failed');
  }

  return payload.data;
}

async function login() {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin' }),
  });

  const payload = await response.json();
  if (!response.ok) {
    throw new Error(payload?.message || 'login_failed');
  }

  state.token = payload.data.access_token;
  $('login-btn').textContent = '已登录';
  $('login-btn').disabled = true;
}

async function bootstrapOptions() {
  const [accountsResult, categoriesResult] = await Promise.all([
    request('/ledger/accounts', { page: 1, pageSize: 100 }),
    request('/ledger/categories', { page: 1, pageSize: 100 }),
  ]);

  state.accounts = accountsResult.list || [];
  state.categories = categoriesResult.list || [];

  $('accountId').innerHTML = `<option value="">全部账户</option>${state.accounts
    .map((item) => `<option value="${item.id}">${item.accountName}</option>`)
    .join('')}`;

  $('categoryId').innerHTML = `<option value="">全部分类</option>${state.categories
    .map((item) => `<option value="${item.id}">${item.categoryName}</option>`)
    .join('')}`;

  loadPersistedFiltersIntoForm();

  $('entry-account-id').innerHTML = `<option value="">请选择账户</option>${state.accounts
    .map((item) => `<option value="${item.id}">${item.accountName}</option>`)
    .join('')}`;

  $('entry-category-id').innerHTML = `<option value="">请选择分类</option>${state.categories
    .map((item) => `<option value="${item.id}">${item.categoryName}</option>`)
    .join('')}`;

  $('account-overview').innerHTML = state.accounts
    .slice(0, 8)
    .map(
      (item) => `
      <button class="mini-item" type="button" data-account-id="${item.id}">
        <strong>${item.accountName}</strong>
        <span>${item.accountType} · ${item.currency}</span>
        <em>${currency(item.currentBalance)}</em>
      </button>
    `,
    )
    .join('');

  document.querySelectorAll('[data-account-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      $('accountId').value = button.dataset.accountId;
      state.filters.accountId = button.dataset.accountId;
      state.filters.page = 1;
      persistFilters();
      await loadTransactions();
    });
  });
}

function updateSummary() {
  const income = state.transactions
    .filter((item) => item.transactionType === 'income' || item.transactionType === 'refund')
    .reduce((sum, item) => sum + Number(item.amountCny || item.amount || 0), 0);

  const expense = state.transactions
    .filter((item) => item.transactionType === 'expense')
    .reduce((sum, item) => sum + Number(item.amountCny || item.amount || 0), 0);

  $('metric-income').textContent = currency(income);
  $('metric-expense').textContent = currency(expense);
  $('metric-balance').textContent = currency(income - expense);
  $('metric-count').textContent = String(state.pagination.total || state.transactions.length || 0);
}

function persistSavedViews() {
  localStorage.setItem(SAVED_VIEWS_STORAGE_KEY, JSON.stringify({
    savedViews: state.savedViews,
    activeSavedViewId: state.activeSavedViewId,
  }));
}

function persistFilters() {
  localStorage.setItem(FILTERS_STORAGE_KEY, JSON.stringify(state.filters));
}

function persistSelectedTransaction() {
  localStorage.setItem(SELECTED_TRANSACTION_STORAGE_KEY, String(state.selectedTransactionId || ''));
}

function persistWorkspaceMode() {
  localStorage.setItem(WORKSPACE_MODE_STORAGE_KEY, state.workspaceMode);
}

function persistImportState() {
  localStorage.setItem(IMPORT_STATE_STORAGE_KEY, JSON.stringify({
    importBatches: state.importBatches,
    importRows: state.importRows,
    selectedImportBatchNo: state.selectedImportBatchNo,
  }));
}

function persistMultiEntryDraft() {
  localStorage.setItem(MULTI_ENTRY_DRAFT_STORAGE_KEY, JSON.stringify(state.multiRows));
}

function hydrateFilters() {
  const raw = localStorage.getItem(FILTERS_STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    state.filters = {
      ...state.filters,
      ...parsed,
      page: 1,
      pageSize: parsed.pageSize || 20,
    };
  } catch {
    // ignore invalid local cache
  }
}

function hydrateSelectedTransaction() {
  const raw = localStorage.getItem(SELECTED_TRANSACTION_STORAGE_KEY);
  if (!raw) return;
  const parsed = Number(raw);
  if (Number.isFinite(parsed) && parsed > 0) {
    state.selectedTransactionId = parsed;
  }
}

function hydrateWorkspaceMode() {
  const raw = localStorage.getItem(WORKSPACE_MODE_STORAGE_KEY);
  if (!raw) return;
  state.workspaceMode = raw;
}

function hydrateImportState() {
  const raw = localStorage.getItem(IMPORT_STATE_STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    state.importBatches = Array.isArray(parsed.importBatches) ? parsed.importBatches : [];
    state.importRows = Array.isArray(parsed.importRows) ? parsed.importRows : [];
    state.selectedImportBatchNo = parsed.selectedImportBatchNo || '';
  } catch {
    // ignore invalid import cache
  }
}

function hydrateMultiEntryDraft() {
  const raw = localStorage.getItem(MULTI_ENTRY_DRAFT_STORAGE_KEY);
  if (!raw) return;

  try {
    const parsed = JSON.parse(raw);
    state.multiRows = Array.isArray(parsed) && parsed.length ? parsed : [createEmptyMultiRow()];
  } catch {
    state.multiRows = [createEmptyMultiRow()];
  }
}

function hydrateSavedViews() {
  const raw = localStorage.getItem(SAVED_VIEWS_STORAGE_KEY);
  if (!raw) {
    seedSavedViews();
    return;
  }

  try {
    const parsed = JSON.parse(raw);
    state.savedViews = Array.isArray(parsed.savedViews) ? parsed.savedViews : [];
    state.activeSavedViewId = parsed.activeSavedViewId ?? state.savedViews[0]?.id ?? null;
    if (!state.savedViews.length) {
      seedSavedViews();
      return;
    }
    renderSavedViews();
  } catch {
    seedSavedViews();
  }
}

function renderActiveFilters() {
  const labels = [];
  const f = state.filters;

  if (f.keyword) labels.push(`关键词：${f.keyword}`);
  if (f.transactionType) labels.push(`类型：${typeLabel(f.transactionType)}`);
  if (f.reimbursementStatus) labels.push(`报销：${reimbursementLabel(f.reimbursementStatus)}`);
  if (f.startDate || f.endDate) labels.push(`日期：${f.startDate || '开始'} ~ ${f.endDate || '结束'}`);
  if (f.accountId) labels.push(`账户：${state.accounts.find((x) => String(x.id) === String(f.accountId))?.accountName || f.accountId}`);
  if (f.categoryId) labels.push(`分类：${state.categories.find((x) => String(x.id) === String(f.categoryId))?.categoryName || f.categoryId}`);

  $('active-filters').innerHTML = labels.length
    ? labels.map((label) => `<span class="active-chip">${label}</span>`).join('')
    : '<span class="active-chip muted-chip">当前未设置额外筛选</span>';
}

function getCurrentFilterSnapshot() {
  return {
    keyword: $('keyword').value.trim(),
    transactionType: $('transactionType').value,
    reimbursementStatus: $('reimbursementStatus').value,
    startDate: $('startDate').value,
    endDate: $('endDate').value,
    accountId: $('accountId').value,
    categoryId: $('categoryId').value,
    page: 1,
    pageSize: 20,
  };
}

function applyFilterSnapshot(snapshot) {
  $('keyword').value = snapshot.keyword || '';
  $('transactionType').value = snapshot.transactionType || '';
  $('reimbursementStatus').value = snapshot.reimbursementStatus || '';
  $('startDate').value = snapshot.startDate || '';
  $('endDate').value = snapshot.endDate || '';
  $('accountId').value = snapshot.accountId || '';
  $('categoryId').value = snapshot.categoryId || '';
  state.filters = {
    ...state.filters,
    ...snapshot,
    page: 1,
    pageSize: snapshot.pageSize || 20,
  };
  persistFilters();
}

function loadPersistedFiltersIntoForm() {
  $('keyword').value = state.filters.keyword || '';
  $('transactionType').value = state.filters.transactionType || '';
  $('reimbursementStatus').value = state.filters.reimbursementStatus || '';
  $('startDate').value = state.filters.startDate || '';
  $('endDate').value = state.filters.endDate || '';
  $('accountId').value = state.filters.accountId || '';
  $('categoryId').value = state.filters.categoryId || '';
}

function loadPersistedFiltersIntoForm() {
  $('keyword').value = state.filters.keyword || '';
  $('transactionType').value = state.filters.transactionType || '';
  $('reimbursementStatus').value = state.filters.reimbursementStatus || '';
  $('startDate').value = state.filters.startDate || '';
  $('endDate').value = state.filters.endDate || '';
  $('accountId').value = state.filters.accountId || '';
  $('categoryId').value = state.filters.categoryId || '';
}

async function restoreWorkspaceMode() {
  if (state.workspaceMode === 'import-batches') {
    showImportBatchesPanel();
    return;
  }

  if (state.workspaceMode === 'entry-import') {
    if (!state.importBatches.length) {
      await loadImportBatches();
    }
    if (!state.selectedImportBatchNo && state.importBatches[0]) {
      state.selectedImportBatchNo = state.importBatches[0].batchNo;
    }
    if (!state.importRows.length) {
      await openImportBatch(state.selectedImportBatchNo || state.importBatches[0]?.batchNo || '');
    } else {
      openEntryPanel();
      setEntryMode('import');
      renderImportConfirmTable();
      syncCurrentBatchSummary();
    }
    persistImportState();
    return;
  }

  if (String(state.workspaceMode).startsWith('entry-')) {
    openEntryPanel();
    return;
  }

  state.workspaceMode = 'list';
  persistWorkspaceMode();
}

function renderSavedViews() {
  $('saved-views-list').innerHTML = state.savedViews.length
    ? state.savedViews.map((view) => `
      <div class="mini-item saved-view-item ${state.activeSavedViewId === view.id ? 'is-active' : ''}">
        <button class="saved-view-main" type="button" data-saved-view-id="${view.id}">
          <strong>${view.name}</strong>
          <span>${view.summary}</span>
        </button>
        <button class="text-btn saved-view-delete-btn" type="button" data-delete-saved-view="${view.id}">删除</button>
      </div>
    `).join('')
    : '<div class="stack-empty">当前还没有常用视图</div>';

  document.querySelectorAll('[data-saved-view-id]').forEach((button) => {
    button.addEventListener('click', async () => {
      const target = state.savedViews.find((item) => String(item.id) === String(button.dataset.savedViewId));
      if (!target) return;
      state.activeSavedViewId = target.id;
      applyFilterSnapshot(target.filters);
      persistSavedViews();
      renderSavedViews();
      await loadTransactions();
      $('list-hint').textContent = `已切换到常用视图：${target.name}`;
    });
  });

  document.querySelectorAll('[data-delete-saved-view]').forEach((button) => {
    button.addEventListener('click', () => {
      deleteSavedView(button.dataset.deleteSavedView);
    });
  });
}

function saveCurrentView() {
  const snapshot = getCurrentFilterSnapshot();
  const labels = [];
  if (snapshot.keyword) labels.push(`关键词 ${snapshot.keyword}`);
  if (snapshot.transactionType) labels.push(typeLabel(snapshot.transactionType));
  if (snapshot.reimbursementStatus) labels.push(reimbursementLabel(snapshot.reimbursementStatus));
  if (snapshot.accountId) labels.push(state.accounts.find((item) => String(item.id) === String(snapshot.accountId))?.accountName || snapshot.accountId);
  if (snapshot.categoryId) labels.push(state.categories.find((item) => String(item.id) === String(snapshot.categoryId))?.categoryName || snapshot.categoryId);
  if (snapshot.startDate || snapshot.endDate) labels.push(`${snapshot.startDate || '开始'} ~ ${snapshot.endDate || '结束'}`);

  const view = {
    id: Date.now(),
    name: `视图 ${state.savedViews.length + 1}`,
    summary: labels.length ? labels.join(' · ') : '默认筛选条件',
    filters: snapshot,
  };

  state.savedViews = [view, ...state.savedViews].slice(0, 6);
  state.activeSavedViewId = view.id;
  persistSavedViews();
  renderSavedViews();
  $('list-hint').textContent = `已保存常用视图：${view.name}`;
}

function overwriteActiveSavedView() {
  const target = state.savedViews.find((item) => item.id === state.activeSavedViewId);
  if (!target) {
    $('list-hint').textContent = '请先选择一个常用视图后再覆盖。';
    return;
  }
  const snapshot = getCurrentFilterSnapshot();
  const labels = [];
  if (snapshot.keyword) labels.push(`关键词 ${snapshot.keyword}`);
  if (snapshot.transactionType) labels.push(typeLabel(snapshot.transactionType));
  if (snapshot.reimbursementStatus) labels.push(reimbursementLabel(snapshot.reimbursementStatus));
  if (snapshot.accountId) labels.push(state.accounts.find((item) => String(item.id) === String(snapshot.accountId))?.accountName || snapshot.accountId);
  if (snapshot.categoryId) labels.push(state.categories.find((item) => String(item.id) === String(snapshot.categoryId))?.categoryName || snapshot.categoryId);
  if (snapshot.startDate || snapshot.endDate) labels.push(`${snapshot.startDate || '开始'} ~ ${snapshot.endDate || '结束'}`);

  target.filters = snapshot;
  target.summary = labels.length ? labels.join(' · ') : '默认筛选条件';
  persistSavedViews();
  renderSavedViews();
  $('list-hint').textContent = `已覆盖常用视图：${target.name}`;
}

function deleteSavedView(viewId) {
  const deletingActive = String(state.activeSavedViewId) === String(viewId);
  state.savedViews = state.savedViews.filter((item) => String(item.id) !== String(viewId));
  if (deletingActive) {
    state.activeSavedViewId = null;
  }
  persistSavedViews();
  renderSavedViews();
  $('list-hint').textContent = '常用视图已删除。';
}

function renderTable() {
  const tbody = $('transaction-tbody');

  if (!state.transactions.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="7"><div class="empty-table">当前没有符合条件的流水，请调整筛选或先新增一笔。</div></td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = state.transactions
    .map(
      (item) => `
      <tr class="transaction-row ${state.selectedTransactionId === item.id ? 'selected' : ''}" data-id="${item.id}">
        <td><span class="type-pill type-${item.transactionType}">${typeLabel(item.transactionType)}</span></td>
        <td>
          <strong>${item.summary || '未填写摘要'}</strong>
          <small>${item.transactionNo || '-'} · 分类ID ${item.categoryId || '-'}</small>
        </td>
        <td>
          <strong>${currency(item.amountCny || item.amount)}</strong>
          <small>${item.currency || 'CNY'}</small>
        </td>
        <td>${state.accounts.find((acc) => acc.id === item.accountId)?.accountName || item.accountId || '-'}</td>
        <td>
          <strong>${item.counterpartyName || '-'}</strong>
          <small>${item.projectName || '无项目'}</small>
        </td>
        <td>${item.transactionDate || '-'}</td>
        <td><span class="status-badge">${reimbursementLabel(item.reimbursementStatus)}</span></td>
      </tr>
    `,
    )
    .join('');

  document.querySelectorAll('.transaction-row').forEach((row) => {
    row.addEventListener('click', async () => {
      state.selectedTransactionId = Number(row.dataset.id);
      persistSelectedTransaction();
      await loadTransactionDetail(state.selectedTransactionId);
    });
  });
}

function renderPagination() {
  const currentPage = Number(state.pagination.page || 1);
  const totalPages = Number(state.pagination.total_pages || 1);
  $('page-info').textContent = `第 ${currentPage} / ${totalPages || 1} 页 · 共 ${state.pagination.total || 0} 条`;
  $('prev-page').disabled = currentPage <= 1;
  $('next-page').disabled = currentPage >= totalPages;
}

function createEmptyMultiRow() {
  return {
    transactionType: 'expense',
    amount: '',
    transactionDate: new Date().toISOString().slice(0, 10),
    accountId: '',
    categoryId: '',
    summary: '',
    counterpartyName: '',
    projectName: '',
    paymentAccount: '',
    reimbursementRequired: false,
  };
}

function createDemoImportBatches() {
  return [
    {
      batchNo: 'IMP-DEMO-20260419-A',
      sourceType: 'bank',
      fileName: 'cmb-apr-19.xlsx',
      uploader: 'Lenny',
      createdAt: '2026-04-19 09:18',
      totalCount: 2,
      failedCount: 0,
      status: 'pending_confirm',
      pendingCount: 2,
      matchedCount: 1,
    },
    {
      batchNo: 'IMP-DEMO-20260419-B',
      sourceType: 'airwallex',
      fileName: 'airwallex-apr-19.csv',
      uploader: 'Lenny',
      createdAt: '2026-04-19 10:42',
      totalCount: 3,
      failedCount: 0,
      status: 'partially_confirmed',
      pendingCount: 3,
      matchedCount: 2,
    },
  ];
}

async function loadImportBatches() {
  try {
    const result = await request('/ledger/imports', { page: 1, pageSize: 50 });
    const batches = (result.list || []).map((b) => ({
      id: b.id,
      batchNo: b.batchNo,
      sourceType: b.sourceType,
      fileName: b.fileName,
      uploader: b.importedBy || '--',
      createdAt: b.createdAt || '--',
      totalCount: 0,
      failedCount: 0,
      status: b.status || 'draft',
      pendingCount: 0,
      matchedCount: 0,
    }));
    state.importBatches = batches.length ? batches : createDemoImportBatches();
    persistImportState();
    renderImportBatchesTable();
  } catch (error) {
    state.importBatches = createDemoImportBatches();
    persistImportState();
    renderImportBatchesTable();
    $('batch-list-hint').textContent = 'API unavailable, showing demo batches.';
  }
}

async function loadImportBatchDetail(batchIdOrNo) {
  const batch = state.importBatches.find((b) => String(b.id) === String(batchIdOrNo) || b.batchNo === batchIdOrNo);
  if (!batch || !batch.id) return null;
  try {
    const detail = await request(`/ledger/imports/${batch.id}`);
    const rows = (detail.rows || []).map((row) => ({
      id: row.id,
      sourceType: row.sourceType || batch.sourceType,
      externalNo: row.externalNo || '--',
      transactionDate: row.transactionDate ? String(row.transactionDate).slice(0, 10) : new Date().toISOString().slice(0, 10),
      amount: String(row.amount || '0'),
      matchStatus: row.matchStatus || 'pending',
      candidateHint: '',
      rowStatus: row.matchStatus === 'confirmed' ? '已入账' : '待确认',
      errorMessage: '',
      transactionType: Number(row.amount || 0) < 0 ? 'income' : 'expense',
      accountId: '',
      categoryId: '',
      summary: row.bankSummary || '',
      counterpartyName: row.counterpartyName || '',
      projectName: '',
      paymentAccount: row.paymentAccount || '',
    }));
    batch.totalCount = rows.length;
    batch.pendingCount = rows.filter((r) => r.rowStatus !== '已入账').length;
    return rows;
  } catch {
    return null;
  }
}

function renderBatchTaskSummary() {
  const pending = state.importBatches.filter((batch) => batch.status === 'pending_confirm').length;
  const partial = state.importBatches.filter((batch) => batch.status === 'partially_confirmed').length;
  const confirmed = state.importBatches.filter((batch) => batch.status === 'confirmed').length;
  const failed = state.importBatches.reduce((sum, batch) => sum + Number(batch.failedCount || 0), 0);

  $('batch-pending-total').textContent = String(pending);
  $('batch-partial-total').textContent = String(partial);
  $('batch-confirmed-total').textContent = String(confirmed);
  $('batch-failed-total').textContent = String(failed);
}

function renderImportBatchesTable() {
  const tbody = $('import-batches-tbody');
  renderBatchTaskSummary();
  const visibleBatches = state.batchFilter === 'all'
    ? state.importBatches
    : state.importBatches.filter((batch) => batch.status === state.batchFilter);

  if (!visibleBatches.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="10"><div class="empty-table">当前筛选下没有批次，切换状态或加载示例批次后再试。</div></td>
      </tr>
    `;
    return;
  }

  tbody.innerHTML = visibleBatches
    .map((batch) => {
      const confirmedCount = Math.max(0, (batch.totalCount || 0) - (batch.pendingCount || 0) - (batch.failedCount || 0));
      const progress = batch.totalCount ? Math.round(((confirmedCount + (batch.failedCount || 0)) / batch.totalCount) * 100) : 0;
      const rowClassNames = [
        state.selectedImportBatchNo === batch.batchNo ? 'transaction-row selected' : 'transaction-row',
        `batch-status-${batch.status}`,
        batch.failedCount ? 'batch-has-failure' : '',
      ].filter(Boolean).join(' ');
      const statusClass = batch.status === 'pending_confirm'
        ? 'is-pending'
        : batch.status === 'partially_confirmed'
          ? 'is-partial'
          : 'is-confirmed';
      return `
      <tr class="${rowClassNames}">
        <td><strong>${batch.batchNo}</strong></td>
        <td>${batch.sourceType}</td>
        <td>${batch.fileName}</td>
        <td><span class="status-badge batch-status-badge ${statusClass}">${batch.status}</span></td>
        <td>${batch.totalCount || 0}</td>
        <td>${confirmedCount}</td>
        <td><span class="failure-count ${batch.failedCount ? 'has-value' : ''}">${batch.failedCount || 0}</span></td>
        <td>${batch.matchedCount}</td>
        <td>
          <div class="batch-progress-cell">
            <strong>${progress}%</strong>
            <div class="mini-progress-rail"><div class="mini-progress-bar ${statusClass}" style="width:${progress}%"></div></div>
          </div>
        </td>
        <td><button class="ghost-btn small-btn" type="button" data-open-batch="${batch.batchNo}">进入确认</button></td>
      </tr>
    `;
    })
    .join('');

  tbody.querySelectorAll('[data-open-batch]').forEach((button) => {
    button.addEventListener('click', () => {
      openImportBatch(button.dataset.openBatch);
    });
  });
}

async function showImportBatchesPanel() {
  state.workspaceMode = 'import-batches';
  persistWorkspaceMode();
  $('transactions-panel').classList.add('hidden');
  $('import-batches-panel').classList.remove('hidden');
  await loadImportBatches();
}

function hideImportBatchesPanel() {
  state.workspaceMode = 'list';
  persistWorkspaceMode();
  $('import-batches-panel').classList.add('hidden');
  $('transactions-panel').classList.remove('hidden');
}

async function openImportBatch(batchNo) {
  state.selectedImportBatchNo = batchNo;
  const batch = state.importBatches.find((item) => item.batchNo === batchNo);
  $('import-batch-no').textContent = batch?.batchNo || batchNo;
  $('import-source-type').textContent = batch?.sourceType || 'bank';
  $('import-file-name').textContent = batch?.fileName || '--';
  $('import-uploader').textContent = batch?.uploader || '--';
  $('import-created-at').textContent = batch?.createdAt || '--';

  // Try to load rows from API, fallback to cached/demo
  let rows = null;
  if (batch?.id) {
    rows = await loadImportBatchDetail(batchNo);
  }

  const existingRows = rows && rows.length
    ? rows
    : Array.isArray(state.importRows) && state.importRows.length
      ? state.importRows
      : createDemoImportRows().map((row, index) => ({
          ...row,
          externalNo: `${batchNo}-${index + 1}`,
          sourceType: batch?.sourceType || row.sourceType,
          rowStatus: batch?.status === 'confirmed' ? '已入账' : index === 0 && batch?.status === 'partially_confirmed' ? '已入账' : '待确认',
        }));

  state.importRows = existingRows;
  persistImportState();
  openEntryPanel();
  setEntryMode('import');
  renderImportConfirmTable();
  syncCurrentBatchSummary();
  $('import-confirm-hint').textContent = `当前处理批次 ${batchNo}，请逐条确认后入账。`;
  renderImportBatchesTable();
}

function createDemoImportRows() {
  return [
    {
      sourceType: 'bank',
      externalNo: 'BANK-240419-001',
      transactionDate: new Date().toISOString().slice(0, 10),
      amount: '1520.50',
      matchStatus: '候选匹配',
      candidateHint: '候选系统流水 TXN-202604-183 · 金额一致 · 付款账号相近',
      rowStatus: '待确认',
      errorMessage: '',
      transactionType: 'expense',
      accountId: state.accounts[0]?.id || '',
      categoryId: state.categories[0]?.id || '',
      summary: '银行导入-待补分类',
      counterpartyName: '示例供应商A',
      projectName: '',
      paymentAccount: '招商银行尾号 2281',
    },
    {
      sourceType: 'airwallex',
      externalNo: 'AWX-240419-003',
      transactionDate: new Date().toISOString().slice(0, 10),
      amount: '6800.00',
      matchStatus: '待新增',
      candidateHint: '未找到金额与日期同时接近的系统流水',
      rowStatus: '待确认',
      errorMessage: '',
      transactionType: 'expense',
      accountId: state.accounts[1]?.id || state.accounts[0]?.id || '',
      categoryId: state.categories[1]?.id || state.categories[0]?.id || '',
      summary: '空中云汇导入-待确认',
      counterpartyName: '海外服务商B',
      projectName: '新品项目',
      paymentAccount: 'Airwallex USD Wallet',
    },
  ];
}

function syncCurrentBatchSummary() {
  if (!state.selectedImportBatchNo) return;
  const batch = state.importBatches.find((item) => item.batchNo === state.selectedImportBatchNo);
  if (!batch) return;

  batch.pendingCount = state.importRows.filter((row) => row.rowStatus !== '已入账').length;
  batch.matchedCount = state.importRows.filter((row) => row.matchStatus === '候选匹配').length;
  batch.failedCount = state.importRows.filter((row) => row.rowStatus === '失败').length;
  batch.totalCount = state.importRows.length;

  let newStatus;
  if (batch.pendingCount === 0) {
    newStatus = 'confirmed';
  } else if (batch.pendingCount < state.importRows.length) {
    newStatus = 'partially_confirmed';
  } else {
    newStatus = 'pending_confirm';
  }

  // Push status to API if changed and batch has a DB id
  if (batch.id && batch.status !== newStatus) {
    batch.status = newStatus;
    try { submitJson(`/ledger/imports/${batch.id}`, { status: newStatus }, 'PUT'); } catch { /* best-effort */ }
  } else {
    batch.status = newStatus;
  }

  const confirmedCount = batch.totalCount - batch.pendingCount - batch.failedCount;
  const progress = batch.totalCount ? Math.round(((confirmedCount + batch.failedCount) / batch.totalCount) * 100) : 0;
  $('import-confirm-stats').textContent = `${confirmedCount} / ${batch.failedCount}`;
  $('import-progress-text').textContent = `${progress}%`;
  $('import-progress-bar').style.width = `${progress}%`;

  persistImportState();
  renderImportBatchesTable();
}

function renderImportConfirmTable() {
  const tbody = $('import-confirm-tbody');
  const rows = state.importRows;

  if (!rows.length) {
    tbody.innerHTML = `
      <tr>
        <td colspan="15"><div class="empty-table">当前还没有导入数据，点击“加载示例导入”预览确认页工作流。</div></td>
      </tr>
    `;
    $('import-pending-count').textContent = '0';
    $('import-matched-count').textContent = '0';
    syncCurrentBatchSummary();
    return;
  }

  $('import-pending-count').textContent = String(rows.filter((row) => row.rowStatus !== '已入账').length);
  $('import-matched-count').textContent = String(rows.filter((row) => row.matchStatus === '候选匹配').length);
  syncCurrentBatchSummary();

  tbody.innerHTML = rows
    .map(
      (row, index) => `
      <tr class="import-row status-${row.rowStatus === '失败' ? 'error' : row.rowStatus === '已入账' ? 'done' : 'pending'}">
        <td>${index + 1}</td>
        <td>${row.sourceType}</td>
        <td><strong>${row.externalNo}</strong></td>
        <td><input data-import-field="transactionDate" data-import-index="${index}" type="date" value="${row.transactionDate}" /></td>
        <td><input data-import-field="amount" data-import-index="${index}" type="number" min="0" step="0.01" value="${row.amount}" /></td>
        <td>
          <select data-import-field="matchStatus" data-import-index="${index}">
            <option value="候选匹配" ${row.matchStatus === '候选匹配' ? 'selected' : ''}>候选匹配</option>
            <option value="待新增" ${row.matchStatus === '待新增' ? 'selected' : ''}>待新增</option>
            <option value="人工确认" ${row.matchStatus === '人工确认' ? 'selected' : ''}>人工确认</option>
          </select>
        </td>
        <td>
          <div class="candidate-hint ${row.matchStatus === '待新增' ? 'dimmed' : ''}">${row.candidateHint || '-'}</div>
        </td>
        <td>
          <div class="row-status-badge ${row.rowStatus === '失败' ? 'is-error' : row.rowStatus === '已入账' ? 'is-done' : ''}">${row.rowStatus}</div>
          ${row.errorMessage ? `<div class="row-error-text">${row.errorMessage}</div>` : ''}
        </td>
        <td>
          <select data-import-field="transactionType" data-import-index="${index}">
            <option value="expense" ${row.transactionType === 'expense' ? 'selected' : ''}>支出</option>
            <option value="income" ${row.transactionType === 'income' ? 'selected' : ''}>收入</option>
            <option value="refund" ${row.transactionType === 'refund' ? 'selected' : ''}>退款</option>
            <option value="transfer" ${row.transactionType === 'transfer' ? 'selected' : ''}>转账</option>
          </select>
        </td>
        <td>
          <select data-import-field="accountId" data-import-index="${index}">
            <option value="">账户</option>
            ${state.accounts.map((item) => `<option value="${item.id}" ${String(row.accountId) === String(item.id) ? 'selected' : ''}>${item.accountName}</option>`).join('')}
          </select>
        </td>
        <td>
          <select data-import-field="categoryId" data-import-index="${index}">
            <option value="">分类</option>
            ${state.categories.map((item) => `<option value="${item.id}" ${String(row.categoryId) === String(item.id) ? 'selected' : ''}>${item.categoryName}</option>`).join('')}
          </select>
        </td>
        <td><input data-import-field="summary" data-import-index="${index}" type="text" value="${row.summary}" /></td>
        <td><input data-import-field="counterpartyName" data-import-index="${index}" type="text" value="${row.counterpartyName}" /></td>
        <td><input data-import-field="projectName" data-import-index="${index}" type="text" value="${row.projectName}" /></td>
        <td><input data-import-field="paymentAccount" data-import-index="${index}" type="text" value="${row.paymentAccount}" /></td>
      </tr>
    `,
    )
    .join('');

  tbody.querySelectorAll('[data-import-field]').forEach((element) => {
    element.addEventListener('input', syncImportRowField);
    element.addEventListener('change', syncImportRowField);
  });
}

function syncImportRowField(event) {
  const index = Number(event.target.dataset.importIndex);
  const field = event.target.dataset.importField;
  state.importRows[index][field] = event.target.value;
  state.importRows[index].errorMessage = '';
  if (state.importRows[index].rowStatus === '失败') {
    state.importRows[index].rowStatus = '待确认';
  }
  persistImportState();

  if (field === 'matchStatus') {
    const row = state.importRows[index];
    if (row.matchStatus === '待新增') {
      row.candidateHint = '将作为新流水入账，不依赖已有系统流水。';
    } else if (row.matchStatus === '人工确认') {
      row.candidateHint = '请财务核对金额、付款账号、摘要后手工确认关系。';
    } else {
      row.candidateHint = '候选系统流水已识别，请确认金额与日期是否一致。';
    }
    $('import-matched-count').textContent = String(state.importRows.filter((rowItem) => rowItem.matchStatus === '候选匹配').length);
    renderImportConfirmTable();
  }
}

async function confirmImportRows() {
  const rows = state.importRows.filter((row) => row.rowStatus !== '已入账');
  if (!rows.length) {
    setIdleHint('import-confirm-hint', '当前没有待确认的导入记录。');
    return;
  }

  const missingRequiredRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => !(row.amount && row.accountId && row.categoryId && row.summary && row.transactionDate))
    .map(({ index }) => index + 1);

  if (missingRequiredRows.length) {
    setErrorHint('import-confirm-hint', `第 ${missingRequiredRows.join('、')} 行缺少必填字段：金额、日期、账户、分类、摘要。系统会保留这些失败行供继续修正。`);
  }

  let successCount = 0;
  let failedCount = 0;

  for (const row of rows) {
    row.errorMessage = '';

    if (!(row.amount && row.accountId && row.categoryId && row.summary && row.transactionDate)) {
      row.rowStatus = '失败';
      row.errorMessage = '必填字段未补全';
      failedCount += 1;
      continue;
    }

    try {
      await submitJson('/ledger/transactions', {
        transactionType: row.transactionType,
        amount: Number(row.amount),
        amountCny: Number(row.amount),
        transactionDate: row.transactionDate,
        accountId: Number(row.accountId),
        categoryId: Number(row.categoryId),
        summary: row.summary.trim(),
        counterpartyName: row.counterpartyName.trim(),
        projectName: row.projectName.trim(),
        paymentAccount: row.paymentAccount.trim(),
        remark: `${row.sourceType}:${row.externalNo} · ${row.matchStatus}`,
      });
      row.rowStatus = '已入账';
      row.errorMessage = '';
      successCount += 1;
      // Update external transaction match_status if it has a DB id
      if (row.id) {
        try { await submitJson(`/ledger/external-transactions/${row.id}`, { matchStatus: 'confirmed' }, 'PUT'); } catch { /* best-effort */ }
      }
    } catch (error) {
      row.rowStatus = '失败';
      row.errorMessage = error.message;
      failedCount += 1;
    }
  }

  renderImportConfirmTable();
  syncCurrentBatchSummary();
  persistImportState();
  setSuccessHint('import-confirm-hint', `本次确认完成：成功 ${successCount} 条，失败 ${failedCount} 条。${failedCount ? '失败行已保留，修正后可再次确认。' : ''}`);
  await bootstrapOptions();
  state.filters.page = 1;
  await loadTransactions();
}

function createEmptyMultiRow() {
  return {
    transactionType: 'expense',
    amount: '',
    transactionDate: new Date().toISOString().slice(0, 10),
    accountId: '',
    categoryId: '',
    summary: '',
    counterpartyName: '',
    projectName: '',
    paymentAccount: '',
    reimbursementRequired: false,
    rowStatus: 'draft',
    errorMessage: '',
  };
}

function renderMultiEntryTable() {
  const tbody = $('multi-entry-tbody');
  if (!state.multiRows.length) {
    state.multiRows = [createEmptyMultiRow()];
    persistMultiEntryDraft();
  }

  tbody.innerHTML = state.multiRows
    .map(
      (row, index) => `
      <tr class="multi-row status-${row.rowStatus || 'draft'}">
        <td>
          <strong>${index + 1}</strong>
          ${row.errorMessage ? `<div class="row-error-text">${row.errorMessage}</div>` : ''}
        </td>
        <td>
          <select data-row-field="transactionType" data-row-index="${index}">
            <option value="expense" ${row.transactionType === 'expense' ? 'selected' : ''}>支出</option>
            <option value="income" ${row.transactionType === 'income' ? 'selected' : ''}>收入</option>
            <option value="transfer" ${row.transactionType === 'transfer' ? 'selected' : ''}>转账</option>
            <option value="refund" ${row.transactionType === 'refund' ? 'selected' : ''}>退款</option>
          </select>
        </td>
        <td><input data-row-field="amount" data-row-index="${index}" type="number" min="0" step="0.01" value="${row.amount}" /></td>
        <td><input data-row-field="transactionDate" data-row-index="${index}" type="date" value="${row.transactionDate}" /></td>
        <td>
          <select data-row-field="accountId" data-row-index="${index}">
            <option value="">账户</option>
            ${state.accounts.map((item) => `<option value="${item.id}" ${String(row.accountId) === String(item.id) ? 'selected' : ''}>${item.accountName}</option>`).join('')}
          </select>
        </td>
        <td>
          <select data-row-field="categoryId" data-row-index="${index}">
            <option value="">分类</option>
            ${state.categories.map((item) => `<option value="${item.id}" ${String(row.categoryId) === String(item.id) ? 'selected' : ''}>${item.categoryName}</option>`).join('')}
          </select>
        </td>
        <td><input data-row-field="summary" data-row-index="${index}" type="text" value="${row.summary}" placeholder="摘要" /></td>
        <td><input data-row-field="counterpartyName" data-row-index="${index}" type="text" value="${row.counterpartyName}" placeholder="商家" /></td>
        <td><input data-row-field="projectName" data-row-index="${index}" type="text" value="${row.projectName}" placeholder="项目" /></td>
        <td><input data-row-field="paymentAccount" data-row-index="${index}" type="text" value="${row.paymentAccount}" placeholder="付款账号" /></td>
        <td><input data-row-field="reimbursementRequired" data-row-index="${index}" type="checkbox" ${row.reimbursementRequired ? 'checked' : ''} /></td>
        <td><button class="text-btn inline-remove-btn" type="button" data-remove-row="${index}">删除</button></td>
      </tr>
    `,
    )
    .join('');

  tbody.querySelectorAll('[data-row-field]').forEach((element) => {
    element.addEventListener('input', syncMultiRowField);
    element.addEventListener('change', syncMultiRowField);
  });

  tbody.querySelectorAll('[data-remove-row]').forEach((button) => {
    button.addEventListener('click', () => {
      state.multiRows.splice(Number(button.dataset.removeRow), 1);
      if (!state.multiRows.length) {
        state.multiRows = [createEmptyMultiRow()];
      }
      persistMultiEntryDraft();
      renderMultiEntryTable();
    });
  });
}

function syncMultiRowField(event) {
  const index = Number(event.target.dataset.rowIndex);
  const field = event.target.dataset.rowField;
  state.multiRows[index][field] = event.target.type === 'checkbox' ? event.target.checked : event.target.value;
  state.multiRows[index].rowStatus = 'draft';
  state.multiRows[index].errorMessage = '';
  persistMultiEntryDraft();
}

function setEntryMode(mode) {
  state.workspaceMode = mode === 'single' ? 'entry-single' : mode === 'multi' ? 'entry-multi' : 'entry-import';
  persistWorkspaceMode();
  $('single-entry-panel').classList.toggle('hidden', mode !== 'single');
  $('multi-entry-panel').classList.toggle('hidden', mode !== 'multi');
  $('import-confirm-panel').classList.toggle('hidden', mode !== 'import');
  $('single-entry-mode-btn').classList.toggle('active', mode === 'single');
  $('multi-entry-mode-btn').classList.toggle('active', mode === 'multi');
  $('import-confirm-mode-btn').classList.toggle('active', mode === 'import');
  if (mode === 'multi') {
    renderMultiEntryTable();
    if (!$('multi-entry-hint').textContent.trim() || $('multi-entry-hint').dataset.state === 'idle') {
      setIdleHint('multi-entry-hint', '按行补全金额、日期、账户、分类和摘要后，可批量保存。');
    }
  }
  if (mode === 'import') {
    renderImportConfirmTable();
    if (!$('import-confirm-hint').textContent.trim() || $('import-confirm-hint').dataset.state === 'idle') {
      setIdleHint('import-confirm-hint', '模拟银行 / 空中云汇导入结果，按“记多笔”节奏补全信息后确认入账。');
    }
  }
}

function addMultiRows(count, cloneLast = false) {
  for (let i = 0; i < count; i += 1) {
    const source = cloneLast && state.multiRows.length ? { ...state.multiRows[state.multiRows.length - 1] } : createEmptyMultiRow();
    state.multiRows.push(source);
  }
  persistMultiEntryDraft();
  renderMultiEntryTable();
}

async function saveAllMultiRows() {
  const rows = state.multiRows.filter((row) => row.amount || row.accountId || row.categoryId || row.summary || row.transactionDate || row.counterpartyName || row.projectName || row.paymentAccount);
  if (!rows.length) {
    setErrorHint('multi-entry-hint', '请至少填写一行后再保存。');
    return;
  }

  const missingRequiredRows = rows
    .map((row, index) => ({ row, index }))
    .filter(({ row }) => !(row.amount && row.accountId && row.categoryId && row.summary && row.transactionDate))
    .map(({ index }) => index + 1);

  if (missingRequiredRows.length) {
    setErrorHint('multi-entry-hint', `第 ${missingRequiredRows.join('、')} 行缺少必填字段：金额、日期、账户、分类、摘要。`);
  }

  let successCount = 0;
  let failedCount = 0;

  for (const row of rows) {
    row.errorMessage = '';

    if (!(row.amount && row.accountId && row.categoryId && row.summary && row.transactionDate)) {
      row.rowStatus = 'error';
      row.errorMessage = '必填字段未补全';
      failedCount += 1;
      continue;
    }

    try {
      await submitJson('/ledger/transactions', {
        transactionType: row.transactionType,
        amount: Number(row.amount),
        amountCny: Number(row.amount),
        transactionDate: row.transactionDate,
        accountId: Number(row.accountId),
        categoryId: Number(row.categoryId),
        summary: row.summary.trim(),
        counterpartyName: row.counterpartyName.trim(),
        projectName: row.projectName.trim(),
        paymentAccount: row.paymentAccount.trim(),
        reimbursementRequired: row.reimbursementRequired ? 1 : 0,
        reimbursementStatus: row.reimbursementRequired ? 'pending' : 'none',
      });
      row.rowStatus = 'saved';
      successCount += 1;
    } catch (error) {
      row.rowStatus = 'error';
      row.errorMessage = error.message;
      failedCount += 1;
    }
  }

  state.multiRows = state.multiRows.filter((row) => row.rowStatus !== 'saved');
  if (!state.multiRows.length) {
    state.multiRows = [createEmptyMultiRow()];
  } else {
    state.multiRows = state.multiRows.map((row) => ({
      ...row,
      rowStatus: row.rowStatus === 'error' ? 'error' : 'draft',
    }));
  }

  persistMultiEntryDraft();
  renderMultiEntryTable();
  setSuccessHint('multi-entry-hint', `本次保存完成：成功 ${successCount} 行，失败 ${failedCount} 行。${failedCount ? '失败行已保留，可继续修改后再保存。' : ''}`);
  await bootstrapOptions();
  state.filters.page = 1;
  await loadTransactions();
}

function setEntryType(type) {
  state.entryType = type;
  document.querySelectorAll('[data-entry-type]').forEach((button) => {
    button.classList.toggle('active', button.dataset.entryType === type);
  });
  $('entry-payment-account').parentElement.classList.toggle('strong-required', type === 'expense');
}

function openEntryPanel() {
  if (!String(state.workspaceMode).startsWith('entry-')) {
    state.workspaceMode = 'entry-single';
    persistWorkspaceMode();
  }
  $('list-panel').classList.add('hidden');
  $('entry-panel').classList.remove('hidden');
  $('entry-date').value = new Date().toISOString().slice(0, 10);
  setEntryType(state.entryType || 'expense');
  setEntryMode(state.workspaceMode === 'entry-multi' ? 'multi' : state.workspaceMode === 'entry-import' ? 'import' : 'single');
}

function closeEntryPanel() {
  state.workspaceMode = 'list';
  persistWorkspaceMode();
  $('entry-panel').classList.add('hidden');
  $('list-panel').classList.remove('hidden');
  hideImportBatchesPanel();
}

function resetEntryForm() {
  $('entry-form').reset();
  $('entry-date').value = new Date().toISOString().slice(0, 10);
  setEntryType('expense');
  state.multiRows = [createEmptyMultiRow()];
  persistMultiEntryDraft();
}

function buildEntryPayload() {
  return {
    transactionType: state.entryType,
    amount: Number($('entry-amount').value),
    amountCny: Number($('entry-amount').value),
    transactionDate: $('entry-date').value,
    accountId: Number($('entry-account-id').value),
    categoryId: Number($('entry-category-id').value),
    counterpartyName: $('entry-counterparty').value.trim(),
    projectName: $('entry-project').value.trim(),
    paymentAccount: $('entry-payment-account').value.trim(),
    reimbursementRequired: $('entry-reimbursement-required').checked ? 1 : 0,
    reimbursementStatus: $('entry-reimbursement-required').checked ? 'pending' : 'none',
    summary: $('entry-summary').value.trim(),
    remark: $('entry-remark').value.trim(),
  };
}

async function submitEntry(keepOpen) {
  const payload = buildEntryPayload();
  await submitJson('/ledger/transactions', payload);
  $('entry-hint').textContent = keepOpen ? '保存成功，继续录入下一笔。' : '保存成功，已返回流水列表。';
  await bootstrapOptions();
  state.filters.page = 1;
  await loadTransactions();

  if (keepOpen) {
    resetEntryForm();
  } else {
    resetEntryForm();
    closeEntryPanel();
  }
}

function setDetailEditMode(editing) {
  state.isEditingDetail = editing;
  $('detail-grid').classList.toggle('hidden', editing);
  $('detail-edit-form').classList.toggle('hidden', !editing);
  $('edit-detail-btn').classList.toggle('hidden', editing);
  $('delete-detail-btn').classList.toggle('hidden', editing);
}

function fillDetailEditForm(tx) {
  $('detail-edit-type').value = tx.transactionType || 'expense';
  $('detail-edit-date').value = tx.transactionDate || '';
  $('detail-edit-amount').value = tx.amountCny || tx.amount || '';
  $('detail-edit-account').innerHTML = `<option value="">请选择账户</option>${state.accounts.map((item) => `<option value="${item.id}">${item.accountName}</option>`).join('')}`;
  $('detail-edit-category').innerHTML = `<option value="">请选择分类</option>${state.categories.map((item) => `<option value="${item.id}">${item.categoryName}</option>`).join('')}`;
  $('detail-edit-account').value = tx.accountId || '';
  $('detail-edit-category').value = tx.categoryId || '';
  $('detail-edit-reimbursement-status').value = tx.reimbursementStatus || 'none';
  $('detail-edit-summary').value = tx.summary || '';
  $('detail-edit-counterparty').value = tx.counterpartyName || '';
  $('detail-edit-project').value = tx.projectName || '';
  $('detail-edit-payment-account').value = tx.paymentAccount || '';
  $('detail-edit-remark').value = tx.remark || '';
}

function buildDetailEditPayload() {
  return {
    transactionType: $('detail-edit-type').value,
    transactionDate: $('detail-edit-date').value,
    amount: Number($('detail-edit-amount').value || 0),
    amountCny: Number($('detail-edit-amount').value || 0),
    accountId: Number($('detail-edit-account').value),
    categoryId: Number($('detail-edit-category').value),
    reimbursementStatus: $('detail-edit-reimbursement-status').value,
    summary: $('detail-edit-summary').value.trim(),
    counterpartyName: $('detail-edit-counterparty').value.trim(),
    projectName: $('detail-edit-project').value.trim(),
    paymentAccount: $('detail-edit-payment-account').value.trim(),
    remark: $('detail-edit-remark').value.trim(),
  };
}

async function updateTransactionDetail() {
  const tx = state.selectedDetail?.transaction;
  if (!tx) return;
  const payload = buildDetailEditPayload();
  $('list-hint').textContent = '正在保存流水修改...';

  try {
    await submitJson(`/ledger/transactions/${tx.id}`, payload, 'PUT');
    await loadTransactions();
    await loadTransactionDetail(tx.id);
    setDetailEditMode(false);
    $('list-hint').textContent = '流水修改已保存。';
  } catch (error) {
    $('list-hint').textContent = `流水修改保存失败：${error.message}`;
  }
}

async function deleteTransactionDetail() {
  const tx = state.selectedDetail?.transaction;
  if (!tx) return;
  const shouldDelete = window.confirm(`确认删除流水「${tx.summary || tx.transactionNo || tx.id}」吗？`);
  if (!shouldDelete) return;

  $('list-hint').textContent = '正在删除流水...';

  try {
    await submitJson(`/ledger/transactions/${tx.id}`, {}, 'DELETE');
    state.selectedDetail = null;
    await loadTransactions();
    if (state.selectedTransactionId) {
      await loadTransactionDetail(state.selectedTransactionId);
    } else {
      renderDetail();
    }
    $('list-hint').textContent = '流水已删除。';
  } catch (error) {
    $('list-hint').textContent = `流水删除失败：${error.message}`;
  }
}

async function updateQuickReimbursementStatus(status) {
  const tx = state.selectedDetail?.transaction;
  if (!tx) return;

  try {
    await submitJson(`/ledger/transactions/${tx.id}`, {
      transactionType: tx.transactionType,
      transactionDate: tx.transactionDate,
      amount: Number(tx.amountCny || tx.amount || 0),
      amountCny: Number(tx.amountCny || tx.amount || 0),
      accountId: Number(tx.accountId),
      categoryId: Number(tx.categoryId),
      reimbursementStatus: status,
      summary: tx.summary || '',
      counterpartyName: tx.counterpartyName || '',
      projectName: tx.projectName || '',
      paymentAccount: tx.paymentAccount || '',
      remark: tx.remark || '',
    }, 'PUT');
    if (state.isEditingDetail) {
      $('detail-edit-reimbursement-status').value = status;
    }
    await loadTransactions();
    await loadTransactionDetail(tx.id);
    $('list-hint').textContent = `报销状态已更新为：${reimbursementLabel(status)}。`;
  } catch (error) {
    $('list-hint').textContent = `报销状态更新失败：${error.message}`;
  }
}

async function uploadDetailAttachment(file) {
  const tx = state.selectedDetail?.transaction;
  if (!tx || !file) return;

  const formData = new FormData();
  formData.append('file', file);

  $('list-hint').textContent = `正在上传附件：${file.name}...`;

  try {
    await submitFormData(`/ledger/transactions/${tx.id}/attachments`, formData);
    await loadTransactionDetail(tx.id);
    $('list-hint').textContent = `附件已上传：${file.name}。`;
  } catch (error) {
    $('list-hint').textContent = `附件上传失败：${error.message}`;
  } finally {
    $('detail-attachment-input').value = '';
  }
}

function setMatchFormVisible(visible) {
  $('detail-match-form').classList.toggle('hidden', !visible);
  if (!visible) {
    $('detail-match-external-id').value = '';
    $('detail-match-status').value = 'confirmed';
  }
}

async function addDetailMatchRecord() {
  const detail = state.selectedDetail;
  const tx = detail?.transaction;
  if (!detail || !tx) return;
  const externalTransactionId = $('detail-match-external-id').value.trim();
  if (!externalTransactionId) {
    $('list-hint').textContent = '请先填写外部流水号。';
    return;
  }

  try {
    await submitJson(`/ledger/transactions/${tx.id}/matches`, {
      externalTransactionId,
      matchStatus: $('detail-match-status').value,
    });
    await loadTransactionDetail(tx.id);
    setMatchFormVisible(false);
    $('list-hint').textContent = `已新增匹配记录：${externalTransactionId}。`;
  } catch (error) {
    $('list-hint').textContent = `新增匹配记录失败：${error.message}`;
  }
}

async function removeDetailMatchRecord(matchId) {
  const detail = state.selectedDetail;
  const tx = detail?.transaction;
  if (!detail?.matches || !tx) return;

  try {
    await submitJson(`/ledger/transactions/${tx.id}/matches/${matchId}`, {}, 'DELETE');
    await loadTransactionDetail(tx.id);
    $('list-hint').textContent = '匹配记录已删除。';
  } catch (error) {
    $('list-hint').textContent = `删除匹配记录失败：${error.message}`;
  }
}

async function updateDetailMatchStatus(matchId, status) {
  const detail = state.selectedDetail;
  const tx = detail?.transaction;
  const target = detail?.matches?.find((item) => String(item.id) === String(matchId));
  if (!target || !tx) return;

  try {
    await submitJson(`/ledger/transactions/${tx.id}/matches/${matchId}`, {
      externalTransactionId: target.externalTransactionId,
      matchStatus: status,
    }, 'PUT');
    await loadTransactionDetail(tx.id);
    $('list-hint').textContent = `匹配状态已更新为：${status}。`;
  } catch (error) {
    $('list-hint').textContent = `更新匹配状态失败：${error.message}`;
  }
}

function bindMatchRecordActions() {
  document.querySelectorAll('[data-remove-match]').forEach((button) => {
    button.addEventListener('click', async () => {
      await removeDetailMatchRecord(button.dataset.removeMatch);
    });
  });

  document.querySelectorAll('[data-match-status-select]').forEach((select) => {
    select.addEventListener('change', async () => {
      await updateDetailMatchStatus(select.dataset.matchStatusSelect, select.value);
    });
  });
}

function detailItem(label, value) {
  return `<div class="detail-item"><span>${label}</span><strong>${value || '-'}</strong></div>`;
}

function renderDetail() {
  const detail = state.selectedDetail;
  if (!detail || !detail.transaction) {
    $('detail-empty').classList.remove('hidden');
    $('detail-card').classList.add('hidden');
    setDetailEditMode(false);
    return;
  }

  const tx = detail.transaction;
  $('detail-empty').classList.add('hidden');
  $('detail-card').classList.remove('hidden');
  $('detail-type').textContent = typeLabel(tx.transactionType);
  $('detail-title').textContent = tx.summary || tx.transactionNo || '流水详情';
  $('detail-subtitle').textContent = `${tx.transactionDate || '-'} · ${state.accounts.find((acc) => acc.id === tx.accountId)?.accountName || '未绑定账户'}`;
  $('detail-amount').textContent = currency(tx.amountCny || tx.amount);

  $('detail-grid').innerHTML = [
    detailItem('流水编号', tx.transactionNo),
    detailItem('交易类型', typeLabel(tx.transactionType)),
    detailItem('账户', state.accounts.find((acc) => acc.id === tx.accountId)?.accountName || tx.accountId),
    detailItem('分类', state.categories.find((cat) => cat.id === tx.categoryId)?.categoryName || tx.categoryId),
    detailItem('商家', tx.counterpartyName),
    detailItem('项目', tx.projectName),
    detailItem('报销状态', reimbursementLabel(tx.reimbursementStatus)),
    detailItem('付款账号', tx.paymentAccount),
    detailItem('备注', tx.remark),
  ].join('');

  fillDetailEditForm(tx);
  setDetailEditMode(state.isEditingDetail);

  $('detail-attachments').innerHTML = detail.attachments?.length
    ? detail.attachments.map((item) => `<div class="stack-item"><strong>${item.fileName}</strong><span>${item.fileUrl}</span></div>`).join('')
    : '<div class="stack-empty">暂无附件</div>';

  $('detail-matches').innerHTML = detail.matches?.length
    ? detail.matches.map((item) => `
      <div class="stack-item match-stack-item">
        <div>
          <strong>外部流水 ${item.externalTransactionId}</strong>
          <span>匹配记录</span>
        </div>
        <div class="detail-action-row">
          <select data-match-status-select="${item.id}" class="match-status-select">
            <option value="confirmed" ${item.matchStatus === 'confirmed' ? 'selected' : ''}>confirmed</option>
            <option value="pending" ${item.matchStatus === 'pending' ? 'selected' : ''}>pending</option>
            <option value="manual" ${item.matchStatus === 'manual' ? 'selected' : ''}>manual</option>
          </select>
          <button class="text-btn" type="button" data-remove-match="${item.id}">删除</button>
        </div>
      </div>
    `).join('')
    : '<div class="stack-empty">暂无匹配记录</div>';

  bindMatchRecordActions();
}

async function loadTransactions() {
  $('list-hint').textContent = '正在加载流水列表...';
  const result = await request('/ledger/transactions', state.filters);
  state.transactions = result.list || [];
  state.pagination = result.pagination || { page: 1, total_pages: 1, total: 0 };

  if (!state.selectedTransactionId && state.transactions[0]) {
    state.selectedTransactionId = state.transactions[0].id;
    persistSelectedTransaction();
  }

  if (state.selectedTransactionId && !state.transactions.some((item) => item.id === state.selectedTransactionId)) {
    state.selectedTransactionId = state.transactions[0]?.id || null;
    persistSelectedTransaction();
  }

  renderActiveFilters();
  renderTable();
  renderPagination();
  updateSummary();
  setIdleHint('list-hint', '点击左侧筛选后刷新；点击任意流水查看右侧详情。');

  if (state.selectedTransactionId) {
    await loadTransactionDetail(state.selectedTransactionId);
  } else {
    state.selectedDetail = null;
    renderDetail();
  }
}

async function loadTransactionDetail(id) {
  try {
    const detail = await request(`/ledger/transactions/${id}`);
    state.selectedTransactionId = detail?.transaction?.id || id;
    persistSelectedTransaction();
    state.selectedDetail = detail;
    renderTable();
    renderDetail();
  } catch (error) {
    state.selectedDetail = null;
    renderDetail();
    setErrorHint('list-hint', `详情加载失败：${error.message}`);
  }
}

function applyQuickRange(range) {
  const now = new Date();
  const format = (date) => date.toISOString().slice(0, 10);

  if (range === 'current-month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    $('startDate').value = format(start);
    $('endDate').value = format(now);
  } else if (range === 'last-30') {
    const start = new Date(now);
    start.setDate(now.getDate() - 29);
    $('startDate').value = format(start);
    $('endDate').value = format(now);
  } else if (range === 'this-year') {
    const start = new Date(now.getFullYear(), 0, 1);
    $('startDate').value = format(start);
    $('endDate').value = format(now);
  } else if (range === 'clear') {
    $('startDate').value = '';
    $('endDate').value = '';
  }
}

function resetFilters() {
  $('filter-form').reset();
  state.filters = {
    keyword: '',
    transactionType: '',
    reimbursementStatus: '',
    startDate: '',
    endDate: '',
    accountId: '',
    categoryId: '',
    page: 1,
    pageSize: 20,
  };
}

function seedSavedViews() {
  state.savedViews = [
    {
      id: 1,
      name: '待报销支出',
      summary: '支出 · 审批中',
      filters: {
        keyword: '',
        transactionType: 'expense',
        reimbursementStatus: 'pending',
        startDate: '',
        endDate: '',
        accountId: '',
        categoryId: '',
        page: 1,
        pageSize: 20,
      },
    },
    {
      id: 2,
      name: '本月收入',
      summary: '收入 · 本月',
      filters: {
        keyword: '',
        transactionType: 'income',
        reimbursementStatus: '',
        startDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().slice(0, 10),
        endDate: new Date().toISOString().slice(0, 10),
        accountId: '',
        categoryId: '',
        page: 1,
        pageSize: 20,
      },
    },
  ];
  state.activeSavedViewId = state.savedViews[0]?.id || null;
  persistSavedViews();
  renderSavedViews();
}

function bindEvents() {
  $('login-btn').addEventListener('click', async () => {
    try {
      await login();
      await bootstrapOptions();
      await loadTransactions();
    } catch (error) {
      setErrorHint('list-hint', `登录失败：${error.message}`);
    }
  });

  $('refresh-btn').addEventListener('click', async () => {
    if (!state.token) return;
    await bootstrapOptions();
    await loadTransactions();
  });

  $('reset-btn').addEventListener('click', async () => {
    resetFilters();
    persistFilters();
    if (state.token) {
      await loadTransactions();
    }
  });

  $('filter-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    state.filters = {
      keyword: $('keyword').value.trim(),
      transactionType: $('transactionType').value,
      reimbursementStatus: $('reimbursementStatus').value,
      startDate: $('startDate').value,
      endDate: $('endDate').value,
      accountId: $('accountId').value,
      categoryId: $('categoryId').value,
      page: 1,
      pageSize: 20,
    };
    persistFilters();
    await loadTransactions();
  });

  $('prev-page').addEventListener('click', async () => {
    if (state.filters.page <= 1) return;
    state.filters.page -= 1;
    await loadTransactions();
  });

  $('next-page').addEventListener('click', async () => {
    if (state.filters.page >= state.pagination.total_pages) return;
    state.filters.page += 1;
    await loadTransactions();
  });

  document.querySelectorAll('[data-range]').forEach((button) => {
    button.addEventListener('click', async () => {
      document.querySelectorAll('[data-range]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      applyQuickRange(button.dataset.range);
      state.filters.startDate = $('startDate').value;
      state.filters.endDate = $('endDate').value;
      state.filters.page = 1;
      persistFilters();
      if (state.token) {
        await loadTransactions();
      }
    });
  });

  $('saved-view-btn').addEventListener('click', () => {
    saveCurrentView();
  });

  $('overwrite-saved-view-btn').addEventListener('click', () => {
    overwriteActiveSavedView();
  });

  $('new-entry-btn').addEventListener('click', () => {
    openEntryPanel();
  });

  $('close-entry-btn').addEventListener('click', () => {
    closeEntryPanel();
  });

  $('close-multi-entry-btn').addEventListener('click', () => {
    closeEntryPanel();
  });

  $('close-import-confirm-btn').addEventListener('click', () => {
    closeEntryPanel();
  });

  $('edit-detail-btn').addEventListener('click', () => {
    state.isEditingDetail = true;
    renderDetail();
  });

  $('cancel-edit-detail-btn').addEventListener('click', () => {
    state.isEditingDetail = false;
    renderDetail();
  });

  $('detail-edit-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    await updateTransactionDetail();
  });

  $('delete-detail-btn').addEventListener('click', async () => {
    await deleteTransactionDetail();
  });

  document.querySelectorAll('[data-quick-reimbursement]').forEach((button) => {
    button.addEventListener('click', async () => {
      await updateQuickReimbursementStatus(button.dataset.quickReimbursement);
    });
  });

  $('detail-attachment-input').addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await uploadDetailAttachment(file);
  });

  $('add-match-record-btn').addEventListener('click', () => {
    setMatchFormVisible(true);
  });

  $('cancel-match-record-btn').addEventListener('click', () => {
    setMatchFormVisible(false);
  });

  $('detail-match-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    await addDetailMatchRecord();
  });

  $('single-entry-mode-btn').addEventListener('click', () => setEntryMode('single'));
  $('multi-entry-mode-btn').addEventListener('click', () => setEntryMode('multi'));
  $('import-confirm-mode-btn').addEventListener('click', () => setEntryMode('import'));

  document.querySelectorAll('[data-entry-type]').forEach((button) => {
    button.addEventListener('click', () => setEntryType(button.dataset.entryType));
  });

  $('entry-form').addEventListener('submit', async (event) => {
    event.preventDefault();
    if (!event.currentTarget.reportValidity()) {
      setErrorHint('entry-hint', '请先补全记一笔表单中的必填字段。');
      return;
    }
    try {
      await submitEntry(false);
    } catch (error) {
      setErrorHint('entry-hint', `保存失败：${error.message}`);
    }
  });

  $('submit-continue-btn').addEventListener('click', async () => {
    if (!$('entry-form').reportValidity()) {
      setErrorHint('entry-hint', '请先补全记一笔表单中的必填字段。');
      return;
    }
    try {
      await submitEntry(true);
    } catch (error) {
      setErrorHint('entry-hint', `保存失败：${error.message}`);
    }
  });

  $('batch-entry-btn').addEventListener('click', () => {
    openEntryPanel();
    setEntryMode('multi');
  });

  $('load-demo-import-btn').addEventListener('click', () => {
    state.importRows = createDemoImportRows();
    persistImportState();
    renderImportConfirmTable();
    setSuccessHint('import-confirm-hint', '已载入示例导入结果，可按实际场景补全分类、账户、摘要后确认。');
  });

  $('load-demo-batches-btn').addEventListener('click', async () => {
    await loadImportBatches();
    if (!state.importBatches.length) {
      state.importBatches = createDemoImportBatches();
      persistImportState();
      renderImportBatchesTable();
    }
    state.selectedImportBatchNo = state.importBatches[0]?.batchNo || '';
    $('batch-list-hint').textContent = '已加载批次数据。';
  });

  $('open-import-confirm-from-batches-btn').addEventListener('click', () => {
    if (!state.selectedImportBatchNo && state.importBatches[0]) {
      state.selectedImportBatchNo = state.importBatches[0].batchNo;
    }
    if (state.selectedImportBatchNo) {
      openImportBatch(state.selectedImportBatchNo);
    }
  });

  $('close-batches-btn').addEventListener('click', () => {
    hideImportBatchesPanel();
  });

  document.querySelectorAll('[data-batch-filter]').forEach((button) => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-batch-filter]').forEach((item) => item.classList.remove('active'));
      button.classList.add('active');
      state.batchFilter = button.dataset.batchFilter;
      renderImportBatchesTable();
    });
  });

  $('mark-all-create-btn').addEventListener('click', () => {
    state.importRows = state.importRows.map((row) => ({
      ...row,
      matchStatus: '待新增',
      rowStatus: row.rowStatus === '失败' ? '待确认' : row.rowStatus,
      errorMessage: '',
    }));
    persistImportState();
    renderImportConfirmTable();
    syncCurrentBatchSummary();
  });

  $('confirm-import-btn').addEventListener('click', async () => {
    try {
      await confirmImportRows();
    } catch (error) {
      setErrorHint('import-confirm-hint', `确认入账失败：${error.message}`);
    }
  });

  $('add-row-btn').addEventListener('click', () => addMultiRows(1));
  $('copy-last-row-btn').addEventListener('click', () => addMultiRows(1, true));
  $('save-all-rows-btn').addEventListener('click', async () => {
    try {
      await saveAllMultiRows();
    } catch (error) {
      setErrorHint('multi-entry-hint', `批量保存失败：${error.message}`);
    }
  });

  $('saved-view-btn').insertAdjacentHTML('afterend', '<button id="import-confirm-entry-btn" class="ghost-btn" type="button">导入确认</button><button id="import-batches-entry-btn" class="ghost-btn" type="button">导入批次</button>');
  $('import-confirm-entry-btn').addEventListener('click', () => {
    openEntryPanel();
    setEntryMode('import');
  });
  $('import-batches-entry-btn').addEventListener('click', () => {
    showImportBatchesPanel();
  });
}

function init() {
  bindEvents();
  resetEntryForm();
  hydrateFilters();
  hydrateSelectedTransaction();
  hydrateWorkspaceMode();
  hydrateImportState();
  hydrateMultiEntryDraft();
  renderActiveFilters();
  renderDetail();
  hydrateSavedViews();
  loadPersistedFiltersIntoForm();
  restoreWorkspaceMode();
}

init();
