import { readJsonBody } from '../../common/http.js';
import { sendJson } from '../../common/send.js';
import type { RouteHandler } from '../../common/types.js';
import { query } from '../../database/index.js';
import { AppError } from '../../common/errors.js';
import { ErrorCodes } from '../../common/error-codes.js';

interface SettingRow {
  id: number;
  settingKey: string;
  settingValue: string;
  description: string | null;
  isSecret: number;
}

function maskSecretValue(value: string): string {
  try {
    const parsed = JSON.parse(value);
    if (typeof parsed === 'object' && parsed !== null) {
      const masked: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(parsed)) {
        masked[k] = typeof v === 'string' && v.length > 4
          ? v.slice(0, 2) + '***' + v.slice(-2)
          : '***';
      }
      return JSON.stringify(masked);
    }
  } catch { /* fallback */ }
  return '***';
}

export const settingsModule = {
  name: 'settings',
  description: 'System settings key-value store',
  routes: ['/settings', '/settings/:key'],
};

export const handleSettingsRoutes: RouteHandler = async (req, res, url, ctx) => {
  const responseOptions = { requestId: ctx.requestId };

  // GET /settings - list all settings
  if (req.method === 'GET' && url.pathname === '/settings') {
    const rows = await query<SettingRow>(
      `SELECT id, setting_key AS settingKey, setting_value AS settingValue, description, is_secret AS isSecret FROM settings ORDER BY id`,
    );
    const data = rows.map((r) => ({
      id: r.id,
      key: r.settingKey,
      value: r.isSecret ? maskSecretValue(r.settingValue) : r.settingValue,
      description: r.description,
      isSecret: Boolean(r.isSecret),
    }));
    sendJson(res, data, responseOptions);
    return true;
  }

  // GET /settings/:key
  const getMatch = url.pathname.match(/^\/settings\/([a-zA-Z0-9_-]+)$/);
  if (req.method === 'GET' && getMatch) {
    const key = getMatch[1];
    const rows = await query<SettingRow>(
      `SELECT id, setting_key AS settingKey, setting_value AS settingValue, description, is_secret AS isSecret FROM settings WHERE setting_key = ?`,
      [key],
    );
    if (!rows[0]) {
      throw new AppError(404, 'resource_not_found', { field: 'settingKey', key }, ErrorCodes.RESOURCE_NOT_FOUND);
    }
    const r = rows[0];
    sendJson(res, {
      id: r.id,
      key: r.settingKey,
      value: r.isSecret ? maskSecretValue(r.settingValue) : r.settingValue,
      description: r.description,
      isSecret: Boolean(r.isSecret),
    }, responseOptions);
    return true;
  }

  // PUT /settings/:key
  if (req.method === 'PUT' && getMatch) {
    const key = getMatch[1];
    const body = await readJsonBody(req);
    const value = body.value !== undefined ? JSON.stringify(body.value) : undefined;
    const description = body.description as string | undefined;
    const isSecret = body.isSecret !== undefined ? (body.isSecret ? 1 : 0) : undefined;

    if (value === undefined) {
      throw new AppError(400, 'missing_required_field', { field: 'value' }, ErrorCodes.MISSING_REQUIRED_FIELD);
    }

    const existing = await query<{ id: number }>('SELECT id FROM settings WHERE setting_key = ?', [key]);

    if (existing[0]) {
      const sets = ['setting_value = ?'];
      const params: unknown[] = [value];
      if (description !== undefined) { sets.push('description = ?'); params.push(description); }
      if (isSecret !== undefined) { sets.push('is_secret = ?'); params.push(isSecret); }
      if (ctx.operator) { sets.push('updated_by = ?'); params.push(ctx.operator.id); }
      await query(`UPDATE settings SET ${sets.join(', ')} WHERE setting_key = ?`, [...params, key]);
    } else {
      await query(
        'INSERT INTO settings (setting_key, setting_value, description, is_secret, updated_by) VALUES (?, ?, ?, ?, ?)',
        [key, value, description || null, isSecret ?? 0, ctx.operator?.id || null],
      );
    }

    sendJson(res, { success: true, key }, responseOptions);
    return true;
  }

  return false;
};
