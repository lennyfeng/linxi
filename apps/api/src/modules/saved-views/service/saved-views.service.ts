import { ErrorCodes } from '../../../common/error-codes.js';
import { AppError } from '../../../common/errors.js';
import { appendAuditLog } from '../../../common/audit.js';
import { normalizePagination } from '../../../common/pagination.js';
import type { RequestContext } from '../../../common/context.js';
import type { JsonBody } from '../../../common/types.js';
import {
  createSavedViewRecord,
  deleteSavedViewRecord,
  listSavedViewsByUser,
  updateSavedViewRecord,
} from '../repository/saved-views.repository.js';

export async function getSavedViews(ctx: RequestContext, query: JsonBody) {
  if (!ctx.operator?.id) {
    throw new AppError(401, 'unauthorized', { details: null }, ErrorCodes.UNAUTHORIZED);
  }

  const pageResult = normalizePagination({ page: query.page as string | number | undefined, pageSize: (query.page_size || query.pageSize) as string | number | undefined });
  if (!pageResult.ok) {
    throw new AppError(pageResult.error.statusCode, pageResult.error.message, { details: null }, pageResult.error.code);
  }

  return await listSavedViewsByUser(ctx.operator.id, String(query.module_key || ''), pageResult.value.page, pageResult.value.pageSize);
}

export async function createSavedView(ctx: RequestContext, body: JsonBody) {
  if (!ctx.operator?.id) {
    throw new AppError(401, 'unauthorized', { details: null }, ErrorCodes.UNAUTHORIZED);
  }
  if (!body.module_key) {
    throw new AppError(400, 'missing_required_field', { field: 'module_key' }, ErrorCodes.MISSING_REQUIRED_FIELD);
  }
  if (!body.view_name) {
    throw new AppError(400, 'missing_required_field', { field: 'view_name' }, ErrorCodes.MISSING_REQUIRED_FIELD);
  }

  const created = await createSavedViewRecord({
    userId: ctx.operator.id,
    moduleKey: body.module_key as string,
    viewName: body.view_name as string,
    viewConfig: body.view_config || {},
    isDefault: Boolean(body.is_default),
  });

  appendAuditLog(ctx, {
    logType: 'write',
    moduleKey: body.module_key as string,
    objectType: 'saved_view',
    objectId: created.id,
    action: 'create',
    afterSnapshot: created,
  });

  return created;
}

export async function updateSavedView(ctx: RequestContext, id: number, body: JsonBody) {
  if (!ctx.operator?.id) {
    throw new AppError(401, 'unauthorized', { details: null }, ErrorCodes.UNAUTHORIZED);
  }
  if (!body.view_name) {
    throw new AppError(400, 'missing_required_field', { field: 'view_name' }, ErrorCodes.MISSING_REQUIRED_FIELD);
  }

  const updated = await updateSavedViewRecord(Number(id), ctx.operator.id, {
    viewName: body.view_name as string,
    viewConfig: body.view_config || {},
    isDefault: Boolean(body.is_default),
  });

  if (!updated) {
    throw new AppError(404, 'resource_not_found', { details: { id } }, ErrorCodes.RESOURCE_NOT_FOUND);
  }

  appendAuditLog(ctx, {
    logType: 'write',
    moduleKey: updated.module_key,
    objectType: 'saved_view',
    objectId: updated.id,
    action: 'update',
    afterSnapshot: updated,
  });

  return updated;
}

export async function deleteSavedView(ctx: RequestContext, id: number) {
  if (!ctx.operator?.id) {
    throw new AppError(401, 'unauthorized', { details: null }, ErrorCodes.UNAUTHORIZED);
  }

  const ok = await deleteSavedViewRecord(Number(id), ctx.operator.id);
  if (!ok) {
    throw new AppError(404, 'resource_not_found', { details: { id } }, ErrorCodes.RESOURCE_NOT_FOUND);
  }

  appendAuditLog(ctx, {
    logType: 'write',
    moduleKey: 'saved_views',
    objectType: 'saved_view',
    objectId: Number(id),
    action: 'delete',
    afterSnapshot: { success: true },
  });

  return { success: true };
}
