import type { ErrorCode } from './error-codes.js';
import { ErrorCodes } from './error-codes.js';

export function jsonResponse(data: unknown, message = 'ok', code: ErrorCode = ErrorCodes.OK, requestId = '') {
  return {
    code,
    message,
    data,
    request_id: requestId,
    timestamp: new Date().toISOString(),
  };
}
