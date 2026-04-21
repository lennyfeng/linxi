USE internal_platform;

INSERT INTO departments (name, code, status)
SELECT '平台研发部', 'RD-PLATFORM', 'active'
WHERE NOT EXISTS (
  SELECT 1 FROM departments WHERE code = 'RD-PLATFORM'
);

INSERT INTO users (username, name, source_type, department_id, status)
SELECT 'admin', '系统管理员', 'local', d.id, 'active'
FROM departments d
WHERE d.code = 'RD-PLATFORM'
  AND NOT EXISTS (
    SELECT 1 FROM users WHERE username = 'admin'
  );

INSERT INTO roles (role_key, role_name, status)
SELECT 'platform-admin', '平台管理员', 'active'
WHERE NOT EXISTS (
  SELECT 1 FROM roles WHERE role_key = 'platform-admin'
);

INSERT INTO permissions (permission_key, permission_name, permission_type, module_key)
SELECT 'users.read', '查看用户', 'api', 'users'
WHERE NOT EXISTS (
  SELECT 1 FROM permissions WHERE permission_key = 'users.read'
);
