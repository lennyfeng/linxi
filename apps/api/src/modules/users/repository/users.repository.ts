import bcrypt from 'bcryptjs';
import { buildPagination } from '../../../common/pagination.js';
import { query } from '../../../database/index.js';
import type { User, Department, Role, Permission } from '../../../common/entity-types.js';

// ---------------------------------------------------------------------------
// Users
// ---------------------------------------------------------------------------
export async function listUsers(filters: Record<string, string>, page: number, pageSize: number) {
  const whereClauses: string[] = [];
  const params: unknown[] = [];

  if (filters.status) {
    whereClauses.push('u.status = ?');
    params.push(filters.status);
  }

  if (filters.departmentId) {
    whereClauses.push('u.department_id = ?');
    params.push(Number(filters.departmentId));
  }

  if (filters.keyword) {
    whereClauses.push('(u.display_name LIKE ? OR u.username LIKE ? OR u.email LIKE ?)');
    params.push(`%${filters.keyword}%`, `%${filters.keyword}%`, `%${filters.keyword}%`);
  }

  const whereSql = whereClauses.length ? ` WHERE ${whereClauses.join(' AND ')}` : '';
  const offset = (page - 1) * pageSize;

  const listSql = `SELECT
      u.id,
      u.display_name   AS name,
      u.username,
      u.email,
      u.phone          AS mobile,
      u.department_id  AS departmentId,
      d.name           AS departmentName,
      u.status,
      u.created_at     AS createdAt
    FROM users u
    LEFT JOIN departments d ON d.id = u.department_id
    ${whereSql}
    ORDER BY u.id DESC
    LIMIT ? OFFSET ?`;

  const countSql = `SELECT COUNT(*) AS total FROM users u${whereSql}`;

  const rows = await query<User>(listSql, [...params, pageSize, offset]);
  const totalRows = await query(countSql, params);

  return {
    list: rows,
    pagination: buildPagination(page, pageSize, Number(totalRows[0]?.total || 0)),
  };
}

export async function getUserById(id: number): Promise<User | null> {
  const rows = await query<User>(
    `SELECT
      u.id,
      u.display_name   AS name,
      u.username,
      u.email,
      u.phone          AS mobile,
      u.department_id  AS departmentId,
      d.name           AS departmentName,
      u.status,
      u.created_at     AS createdAt
    FROM users u
    LEFT JOIN departments d ON d.id = u.department_id
    WHERE u.id = ?`,
    [id],
  );
  return rows[0] || null;
}

