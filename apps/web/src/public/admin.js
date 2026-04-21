const $ = (id) => document.getElementById(id);

const state = {
  token: localStorage.getItem('token') || '',
  activeTab: 'users',
  users: [],
  roles: [],
  departments: [],
  permissions: [],
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
  await loadList();
}

async function loadList() {
  const tab = state.activeTab;
  $('list-hint').textContent = 'Loading...';
  $('list-hint').classList.remove('error-text');

  try {
    if (tab === 'users') {
      const result = await request('/users', { page: 1, pageSize: 100 });
      state.users = result?.list || (Array.isArray(result) ? result : []);
    } else if (tab === 'roles') {
      state.roles = await request('/roles') || [];
    } else if (tab === 'departments') {
      state.departments = await request('/departments') || [];
    } else if (tab === 'permissions') {
      state.permissions = await request('/permissions') || [];
    }
    $('list-hint').textContent = '';
    renderList();
  } catch (error) {
    $('list-hint').textContent = `Load failed: ${error.message}`;
    $('list-hint').classList.add('error-text');
  }
}

function renderList() {
  const tab = state.activeTab;
  const titles = { users: 'Users', roles: 'Roles', departments: 'Departments', permissions: 'Permissions' };
  $('list-title').textContent = titles[tab];

  let headHtml = '';
  let bodyHtml = '';

  if (tab === 'users') {
    headHtml = '<tr><th>Username</th><th>Name</th><th>Status</th></tr>';
    bodyHtml = state.users.map((u) => `<tr data-id="${u.id}" class="${state.selectedId === u.id ? 'selected' : ''}"><td>${u.username || '--'}</td><td>${u.display_name || u.displayName || '--'}</td><td><span class="status-dot ${u.status === 'active' ? 'active' : 'inactive'}"></span>${u.status || '--'}</td></tr>`).join('');
    if (!state.users.length) $('list-hint').textContent = 'No users found.';
  } else if (tab === 'roles') {
    headHtml = '<tr><th>Role Name</th><th>Code</th></tr>';
    bodyHtml = state.roles.map((r) => `<tr data-id="${r.id}" class="${state.selectedId === r.id ? 'selected' : ''}"><td>${r.role_name || r.roleName || '--'}</td><td>${r.role_code || r.roleCode || '--'}</td></tr>`).join('');
    if (!state.roles.length) $('list-hint').textContent = 'No roles found.';
  } else if (tab === 'departments') {
    headHtml = '<tr><th>Department</th><th>Code</th></tr>';
    bodyHtml = state.departments.map((d) => `<tr data-id="${d.id}" class="${state.selectedId === d.id ? 'selected' : ''}"><td>${d.department_name || d.departmentName || '--'}</td><td>${d.department_code || d.departmentCode || '--'}</td></tr>`).join('');
    if (!state.departments.length) $('list-hint').textContent = 'No departments found.';
  } else if (tab === 'permissions') {
    headHtml = '<tr><th>Permission</th><th>Code</th></tr>';
    bodyHtml = state.permissions.map((p) => `<tr data-id="${p.id}" class="${state.selectedId === p.id ? 'selected' : ''}"><td>${p.permission_name || p.permissionName || '--'}</td><td>${p.permission_code || p.permissionCode || '--'}</td></tr>`).join('');
    if (!state.permissions.length) $('list-hint').textContent = 'No permissions found.';
  }

  $('list-thead').innerHTML = headHtml;
  $('list-tbody').innerHTML = bodyHtml;

  $('list-tbody').querySelectorAll('tr[data-id]').forEach((tr) => {
    tr.addEventListener('click', () => {
      state.selectedId = Number(tr.dataset.id);
      renderList();
      renderDetail();
    });
  });
}

