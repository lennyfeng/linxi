import { randomUUID } from 'node:crypto';
import bcrypt from 'bcryptjs';
import { ErrorCodes } from '../../../common/error-codes.js';
import { AppError } from '../../../common/errors.js';
import { query } from '../../../database/index.js';
import type { User } from '../../../common/entity-types.js';
import type { JsonBody } from '../../../common/types.js';

// ---------------------------------------------------------------------------
// In-memory token store (cleared on server restart; users simply re-login)
// ---------------------------------------------------------------------------
interface TokenEntry {
  userId: number;
  createdAt: number;
}

const ACCESS_TOKEN_TTL_MS = 7200 * 1000; // 2 hours
const REFRESH_TOKEN_TTL_MS = 7 * 24 * 3600 * 1000; // 7 days

const tokenStore = new Map<string, TokenEntry>();
const refreshTokenStore = new Map<string, TokenEntry>();

function issueToken(userId: number): string {
  const token = randomUUID();
  tokenStore.set(token, { userId, createdAt: Date.now() });
  return token;
}

function issueRefreshToken(userId: number): string {
  const token = randomUUID();
  refreshTokenStore.set(token, { userId, createdAt: Date.now() });
  return token;
}

function revokeToken(token: string): void {
  tokenStore.delete(token);
}

function revokeRefreshToken(token: string): void {
  refreshTokenStore.delete(token);
}

export function resolveTokenUserId(token: string): number | null {
  const entry = tokenStore.get(token);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > ACCESS_TOKEN_TTL_MS) {
    tokenStore.delete(token);
    return null;
  }
  return entry.userId;
}

function resolveRefreshTokenUserId(token: string): number | null {
  const entry = refreshTokenStore.get(token);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > REFRESH_TOKEN_TTL_MS) {
    refreshTokenStore.delete(token);
    return null;
  }
  return entry.userId;
}

// ---------------------------------------------------------------------------
// User helpers (DB queries used by auth only)
// ---------------------------------------------------------------------------
interface UserWithPassword extends User {
  passwordHash: string | null;
  mustChangePassword: number;
}

async function findUserByUsername(username: string): Promise<UserWithPassword | null> {
  const rows = await query<UserWithPassword>(
    `SELECT
      u.id,
      u.display_name   AS name,
      u.username,
      u.password_hash  AS passwordHash,
      u.email,
      u.phone          AS mobile,
      u.avatar,
      u.department_id  AS departmentId,
      d.name           AS departmentName,
      u.status,
      u.must_change_password AS mustChangePassword
    FROM users u
    LEFT JOIN departments d ON d.id = u.department_id
    WHERE u.username = ? OR u.display_name = ?
    LIMIT 1`,
    [username, username],
  );
  return rows[0] || null;
}

