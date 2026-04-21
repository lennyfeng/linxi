import { readJsonBody } from '../../common/http.js';
import { getIdFromPath } from '../../common/route.js';
import { sendJson } from '../../common/send.js';
import type { RouteHandler } from '../../common/types.js';
import {
  addDepartment,
  addRole,
  createUser,
  disableUserById,
  editDepartment,
  editRole,
  enableUserById,
  getDepartments,
  getPermissions,
  getRolePerms,
  getRoles,
  getUserDetail,
  getUsers,
  removeDepartment,
  removeRole,
  resetPassword,
  updateRolePerms,
  updateUser,
  updateUserRoles,
} from './service/users.service.js';

export const usersModule = {
  name: 'users',
  description: 'Users, departments, roles and permissions',
  routes: ['/users', '/users/:id', '/users/:id/enable', '/users/:id/disable', '/users/:id/reset-password', '/users/:id/roles', '/departments', '/departments/:id', '/roles', '/roles/:id', '/roles/:id/permissions', '/permissions'],
};

export const handleUsersRoutes: RouteHandler = async (req, res, url, ctx) => {
  const responseOptions = { requestId: ctx.requestId };

  if (req.method === 'GET' && url.pathname === '/users') {
    sendJson(res, await getUsers(Object.fromEntries(url.searchParams.entries())), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/users') {
    const body = await readJsonBody(req);
    sendJson(res, await createUser(body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  // User action endpoints (must be before generic /users/:id)
  const enableMatch = url.pathname.match(/^\/users\/(\d+)\/enable$/);
  if (req.method === 'POST' && enableMatch) {
    sendJson(res, await enableUserById(Number(enableMatch[1])), responseOptions);
    return true;
  }

  const disableMatch = url.pathname.match(/^\/users\/(\d+)\/disable$/);
  if (req.method === 'POST' && disableMatch) {
    sendJson(res, await disableUserById(Number(disableMatch[1])), responseOptions);
    return true;
  }

  const resetPwdMatch = url.pathname.match(/^\/users\/(\d+)\/reset-password$/);
  if (req.method === 'POST' && resetPwdMatch) {
    const body = await readJsonBody(req);
    sendJson(res, await resetPassword(Number(resetPwdMatch[1]), body), responseOptions);
    return true;
  }

  const userRolesMatch = url.pathname.match(/^\/users\/(\d+)\/roles$/);
  if (req.method === 'PUT' && userRolesMatch) {
    const body = await readJsonBody(req);
    sendJson(res, await updateUserRoles(Number(userRolesMatch[1]), body), responseOptions);
    return true;
  }

  if (req.method === 'GET' && url.pathname.startsWith('/users/')) {
    const id = getIdFromPath(url.pathname, '/users/');
    sendJson(res, await getUserDetail(id), responseOptions);
    return true;
  }

  if (req.method === 'PUT' && url.pathname.startsWith('/users/')) {
    const id = getIdFromPath(url.pathname, '/users/');
    const body = await readJsonBody(req);
    sendJson(res, await updateUser(id, body), responseOptions);
    return true;
  }

  // Departments
  if (req.method === 'GET' && url.pathname === '/departments') {
    sendJson(res, await getDepartments(), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/departments') {
    const body = await readJsonBody(req);
    sendJson(res, await addDepartment(body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  if (req.method === 'PUT' && url.pathname.startsWith('/departments/')) {
    const id = getIdFromPath(url.pathname, '/departments/');
    const body = await readJsonBody(req);
    sendJson(res, await editDepartment(id, body), responseOptions);
    return true;
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/departments/')) {
    const id = getIdFromPath(url.pathname, '/departments/');
    sendJson(res, await removeDepartment(id), responseOptions);
    return true;
  }

  // Roles
  if (req.method === 'GET' && url.pathname === '/roles') {
    sendJson(res, await getRoles(), responseOptions);
    return true;
  }

  if (req.method === 'POST' && url.pathname === '/roles') {
    const body = await readJsonBody(req);
    sendJson(res, await addRole(body), { ...responseOptions, statusCode: 201 });
    return true;
  }

  const rolePermsMatch = url.pathname.match(/^\/roles\/(\d+)\/permissions$/);
  if (req.method === 'GET' && rolePermsMatch) {
    sendJson(res, await getRolePerms(Number(rolePermsMatch[1])), responseOptions);
    return true;
  }

  if (req.method === 'PUT' && rolePermsMatch) {
    const body = await readJsonBody(req);
    sendJson(res, await updateRolePerms(Number(rolePermsMatch[1]), body), responseOptions);
    return true;
  }

  if (req.method === 'PUT' && url.pathname.startsWith('/roles/')) {
    const id = getIdFromPath(url.pathname, '/roles/');
    const body = await readJsonBody(req);
    sendJson(res, await editRole(id, body), responseOptions);
    return true;
  }

  if (req.method === 'DELETE' && url.pathname.startsWith('/roles/')) {
    const id = getIdFromPath(url.pathname, '/roles/');
    sendJson(res, await removeRole(id), responseOptions);
    return true;
  }

  // Permissions
  if (req.method === 'GET' && url.pathname === '/permissions') {
    sendJson(res, await getPermissions(), responseOptions);
    return true;
  }

  return false;
};