function renderDetail() {
  const tab = state.activeTab;
  const id = state.selectedId;
  if (!id) return;

  if (tab === 'users') {
    const user = state.users.find((u) => u.id === id);
    if (!user) { $('detail-content').innerHTML = '<p class="hint-text">Not found.</p>'; return; }
    $('detail-title').textContent = `User: ${user.username || user.id}`;
    $('detail-content').innerHTML = `
      <div class="detail-section"><div class="detail-kv">
        <span class="k">ID</span><span class="v">${user.id}</span>
        <span class="k">Username</span><span class="v">${user.username || '--'}</span>
        <span class="k">Display Name</span><span class="v">${user.display_name || user.displayName || '--'}</span>
        <span class="k">Email</span><span class="v">${user.email || '--'}</span>
        <span class="k">Mobile</span><span class="v">${user.mobile || '--'}</span>
        <span class="k">Status</span><span class="v"><span class="status-dot ${user.status === 'active' ? 'active' : 'inactive'}"></span>${user.status || '--'}</span>
        <span class="k">Last Login</span><span class="v">${user.last_login_at || user.lastLoginAt || '--'}</span>
        <span class="k">Created</span><span class="v">${user.created_at || user.createdAt || '--'}</span>
      </div></div>
      <div class="detail-section"><h4>Edit User</h4>
        <div class="edit-form">
          <div class="form-row">
            <input id="edit-display-name" type="text" placeholder="Display Name" value="${user.display_name || user.displayName || ''}" />
            <select id="edit-status"><option value="active" ${user.status === 'active' ? 'selected' : ''}>Active</option><option value="inactive" ${user.status === 'inactive' ? 'selected' : ''}>Inactive</option></select>
          </div>
          <div class="form-row">
            <input id="edit-email" type="email" placeholder="Email" value="${user.email || ''}" />
            <input id="edit-mobile" type="text" placeholder="Mobile" value="${user.mobile || ''}" />
          </div>
          <button class="primary-btn" id="save-user-btn">Save</button>
          <span class="hint-text" id="edit-hint"></span>
        </div>
      </div>
    `;
    document.getElementById('save-user-btn')?.addEventListener('click', async () => {
      const hint = $('edit-hint');
      try {
        await submitJson(`/users/${id}`, {
          display_name: document.getElementById('edit-display-name')?.value,
          status: document.getElementById('edit-status')?.value,
          email: document.getElementById('edit-email')?.value,
          mobile: document.getElementById('edit-mobile')?.value,
        }, 'PUT');
        hint.textContent = 'Saved!';
        hint.classList.remove('error-text');
        await loadList();
      } catch (error) {
        hint.textContent = error.message;
        hint.classList.add('error-text');
      }
    });
  } else if (tab === 'roles') {
    const role = state.roles.find((r) => r.id === id);
    if (!role) return;
    $('detail-title').textContent = `Role: ${role.role_name || role.roleName}`;
    $('detail-content').innerHTML = `<div class="detail-section"><div class="detail-kv">
      <span class="k">ID</span><span class="v">${role.id}</span>
      <span class="k">Name</span><span class="v">${role.role_name || role.roleName || '--'}</span>
      <span class="k">Code</span><span class="v">${role.role_code || role.roleCode || '--'}</span>
      <span class="k">Description</span><span class="v">${role.description || '--'}</span>
    </div></div>`;
  } else if (tab === 'departments') {
    const dept = state.departments.find((d) => d.id === id);
    if (!dept) return;
    $('detail-title').textContent = `Department: ${dept.department_name || dept.departmentName}`;
    $('detail-content').innerHTML = `<div class="detail-section"><div class="detail-kv">
      <span class="k">ID</span><span class="v">${dept.id}</span>
      <span class="k">Name</span><span class="v">${dept.department_name || dept.departmentName || '--'}</span>
      <span class="k">Code</span><span class="v">${dept.department_code || dept.departmentCode || '--'}</span>
      <span class="k">Parent ID</span><span class="v">${dept.parent_id || dept.parentId || '--'}</span>
    </div></div>`;
  } else if (tab === 'permissions') {
    const perm = state.permissions.find((p) => p.id === id);
    if (!perm) return;
    $('detail-title').textContent = `Permission: ${perm.permission_name || perm.permissionName}`;
    $('detail-content').innerHTML = `<div class="detail-section"><div class="detail-kv">
      <span class="k">ID</span><span class="v">${perm.id}</span>
      <span class="k">Name</span><span class="v">${perm.permission_name || perm.permissionName || '--'}</span>
      <span class="k">Code</span><span class="v">${perm.permission_code || perm.permissionCode || '--'}</span>
      <span class="k">Type</span><span class="v">${perm.permission_type || perm.permissionType || '--'}</span>
      <span class="k">Module</span><span class="v">${perm.module_key || perm.moduleKey || '--'}</span>
    </div></div>`;
  }
}

function switchTab(tab) {
  state.activeTab = tab;
  state.selectedId = null;
  document.querySelectorAll('.admin-tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
  $('detail-title').textContent = 'Detail';
  $('detail-content').innerHTML = '<p class="hint-text">Select an item from the list.</p>';
  loadList();
}

function init() {
  $('login-btn').addEventListener('click', login);
  document.querySelectorAll('.admin-tab').forEach((tab) => {
    tab.addEventListener('click', () => switchTab(tab.dataset.tab));
  });
  loadList();
}

init();
