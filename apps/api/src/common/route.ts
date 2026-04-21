import { ErrorCodes } from './error-codes.js';
import { AppError } from './errors.js';

export function getIdFromPath(pathname: string, prefix: string): number {
  if (!pathname.startsWith(prefix)) {
    throw new AppError(404, 'route_not_found', { pathname }, ErrorCodes.RESOURCE_NOT_FOUND);
  }

  const value = pathname.slice(prefix.length).split('/')[0];
  if (!value) {
    throw new AppError(400, 'invalid_request', { field: 'id', reason: 'required' }, ErrorCodes.INVALID_REQUEST);
  }

  const id = Number(value);
  if (!Number.isInteger(id) || id <= 0) {
    throw new AppError(400, 'invalid_request', { field: 'id', reason: 'invalid_id' }, ErrorCodes.INVALID_REQUEST);
  }

  return id;
}
