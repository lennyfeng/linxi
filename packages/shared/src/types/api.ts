export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
  requestId: string;
}

export interface ApiErrorResponse {
  code: number;
  message: string;
  details?: string;
  requestId: string;
}
