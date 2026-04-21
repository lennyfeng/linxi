import type { ServerResponse } from 'node:http';
import type { ErrorCode } from './error-codes.js';
import { ErrorCodes } from './error-codes.js';
import { jsonResponse } from './response.js';

export interface SendJsonOptions {
  statusCode?: number;
  message?: string;
  code?: ErrorCode;
  requestId?: string;
}

export function sendJson(res: ServerResponse, data: unknown, options: SendJsonOptions = {}) {
  const {
    statusCode = 200,
    message = 'ok',
    code = ErrorCodes.OK,
    requestId = '',
  } = options;

  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'X-Request-Id': requestId,
  });
  res.end(JSON.stringify(jsonResponse(data, message, code, requestId)));
}
