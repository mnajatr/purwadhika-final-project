interface OrdersListPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export default function OrdersListPagination({
  page,
  pageSize,
  total,
  onPageChange,
}: OrdersListPaginationProps) {
  const totalPages = Math.ceil(total / pageSize);
  const showingFrom = (page - 1) * pageSize + 1;
  const showingTo = Math.min(page * pageSize, total);

  return (
    <div className="mt-6 flex items-center justify-between">
      <div className="text-sm text-muted-foreground">
        Showing {showingFrom} to {showingTo} of {total} results
      </div>
      <div className="flex items-center space-x-2">
        <button
          className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={page <= 1}
          onClick={() => onPageChange(Math.max(1, page - 1))}
        >
          Previous
        </button>
        <div className="flex items-center space-x-1">
          {Array.from(
            {
              length: Math.min(5, totalPages),
            },
            (_, i) => i + 1
          ).map((pageNum) => (
            <button
              key={pageNum}
              onClick={() => onPageChange(pageNum)}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                page === pageNum
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-foreground hover:bg-accent hover:text-accent-foreground"
              }`}
            >
              {pageNum}
            </button>
          ))}
        </div>
        <button
          className="px-4 py-2 bg-card border border-border rounded-lg text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          disabled={page * pageSize >= total}
          onClick={() => onPageChange(page + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
}
