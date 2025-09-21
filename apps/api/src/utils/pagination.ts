export type PaginateOpts = {
  page?: number;
  pageSize?: number;
  max?: number;
};

export function paginate(opts: PaginateOpts = {}) {
  const page = Math.max(1, Number(opts.page ?? 1));
  const max = Number(opts.max ?? 100);
  const rawSize = Number(opts.pageSize ?? 10);
  const pageSize = Math.min(max, Math.max(1, rawSize));
  const take = pageSize;
  const skip = Math.max(0, (page - 1) * take);

  return { take, skip, page, pageSize };
}

export function formatPagination(
  total: number,
  page: number,
  pageSize: number
) {
  const totalPages = pageSize > 0 ? Math.ceil(total / pageSize) : 0;
  return {
    total,
    page,
    limit: pageSize,
    totalPages,
  };
}

export default { paginate, formatPagination };
