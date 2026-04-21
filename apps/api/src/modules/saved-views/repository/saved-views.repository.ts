import { query } from '../../../database/index.js';
import { buildPagination } from '../../../common/pagination.js';
import type { SavedView } from '../../../common/entity-types.js';

interface SavedViewRow {
  id: number;
  module_key: string;
  view_name: string;
  view_config_json: string;
  is_default: number;
  created_at: string | null;
  updated_at: string | null;
}

function toSavedView(row: SavedViewRow): SavedView {
  return {
    id: Number(row.id),
    module_key: row.module_key,
    view_name: row.view_name,
    view_config: typeof row.view_config_json === 'string' ? JSON.parse(row.view_config_json) : row.view_config_json,
    is_default: Boolean(row.is_default),
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export async function listSavedViewsByUser(userId: number, moduleKey: string, page: number, pageSize: number) {
  const rows = await query<SavedViewRow>(
    `SELECT
      id,
      module_key AS module_key,
      view_name AS view_name,
      view_config_json AS view_config_json,
      is_default AS is_default,
      created_at AS created_at,
      updated_at AS updated_at
    FROM saved_views
    WHERE user_id = ? AND (? = '' OR module_key = ?)
    ORDER BY is_default DESC, updated_at DESC
    LIMIT ? OFFSET ?`,
    [userId, moduleKey, moduleKey, pageSize, (page - 1) * pageSize],
  );

  const totalRows = await query<{ total: number }>(
    `SELECT COUNT(*) AS total
    FROM saved_views
    WHERE user_id = ? AND (? = '' OR module_key = ?)`,
    [userId, moduleKey, moduleKey],
  );

  return {
    list: rows.map(toSavedView),
    pagination: buildPagination(page, pageSize, Number(totalRows[0]?.total || 0)),
  };
}

export async function createSavedViewRecord(input: { userId: number; moduleKey: string; viewName: string; viewConfig: unknown; isDefault: boolean }): Promise<SavedView> {
  if (input.isDefault) {
    await query(`UPDATE saved_views SET is_default = 0 WHERE user_id = ? AND module_key = ?`, [input.userId, input.moduleKey]);
  }

  const result = await query(
    `INSERT INTO saved_views (module_key, user_id, view_name, view_config_json, is_default)
    VALUES (?, ?, ?, ?, ?)`,
    [input.moduleKey, input.userId, input.viewName, JSON.stringify(input.viewConfig || {}), input.isDefault ? 1 : 0],
  );

  const rows = await query<SavedViewRow>(
    `SELECT
      id,
      module_key AS module_key,
      view_name AS view_name,
      view_config_json AS view_config_json,
      is_default AS is_default,
      created_at AS created_at,
      updated_at AS updated_at
    FROM saved_views
    WHERE id = ?`,
    [(result as any).insertId],
  );

  return toSavedView(rows[0]);
}

export async function updateSavedViewRecord(id: number, userId: number, input: { viewName: string; viewConfig: unknown; isDefault: boolean }): Promise<SavedView | null> {
  const rows = await query<{ id: number; module_key: string }>(`SELECT id, module_key AS module_key FROM saved_views WHERE id = ? AND user_id = ?`, [id, userId]);
  const current = rows[0];
  if (!current) return null;

  if (input.isDefault) {
    await query(`UPDATE saved_views SET is_default = 0 WHERE user_id = ? AND module_key = ?`, [userId, current.module_key]);
  }

  await query(
    `UPDATE saved_views
    SET view_name = ?, view_config_json = ?, is_default = ?
    WHERE id = ? AND user_id = ?`,
    [input.viewName, JSON.stringify(input.viewConfig || {}), input.isDefault ? 1 : 0, id, userId],
  );

  const updatedRows = await query<SavedViewRow>(
    `SELECT
      id,
      module_key AS module_key,
      view_name AS view_name,
      view_config_json AS view_config_json,
      is_default AS is_default,
      created_at AS created_at,
      updated_at AS updated_at
    FROM saved_views
    WHERE id = ?`,
    [id],
  );

  return toSavedView(updatedRows[0]);
}

export async function deleteSavedViewRecord(id: number, userId: number): Promise<boolean> {
  const result = await query(`DELETE FROM saved_views WHERE id = ? AND user_id = ?`, [id, userId]);
  return Number((result as any).affectedRows || 0) > 0;
}
