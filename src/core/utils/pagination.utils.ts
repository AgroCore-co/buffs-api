import { PaginatedResponse } from '../dto/pagination.dto';

export function createPaginatedResponse<T>(data: T[], total: number, page: number, limit: number): PaginatedResponse<T> {
  const totalPages = Math.ceil(total / limit);

  return {
    data,
    meta: {
      page,
      limit,
      total,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  };
}

export function calculatePaginationParams(page = 1, limit = 10) {
  const offset = (page - 1) * limit;
  return { offset, limit };
}
