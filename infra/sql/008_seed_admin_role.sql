-- Assign platform-admin role to admin user

USE internal_platform;

INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.username = 'admin' AND r.role_key = 'platform-admin'
  AND NOT EXISTS (
    SELECT 1 FROM user_roles ur WHERE ur.user_id = u.id AND ur.role_id = r.id
  );
