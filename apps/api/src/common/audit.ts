import { query } from '../database/index.js';
import type { AuditDraft, RequestContext } from './context.js';

function getOperator(ctx: RequestContext) {
  return {
    id: ctx.operator?.id || null,
    name: ctx.operator?.name || '',
  };
}

export function appendAuditLog(ctx: RequestContext, draft: AuditDraft) {
  ctx.auditDrafts.push(draft);
}

export async function flushAuditLogs(ctx: RequestContext) {
  if (!ctx.auditDrafts.length) return;

  for (const draft of ctx.auditDrafts) {
    const operator = getOperator(ctx);
    await query(
      `INSERT INTO audit_logs (
        log_type,
        module_key,
        object_type,
        object_id,
        action,
        operator_id,
        operator_name,
        before_snapshot,
        after_snapshot,
        result_status,
        error_message,
        request_id
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        draft.logType,
        draft.moduleKey,
        draft.objectType || null,
        draft.objectId || null,
        draft.action,
        operator.id,
        operator.name,
        draft.beforeSnapshot == null ? null : JSON.stringify(draft.beforeSnapshot),
        draft.afterSnapshot == null ? null : JSON.stringify(draft.afterSnapshot),
        draft.resultStatus || 'success',
        draft.errorMessage || null,
        ctx.requestId,
      ],
    );
  }

  ctx.auditDrafts.length = 0;
}
