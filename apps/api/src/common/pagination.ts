import { AppError } from './errors.js';
import { ErrorCodes } from './error-codes.js';

export interface PaginationInput {
  page?: number | string | null;
  pageSize?: number | string | null;
}

export interface PaginationMeta {
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
}

export function normalizePagination(input: PaginationInput, defaultPageSize = 20, maxPageSize = 100) {
  const page = Number(input.page || 1);
  const pageSize = Number(input.pageSize || defaultPageSize);

  if (!Number.isInteger(page) || page <= 0 || !Number.isInteger(pageSize) || pageSize <= 0 || pageSize > maxPageSize) {
    return {
      ok: false as const,
      error: {
        statusCode: 400,
        code: ErrorCodes.PAGINATION_OUT_OF_RANGE,
        message: 'pagination_out_of_range',
      },
    };
  }

  return {
    ok: true as const,
    value: {
      page,
      pageSize,
      offset: (page - 1) * pageSize,
    },
  };
}

export function getListPagination(query: Record<string, unknown>, defaultPageSize = 20, maxPageSize = 100) {
  const input: PaginationInput = {
    page: (query.page ?? query.Page ?? 1) as number | string,
    pageSize: (query.pageSize ?? query.page_size ?? query.PageSize ?? defaultPageSize) as number | string,
  };

  const result = normalizePagination(input, defaultPageSize, maxPageSize);

  if (!result.ok) {
    throw new AppError(result.error.statusCode, result.error.message, { details: null }, result.error.code);
  }

  return { page: result.value.page, pageSize: result.value.pageSize };
}

export function buildPagination(page: number, pageSize: number, total: number): PaginationMeta {
  return {
    page,
    page_size: pageSize,
    total,
    total_pages: total <= 0 ? 0 : Math.ceil(total / pageSize),
  };
}
