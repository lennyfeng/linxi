import { AppError } from '../../../common/errors.js';
import { ErrorCodes } from '../../../common/error-codes.js';
import { getListPagination } from '../../../common/pagination.js';
import type { JsonBody } from '../../../common/types.js';
import {
  createDepartment,
  createRole,
  createUserRecord,
  deleteRole,
  disableUser,
  enableUser,
  getRolePermissions,
  getUserById,
  listDepartments,
  listPermissions,
  listRoles,
  listUsers,
  resetUserPassword,
  setRolePermissions,
  setUserRoles,
  softDeleteDepartment,
  updateDepartment,
  updateRole,
  updateUserRecord,
} from '../repository/users.repository.js';

function getUserFilters(query: Record<string, unknown>) {
  return {
    status: query.status ? String(query.status) : '',
    departmentId: query.departmentId || query.department_id ? String(query.departmentId || query.department_id) : '',
    keyword: query.keyword ? String(query.keyword).trim() : '',
  };
}

export async function getUsers(query: Record<string, unknown> = {}) {
  const { page, pageSize } = getListPagination(query);
  return await listUsers(getUserFilters(query), page, pageSize);
}

export async function getUserDetail(id: number) {
  const user = await getUserById(id);
  if (!user) {
    throw new AppError(404, 'resource_not_found', { field: 'userId', id }, ErrorCodes.RESOURCE_NOT_FOUND);
  }
  return user;
}

export async function createUser(body: JsonBody) {
  if (!body.username) {
    throw new AppError(400, 'missing_required_field', { field: 'username' }, ErrorCodes.MISSING_REQUIRED_FIELD);
  }
  if (!body.name) {
    throw new AppError(400, 'missing_required_field', { field: 'name' }, ErrorCodes.MISSING_REQUIRED_FIELD);
  }

  return await createUserRecord({
    username: body.username as string,
    name: body.name as string,
    email: (body.email as string) || null,
    mobile: (body.mobile as string) || null,
    sourceType: (body.sourceType as string) || (body.source_type as string) || 'local',
    departmentId: (body.departmentId as number) || (body.department_id as number) || null,
    status: (body.status as string) || 'active',
    password: (body.password as string) || undefined,
    roleIds: (body.roleIds as number[]) || (body.role_ids as number[]) || undefined,
  });
}

export async function enableUserById(id: number) {
  const user = await getUserById(id);
  if (!user) throw new AppError(404, 'resource_not_found', { field: 'userId', id }, ErrorCodes.RESOURCE_NOT_FOUND);
  return await enableUser(id);
}

export async function disableUserById(id: number) {
  const user = await getUserById(id);
  if (!user) throw new AppError(404, 'resource_not_found', { field: 'userId', id }, ErrorCodes.RESOURCE_NOT_FOUND);
  return await disableUser(id);
}

export async function resetPassword(id: number, body: JsonBody) {
  const user = await getUserById(id);
  if (!user) throw new AppError(404, 'resource_not_found', { field: 'userId', id }, ErrorCodes.RESOURCE_NOT_FOUND);
  const newPassword = (body.password as string) || (body.newPassword as string) || 'linxi123';
  await resetUserPassword(id, newPassword);
  return { success: true };
}

export async function updateUserRoles(id: number, body: JsonBody) {
  const user = await getUserById(id);
  if (!user) throw new AppError(404, 'resource_not_found', { field: 'userId', id }, ErrorCodes.RESOURCE_NOT_FOUND);
  const roleIds = (body.roleIds as number[]) || (body.role_ids as number[]) || [];
  await setUserRoles(id, roleIds);
  return { success: true };
}

export async function updateUser(id: number, body: JsonBody) {
  const existing = await getUserById(id);
  if (!existing) {
    throw new AppError(404, 'resource_not_found', { field: 'userId', id }, ErrorCodes.RESOURCE_NOT_FOUND);
  }

  return await updateUserRecord(id, {
    name: body.name as string | undefined,
    email: body.email as string | null | undefined,
    mobile: body.mobile as string | null | undefined,
    departmentId: (body.departmentId ?? body.department_id) as number | null | undefined,
    status: body.status as string | undefined,
  });
}

// ── Departments ──
export async function getDepartments() {
  return await listDepartments();
}

export async function addDepartment(body: JsonBody) {
  if (!body.name) throw new AppError(400, 'missing_required_field', { field: 'name' }, ErrorCodes.MISSING_REQUIRED_FIELD);
  return await createDepartment({
    name: body.name as string,
    parentId: (body.parentId ?? body.parent_id) as number | null | undefined,
    code: (body.code as string) || undefined,
  });
}

export async function editDepartment(id: number, body: JsonBody) {
  return await updateDepartment(id, {
    name: body.name as string | undefined,
    parentId: (body.parentId ?? body.parent_id) as number | null | undefined,
  });
}

export async function removeDepartment(id: number) {
  await softDeleteDepartment(id);
  return { success: true };
}

// ── Roles ──
export async function getRoles() {
  return await listRoles();
}

export async function addRole(body: JsonBody) {
  if (!body.roleKey && !body.role_key) throw new AppError(400, 'missing_required_field', { field: 'roleKey' }, ErrorCodes.MISSING_REQUIRED_FIELD);
  if (!body.roleName && !body.role_name) throw new AppError(400, 'missing_required_field', { field: 'roleName' }, ErrorCodes.MISSING_REQUIRED_FIELD);
  return await createRole({
    roleKey: (body.roleKey as string) || (body.role_key as string),
    roleName: (body.roleName as string) || (body.role_name as string),
    description: (body.description as string) || null,
  });
}

export async function editRole(id: number, body: JsonBody) {
  return await updateRole(id, {
    roleName: (body.roleName as string) || (body.role_name as string) || undefined,
    description: body.description as string | null | undefined,
  });
}

export async function removeRole(id: number) {
  await deleteRole(id);
  return { success: true };
}

export async function getRolePerms(id: number) {
  return await getRolePermissions(id);
}

export async function updateRolePerms(id: number, body: JsonBody) {
  const permissions = (body.permissions as string[]) || (body.permission_keys as string[]) || [];
  await setRolePermissions(id, permissions);
  return { success: true };
}

export async function getPermissions() {
  return await listPermissions();
}
