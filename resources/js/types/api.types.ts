export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    current_page: number;
    last_page: number;
  };
}

// Wrapper untuk single resource response
export interface ApiResponse<T> {
  data?: T;
  message?: string;
}