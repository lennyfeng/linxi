import { randomUUID } from 'node:crypto';

export interface RequestContextOperator {
  id: number | null;
  name: string;
  username: string;
}

export interface AuditDraft {
  logType: string;
  moduleKey: string;
  objectType?: string | null;
  objectId?: number | null;
  action: string;
  beforeSnapshot?: unknown;
  afterSnapshot?: unknown;
  resultStatus?: string;
  errorMessage?: string | null;
}

export interface RequestContext {
  requestId: string;
  startTime: number;
  token: string;
  operator: RequestContextOperator | null;
  permissions: string[];
  auditDrafts: AuditDraft[];
}

export function createRequestContext(req: { headers: Record<string, string | string[] | undefined> }) {
  const requestIdHeader = req.headers['x-request-id'];
  const requestId = typeof requestIdHeader === 'string' && requestIdHeader ? requestIdHeader : randomUUID();

  return {
    requestId,
    startTime: Date.now(),
    token: '',
    operator: null,
    permissions: [],
    auditDrafts: [],
  } satisfies RequestContext;
}
