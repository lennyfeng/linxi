const base = process.env.API_BASE_URL || 'http://127.0.0.1:3000';

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

async function main() {
  console.log(`Auth/users regression testing: ${base}`);

  const users = await req('GET', '/users');
  const departments = await req('GET', '/departments');
  const roles = await req('GET', '/roles');
  const permissions = await req('GET', '/permissions');

  ok(Array.isArray(users), '/users should return array');
  ok(Array.isArray(departments), '/departments should return array');
  ok(Array.isArray(roles), '/roles should return array');
  ok(Array.isArray(permissions), '/permissions should return array');

  const admin = users.find((item) => item.username === 'admin');
  ok(admin, 'admin user missing');
  ok(admin.name === '系统管理员', 'admin name mismatch');

  const dept = departments.find((item) => item.name === '平台研发部');
  ok(dept, 'platform department missing');

  const role = roles.find((item) => item.roleKey === 'platform-admin');
  ok(role, 'platform-admin role missing');

  const perm = permissions.find((item) => item.permissionKey === 'users.read');
  ok(perm, 'users.read permission missing');

  const loginAdmin = await req('POST', '/auth/login', {
    loginType: 'local',
    username: 'admin',
  });
  ok(loginAdmin?.token === 'mock-token-internal-platform', 'admin login token mismatch');
  ok(loginAdmin?.user?.username === 'admin', 'admin login user mismatch');

  const loginUnknown = await req('POST', '/auth/login', {
    loginType: 'local',
    username: 'ghost-user',
  });
  ok(loginUnknown?.token === '', 'unknown login token should be empty');
  ok(loginUnknown?.user === null, 'unknown login user should be null');

  const callback = await req('GET', '/auth/feishu/callback');
  ok(callback?.loginType === 'feishu', 'feishu callback loginType mismatch');
  ok(callback?.mode === 'callback-placeholder', 'feishu callback mode mismatch');

  console.log('Auth/users regression passed.');
}

main().catch((e) => {
  console.error(`\nAuth/users regression failed: ${e.message}`);
  process.exit(1);
});
