"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Truck,
  CreditCard,
} from "lucide-react";
import { useOrdersList } from "@/hooks/useOrdersList";
import OrdersListHeader from "./OrdersListHeader";
import OrdersListFilters from "./OrdersListFilters";
import OrdersListLoading from "./OrdersListLoading";
import OrdersListError from "./OrdersListError";
import OrdersListEmpty from "./OrdersListEmpty";
import OrdersListPagination from "./OrdersListPagination";
import OrderCard from "./OrderCard";

export default function OrdersList() {
  const [searchInput, setSearchInput] = React.useState<string>("");
  const [q, setQ] = React.useState<string | null>(null);
  const [dateRange, setDateRange] = React.useState<{
    from: Date | undefined;
    to: Date | undefined;
  }>({ from: undefined, to: undefined });
  const [status, setStatus] = React.useState<string | null>(null);
  const [page, setPage] = React.useState<number>(1);
  const pageSize = 10;

  React.useEffect(() => {
    const timer = setTimeout(() => {
      setQ(searchInput || null);
      setPage(1);
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data, isLoading, isFetching, error } = useOrdersList({
    page,
    pageSize,
    status,
    q,
    dateRange,
  });

  const orders = data?.items || [];
  const total = data?.total ?? 0;
  const isPaginating = isFetching && !isLoading;

  const statusConfig = React.useMemo(
    () => ({
      PENDING_PAYMENT: {
        color: "bg-amber-100/80 text-amber-700 border-amber-200",
        icon: <Clock className="h-3.5 w-3.5" />,
        label: "Pending Payment",
      },
      PAYMENT_REVIEW: {
        color: "bg-orange-100/80 text-orange-700 border-orange-200",
        icon: <CreditCard className="h-3.5 w-3.5" />,
        label: "Payment Review",
      },
      PROCESSING: {
        color: "bg-blue-100/80 text-blue-700 border-blue-200",
        icon: <Loader2 className="h-3.5 w-3.5 animate-spin" />,
        label: "Processing",
      },
      SHIPPED: {
        color: "bg-indigo-100/80 text-indigo-700 border-indigo-200",
        icon: <Truck className="h-3.5 w-3.5" />,
        label: "Shipped",
      },
      CONFIRMED: {
        color: "bg-emerald-100/80 text-emerald-700 border-emerald-200",
        icon: <CheckCircle2 className="h-3.5 w-3.5" />,
        label: "Confirmed",
      },
      CANCELLED: {
        color: "bg-rose-100/80 text-rose-700 border-rose-200",
        icon: <XCircle className="h-3.5 w-3.5" />,
        label: "Cancelled",
      },
    }),
    []
  );

  const formatCurrency = React.useCallback((amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  }, []);

  const formatDate = React.useCallback((dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }, []);

  const handleDateRangeChange = React.useCallback(
    (range: { from: Date | undefined; to: Date | undefined }) => {
      setDateRange(range);
      setPage(1);
    },
    []
  );

  const handleStatusChange = React.useCallback((newStatus: string | null) => {
    setStatus(newStatus);
    setPage(1);
  }, []);

  const hasFilters = !!(q || status || dateRange.from || dateRange.to);

  if (isLoading) {
    return <OrdersListLoading />;
  }

  if (error && !data) {
    return <OrdersListError error={error} />;
  }

  return (
    <div className="min-h-screen">
      <OrdersListHeader total={total} />

      <div className="relative border-b border-border/40 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
          <OrdersListFilters
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            dateRange={dateRange}
            onDateRangeChange={handleDateRangeChange}
            status={status}
            onStatusChange={handleStatusChange}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {orders.length === 0 ? (
          <OrdersListEmpty hasFilters={hasFilters} />
        ) : (
          <>
            <div className="relative">
              {isPaginating && (
                <div className="absolute inset-0 bg-background/80 z-10 flex items-center justify-center">
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-muted-foreground">
                      Loading...
                    </span>
                  </div>
                </div>
              )}

              <AnimatePresence mode="wait">
                <motion.div
                  key={`${status || "all"}-${q || "noq"}-${
                    dateRange.from?.getTime() || "nodate"
                  }-${dateRange.to?.getTime() || "nodate"}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  {orders.map((order, index) => (
                    <OrderCard
                      key={order.id}
                      order={order}
                      index={index}
                      statusConfig={statusConfig}
                      formatCurrency={formatCurrency}
                      formatDate={formatDate}
                    />
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>

            {orders.length > 0 && (
              <OrdersListPagination
                page={page}
                pageSize={pageSize}
                total={total}
                ordersCount={orders.length}
                onPageChange={setPage}
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}
