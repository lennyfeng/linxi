import type { IncomingMessage } from 'node:http';
import { ErrorCodes } from './error-codes.js';
import { AppError } from './errors.js';
import type { RequestContext } from './context.js';
import { parseBearerToken, resolveTokenUserId } from '../modules/auth/service/auth.service.js';
import { query } from '../database/index.js';

async function loadUserPermissions(userId: number): Promise<string[]> {
  const rows = await query<{ permissionKey: string }>(
    `SELECT DISTINCT rp.permission_key AS permissionKey
     FROM user_roles ur
     JOIN role_permissions rp ON rp.role_id = ur.role_id
     WHERE ur.user_id = ?`,
    [userId],
  );
  return rows.map((r) => r.permissionKey);
}

const AUTH_WHITELIST = new Set(['/health', '/modules', '/', '/auth/login', '/auth/logout', '/auth/refresh', '/auth/feishu/callback']);

export async function applyAuthContext(req: IncomingMessage, url: URL, ctx: RequestContext) {
  ctx.token = parseBearerToken(String(req.headers.authorization || ''));

  if (AUTH_WHITELIST.has(url.pathname)) {
    return;
  }

  if (!ctx.token) {
    throw new AppError(401, 'unauthorized', { details: null }, ErrorCodes.UNAUTHORIZED);
  }

  const userId = resolveTokenUserId(ctx.token);
  if (userId === null) {
    throw new AppError(401, 'invalid_token', { details: null }, ErrorCodes.INVALID_TOKEN);
  }

  const rows = await query<{ id: number; displayName: string; username: string }>(
    'SELECT id, display_name AS displayName, username FROM users WHERE id = ? AND status = ? LIMIT 1',
    [userId, 'active'],
  );

  if (!rows[0]) {
    throw new AppError(401, 'invalid_token', { details: null }, ErrorCodes.INVALID_TOKEN);
  }

  const permissions = await loadUserPermissions(userId);

  // Check if user has admin role
  const roleRows = await query<{ roleName: string }>(
    'SELECT r.name AS roleName FROM user_roles ur JOIN roles r ON r.id = ur.role_id WHERE ur.user_id = ?',
    [userId],
  );
  const isAdmin = roleRows.some((r) => r.roleName === 'Super Admin' || r.roleName === 'platform-admin');

  ctx.operator = {
    id: userId,
    name: rows[0].displayName,
    username: rows[0].username,
  };
  ctx.permissions = isAdmin ? ['*'] : permissions;
}

export function requirePermission(permission: string) {
  return (ctx: RequestContext) => {
    if (!ctx.operator) {
      throw new AppError(401, 'unauthorized', { details: null }, ErrorCodes.UNAUTHORIZED);
    }
    if (ctx.permissions.includes('*')) return;
    if (!ctx.permissions.includes(permission)) {
      throw new AppError(403, 'forbidden', { required: permission }, ErrorCodes.FORBIDDEN);
    }
  };
}
