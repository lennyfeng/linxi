const $ = (id) => document.getElementById(id);

const state = {
  token: localStorage.getItem('token') || '',
};

async function request(path) {
  const response = await fetch(path, {
    headers: state.token ? { Authorization: `Bearer ${state.token}` } : {},
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
  loadAll();
}

async function loadHealth() {
  try {
    const health = await request('/health');
    $('h-api').textContent = 'OK';
    $('h-api').classList.add('h-ok');
    $('h-db').textContent = health.db?.connected ? 'Connected' : 'Disconnected';
    $('h-db').classList.add(health.db?.connected ? 'h-ok' : 'h-err');
  } catch {
    $('h-api').textContent = 'Unreachable';
    $('h-api').classList.add('h-err');
    $('h-db').textContent = 'Unknown';
  }
}

async function loadModules() {
  try {
    const modules = await request('/modules');
    $('h-modules').textContent = `${modules.length} registered`;
    $('h-modules').classList.add('h-ok');
  } catch { /* ignore */ }
}

async function loadUser() {
  if (!state.token) {
    $('h-user').textContent = 'Not logged in';
    $('user-info').textContent = '';
    return;
  }
  try {
    const user = await request('/auth/me');
    const name = user?.username || user?.display_name || 'admin';
    $('h-user').textContent = name;
    $('h-user').classList.add('h-ok');
    $('user-info').textContent = `Logged in as ${name}`;
  } catch {
    $('h-user').textContent = 'Token expired';
    $('h-user').classList.add('h-err');
    $('user-info').textContent = '';
  }
}

async function loadLedgerStats() {
  try {
    const [txResult, accResult, impResult] = await Promise.all([
      request('/ledger/transactions?page=1&pageSize=1'),
      request('/ledger/accounts?page=1&pageSize=1'),
      request('/ledger/imports?page=1&pageSize=1'),
    ]);
    $('s-transactions').textContent = txResult?.pagination?.total ?? txResult?.list?.length ?? '--';
    $('s-accounts').textContent = accResult?.pagination?.total ?? accResult?.list?.length ?? '--';
    $('s-imports').textContent = impResult?.pagination?.total ?? impResult?.list?.length ?? '--';
  } catch { /* ignore */ }
}

async function loadReconStats() {
  try {
    const snapshots = await request('/reconciliation/status-snapshots');
    if (Array.isArray(snapshots)) {
      $('s-recon-matched').textContent = snapshots.filter((s) => s.relationStatus === 'matched').length;
      $('s-recon-partial').textContent = snapshots.filter((s) => s.relationStatus === 'partial').length;
      $('s-recon-pending').textContent = snapshots.filter((s) => s.relationStatus === 'pending').length;
    }
  } catch { /* ignore */ }
}

async function loadProductStats() {
  try {
    const projects = await request('/product-dev/projects');
    if (Array.isArray(projects)) {
      $('s-projects').textContent = projects.length;
      $('s-synced').textContent = projects.filter((p) => p.projectStatus === '已同步领星').length;
    }
  } catch { /* ignore */ }
}

async function loadAuthStats() {
  try {
    const [users, roles, departments] = await Promise.all([
      request('/users?page=1&pageSize=1'),
      request('/roles'),
      request('/departments'),
    ]);
    $('s-users').textContent = users?.pagination?.total ?? (Array.isArray(users) ? users.length : '--');
    $('s-roles').textContent = Array.isArray(roles) ? roles.length : '--';
    $('s-departments').textContent = Array.isArray(departments) ? departments.length : '--';
  } catch { /* ignore */ }
}

function loadAll() {
  loadHealth();
  loadModules();
  loadUser();
  loadLedgerStats();
  loadReconStats();
  loadProductStats();
  loadAuthStats();
}

function init() {
  $('login-btn').addEventListener('click', login);
  loadAll();
}

init();
