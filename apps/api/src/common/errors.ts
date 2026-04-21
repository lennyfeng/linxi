import { ErrorCodes } from './error-codes.js';

export class AppError extends Error {
  statusCode: number;
  code: number;
  data: unknown;

  constructor(statusCode: number, message: string, data: unknown = { details: null }, code = statusCode) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code;
    this.data = data;
  }
}

export function getRouteNotFound(pathname: string, requestId = '') {
  return {
    code: ErrorCodes.RESOURCE_NOT_FOUND,
    message: 'route_not_found',
    data: { pathname },
    request_id: requestId,
    timestamp: new Date().toISOString(),
  };
}

export function getErrorResponse(error: unknown, requestId = '') {
  if (error instanceof AppError) {
    return {
      statusCode: error.statusCode,
      body: {
        code: error.code,
        message: error.message,
        data: error.data,
        request_id: requestId,
        timestamp: new Date().toISOString(),
      },
    };
  }

  return {
    statusCode: 500,
    body: {
      code: ErrorCodes.INTERNAL_SERVER_ERROR,
      message: 'internal_server_error',
      data: { details: null },
      request_id: requestId,
      timestamp: new Date().toISOString(),
    },
  };
}
