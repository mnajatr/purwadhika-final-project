"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface OrdersListPaginationProps {
  page: number;
  pageSize: number;
  total: number;
  ordersCount: number;
  onPageChange: (page: number) => void;
}

export default function OrdersListPagination({
  page,
  pageSize,
  total,
  ordersCount,
  onPageChange,
}: OrdersListPaginationProps) {
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="mt-8 p-6 rounded-2xl border border-border/50 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-sm text-muted-foreground order-2 sm:order-1">
          Showing{" "}
          <span className="font-semibold text-foreground">{ordersCount}</span>{" "}
          of <span className="font-semibold text-foreground">{total}</span>{" "}
          orders
        </div>

        <div className="flex items-center gap-2 order-1 sm:order-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(Math.max(1, page - 1))}
            disabled={page <= 1}
            className="h-10 rounded-xl border-border/60 hover:bg-muted/80 disabled:opacity-50"
          >
            <ChevronLeft className="mr-1.5 h-4 w-4" />
            Previous
          </Button>

          <div className="hidden sm:flex items-center gap-1">
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              const pageNum = Math.max(1, page - 2) + i;
              if (pageNum > totalPages) return null;

              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  onClick={() => onPageChange(pageNum)}
                  className={`h-10 w-10 p-0 rounded-xl ${
                    pageNum === page
                      ? "bg-primary-gradient shadow-lg shadow-primary/25"
                      : "border-border/60 hover:bg-muted/80"
                  }`}
                >
                  {pageNum}
                </Button>
              );
            })}
          </div>

          <div className="sm:hidden px-4 py-2 rounded-xl bg-muted/50 text-sm font-medium">
            {page} / {totalPages}
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(page + 1)}
            disabled={page * pageSize >= total}
            className="h-10 rounded-xl border-border/60 hover:bg-muted/80 disabled:opacity-50"
          >
            Next
            <ChevronRight className="ml-1.5 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