export async function createUserRecord(payload: {
  username: string;
  name: string;
  email?: string | null;
  mobile?: string | null;
  sourceType: string;
  departmentId?: number | null;
  status: string;
  password?: string;
  roleIds?: number[];
}) {
  let passwordHash: string | null = null;
  if (payload.password) {
    passwordHash = await bcrypt.hash(payload.password, 10);
  }

  const result: any = await query(
    `INSERT INTO users (username, display_name, email, phone, department_id, status, password_hash, must_change_password)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      payload.username,
      payload.name,
      payload.email || null,
      payload.mobile || null,
      payload.departmentId || null,
      payload.status,
      passwordHash,
      passwordHash ? 1 : 0,
    ],
  );

  const userId = Number(result.insertId);

  // Assign roles if provided
  if (payload.roleIds?.length) {
    for (const roleId of payload.roleIds) {
      await query('INSERT IGNORE INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleId]);
    }
  }

  return await getUserById(userId);
}

export async function updateUserRecord(id: number, payload: {
  name?: string;
  email?: string | null;
  mobile?: string | null;
  departmentId?: number | null;
  status?: string;
}) {
  const sets: string[] = [];
  const params: unknown[] = [];

  if (payload.name !== undefined) { sets.push('display_name = ?'); params.push(payload.name); }
  if (payload.email !== undefined) { sets.push('email = ?'); params.push(payload.email); }
  if (payload.mobile !== undefined) { sets.push('phone = ?'); params.push(payload.mobile); }
  if (payload.departmentId !== undefined) { sets.push('department_id = ?'); params.push(payload.departmentId); }
  if (payload.status !== undefined) { sets.push('status = ?'); params.push(payload.status); }

  if (!sets.length) return await getUserById(id);

  await query(`UPDATE users SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
  return await getUserById(id);
}

export async function enableUser(id: number): Promise<User | null> {
  await query('UPDATE users SET status = ? WHERE id = ?', ['active', id]);
  return await getUserById(id);
}

export async function disableUser(id: number): Promise<User | null> {
  await query('UPDATE users SET status = ? WHERE id = ?', ['disabled', id]);
  return await getUserById(id);
}

export async function resetUserPassword(id: number, newPassword: string): Promise<void> {
  const hash = await bcrypt.hash(newPassword, 10);
  await query('UPDATE users SET password_hash = ?, must_change_password = 1 WHERE id = ?', [hash, id]);
}

export async function setUserRoles(userId: number, roleIds: number[]): Promise<void> {
  await query('DELETE FROM user_roles WHERE user_id = ?', [userId]);
  for (const roleId of roleIds) {
    await query('INSERT INTO user_roles (user_id, role_id) VALUES (?, ?)', [userId, roleId]);
  }
}

// ---------------------------------------------------------------------------
// Departments CRUD
// ---------------------------------------------------------------------------
export async function listDepartments(): Promise<Department[]> {
  return await query<Department>(
    `SELECT
      id,
      name,
      parent_id AS parentId,
      sort_order AS sortOrder,
      created_at AS createdAt
    FROM departments
    WHERE deleted_at IS NULL
    ORDER BY sort_order ASC, id ASC`,
  );
}

export async function createDepartment(payload: { name: string; parentId?: number | null; code?: string }): Promise<Department | null> {
  const result: any = await query(
    'INSERT INTO departments (name, parent_id) VALUES (?, ?)',
    [payload.name, payload.parentId || null],
  );
  const rows = await query<Department>('SELECT id, name, parent_id AS parentId, sort_order AS sortOrder FROM departments WHERE id = ?', [result.insertId]);
  return rows[0] || null;
}

export async function updateDepartment(id: number, payload: { name?: string; parentId?: number | null }): Promise<Department | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  if (payload.name !== undefined) { sets.push('name = ?'); params.push(payload.name); }
  if (payload.parentId !== undefined) { sets.push('parent_id = ?'); params.push(payload.parentId); }
  if (!sets.length) {
    const rows = await query<Department>('SELECT id, name, parent_id AS parentId, sort_order AS sortOrder FROM departments WHERE id = ?', [id]);
    return rows[0] || null;
  }
  await query(`UPDATE departments SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
  const rows = await query<Department>('SELECT id, name, parent_id AS parentId, sort_order AS sortOrder FROM departments WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function softDeleteDepartment(id: number): Promise<void> {
  await query('UPDATE departments SET deleted_at = NOW() WHERE id = ?', [id]);
}

// ---------------------------------------------------------------------------
// Roles CRUD
// ---------------------------------------------------------------------------
export async function listRoles(): Promise<Role[]> {
  return await query<Role>(
    `SELECT
      id,
      name,
      description,
      is_system AS isSystem
    FROM roles
    ORDER BY id ASC`,
  );
}

export async function createRole(payload: { roleKey: string; roleName: string; description?: string | null }): Promise<Role | null> {
  const result: any = await query(
    'INSERT INTO roles (name, description) VALUES (?, ?)',
    [payload.roleName, payload.description || null],
  );
  const rows = await query<Role>('SELECT id, name, description, is_system AS isSystem FROM roles WHERE id = ?', [result.insertId]);
  return rows[0] || null;
}

export async function updateRole(id: number, payload: { roleName?: string; description?: string | null }): Promise<Role | null> {
  const sets: string[] = [];
  const params: unknown[] = [];
  if (payload.roleName !== undefined) { sets.push('name = ?'); params.push(payload.roleName); }
  if (payload.description !== undefined) { sets.push('description = ?'); params.push(payload.description); }
  if (sets.length) {
    await query(`UPDATE roles SET ${sets.join(', ')} WHERE id = ?`, [...params, id]);
  }
  const rows = await query<Role>('SELECT id, name, description, is_system AS isSystem FROM roles WHERE id = ?', [id]);
  return rows[0] || null;
}

export async function deleteRole(id: number): Promise<void> {
  await query('DELETE FROM user_roles WHERE role_id = ?', [id]);
  await query('DELETE FROM role_permissions WHERE role_id = ?', [id]);
  await query('DELETE FROM roles WHERE id = ?', [id]);
}

export async function getRolePermissions(roleId: number): Promise<Permission[]> {
  return await query<Permission>(
    `SELECT
      rp.id,
      rp.permission_key AS permissionKey,
      rp.permission_type AS permissionType
    FROM role_permissions rp
    WHERE rp.role_id = ?`,
    [roleId],
  );
}

export async function setRolePermissions(roleId: number, permissionKeys: string[]): Promise<void> {
  await query('DELETE FROM role_permissions WHERE role_id = ?', [roleId]);
  for (const key of permissionKeys) {
    await query(
      'INSERT INTO role_permissions (role_id, permission_key, permission_type) VALUES (?, ?, ?)',
      [roleId, key, 'operation'],
    );
  }
}

export async function listPermissions(): Promise<Permission[]> {
  return await query<Permission>(
    `SELECT
      id,
      permission_key AS permissionKey,
      permission_name AS permissionName,
      permission_type AS permissionType,
      module_key AS moduleKey
    FROM permissions
    ORDER BY id ASC`,
  );
}
