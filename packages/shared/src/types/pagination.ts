export interface PaginatedRequest {
  page?: number;
  pageSize?: number;
  sortField?: string;
  sortOrder?: 'ascend' | 'descend';
}

export interface PaginatedResponse<T> {
  list: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