async function findUserById(id: number): Promise<User | null> {
  const rows = await query<User>(
    `SELECT
      u.id,
      u.display_name   AS name,
      u.username,
      u.email,
      u.phone          AS mobile,
      u.department_id  AS departmentId,
      d.name           AS departmentName,
      u.status
    FROM users u
    LEFT JOIN departments d ON d.id = u.department_id
    WHERE u.id = ?
    LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

async function findUserRoleKeys(userId: number): Promise<string[]> {
  const rows = await query<{ roleKey: string }>(
    `SELECT r.name AS roleKey
     FROM user_roles ur
     JOIN roles r ON r.id = ur.role_id
     WHERE ur.user_id = ?`,
    [userId],
  );
  return rows.map((r) => r.roleKey);
}

function buildPermissions(roleKeys: string[]) {
  const isSuperAdmin = roleKeys.includes('Super Admin');
  if (isSuperAdmin) {
    return {
      menus: ['*'],
      actions: ['*'],
      data_scopes: { platform: 'all' },
    };
  }
  return {
    menus: ['platform.dashboard', 'platform.saved-views'],
    actions: ['platform.auth.view', 'platform.auth.manage', 'platform.saved-views.manage'],
    data_scopes: {
      platform: 'self',
    },
  };
}

function normalizeUser(row: User | null) {
  if (!row) return null;
  return {
    id: Number(row.id),
    name: row.name || row.username || 'unknown',
    username: row.username || `user_${row.id}`,
    department_id: row.departmentId || null,
    department_name: row.departmentName || '',
    account_status: row.status || 'active',
    mobile: row.mobile || '',
    email: row.email || '',
    avatar_url: '',
  };
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------
export async function loginWithLocal(body: JsonBody) {
  const username: string = (body.username as string) || '';
  const password: string = (body.password as string) || '';
  if (!username) {
    throw new AppError(400, 'missing_required_field', { field: 'username' }, ErrorCodes.MISSING_REQUIRED_FIELD);
  }

  const matched = await findUserByUsername(username);
  if (!matched) {
    throw new AppError(401, 'login_failed', { details: { username } }, ErrorCodes.LOGIN_FAILED);
  }

  if (matched.status !== 'active') {
    throw new AppError(403, 'account_disabled', { details: { username } }, ErrorCodes.ACCOUNT_DISABLED);
  }

  // Validate password if password_hash exists
  if (matched.passwordHash) {
    if (!password) {
      throw new AppError(400, 'missing_required_field', { field: 'password' }, ErrorCodes.MISSING_REQUIRED_FIELD);
    }
    const valid = await bcrypt.compare(password, matched.passwordHash);
    if (!valid) {
      throw new AppError(401, 'login_failed', { details: { username } }, ErrorCodes.LOGIN_FAILED);
    }
  }
  // If no password_hash set, allow login without password (legacy/initial setup)

  const userId = Number(matched.id);
  const accessToken = issueToken(userId);
  const refreshToken = issueRefreshToken(userId);
  const user = normalizeUser(matched);
  const roleKeys = await findUserRoleKeys(userId);

  await query('UPDATE users SET updated_at = NOW() WHERE id = ?', [matched.id]);

  return {
    access_token: accessToken,
    refresh_token: refreshToken,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_TTL_MS / 1000,
    must_change_password: Boolean(matched.mustChangePassword),
    user: {
      ...user,
      role_keys: roleKeys,
      permissions: buildPermissions(roleKeys),
    },
  };
}

export function logout(token: string) {
  revokeToken(token);
  return { success: true };
}

export async function refreshAccessToken(body: JsonBody) {
  const refreshToken = (body.refreshToken as string) || (body.refresh_token as string) || '';
  if (!refreshToken) {
    throw new AppError(400, 'missing_required_field', { field: 'refreshToken' }, ErrorCodes.MISSING_REQUIRED_FIELD);
  }

  const userId = resolveRefreshTokenUserId(refreshToken);
  if (userId === null) {
    throw new AppError(401, 'invalid_token', { details: 'refresh_token_expired_or_invalid' }, ErrorCodes.INVALID_TOKEN);
  }

  const newAccessToken = issueToken(userId);
  return {
    access_token: newAccessToken,
    token_type: 'Bearer',
    expires_in: ACCESS_TOKEN_TTL_MS / 1000,
  };
}

export async function changePassword(token: string, body: JsonBody) {
  if (!token) {
    throw new AppError(401, 'unauthorized', { details: null }, ErrorCodes.UNAUTHORIZED);
  }

  const userId = resolveTokenUserId(token);
  if (userId === null) {
    throw new AppError(401, 'invalid_token', { details: null }, ErrorCodes.INVALID_TOKEN);
  }

  const oldPassword = (body.oldPassword as string) || (body.old_password as string) || '';
  const newPassword = (body.newPassword as string) || (body.new_password as string) || '';

  if (!newPassword || newPassword.length < 6) {
    throw new AppError(400, 'invalid_request', { field: 'newPassword', reason: 'min_length_6' }, ErrorCodes.INVALID_REQUEST);
  }

  // Check old password if user has one set
  const rows = await query<{ passwordHash: string | null }>(
    'SELECT password_hash AS passwordHash FROM users WHERE id = ?',
    [userId],
  );
  const current = rows[0];
  if (!current) {
    throw new AppError(404, 'resource_not_found', { field: 'userId' }, ErrorCodes.RESOURCE_NOT_FOUND);
  }

  if (current.passwordHash && oldPassword) {
    const valid = await bcrypt.compare(oldPassword, current.passwordHash);
    if (!valid) {
      throw new AppError(400, 'invalid_request', { field: 'oldPassword', reason: 'incorrect' }, ErrorCodes.INVALID_REQUEST);
    }
  }

  const hashed = await bcrypt.hash(newPassword, 10);
  await query('UPDATE users SET password_hash = ?, must_change_password = 0 WHERE id = ?', [hashed, userId]);

  return { success: true };
}

export async function getCurrentUserContext(token: string) {
  if (!token) {
    throw new AppError(401, 'unauthorized', { details: null }, ErrorCodes.UNAUTHORIZED);
  }

  const userId = resolveTokenUserId(token);
  if (userId === null) {
    throw new AppError(401, 'invalid_token', { details: null }, ErrorCodes.INVALID_TOKEN);
  }

  const row = await findUserById(userId);
  if (!row) {
    throw new AppError(401, 'invalid_token', { details: null }, ErrorCodes.INVALID_TOKEN);
  }

  const user = normalizeUser(row)!;
  const roleKeys = await findUserRoleKeys(userId);
  const permissions = buildPermissions(roleKeys);

  return {
    user: {
      id: user.id,
      name: user.name,
      username: user.username,
      department_id: user.department_id,
      department_name: user.department_name,
      role_keys: roleKeys,
      account_status: user.account_status,
    },
    permissions,
    profile: {
      mobile: user.mobile,
      email: user.email,
      avatar_url: user.avatar_url,
    },
  };
}

export function getFeishuCallbackPlaceholder() {
  return {
    loginType: 'feishu',
    mode: 'callback-placeholder',
    message: 'waiting_for_real_feishu_app_credentials',
  };
}

export function parseBearerToken(authorization = '') {
  if (!authorization.startsWith('Bearer ')) return '';
  return authorization.slice(7).trim();
}
