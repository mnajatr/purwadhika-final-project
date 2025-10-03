"use client";

import * as React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Calendar as CalendarComponent } from "../../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../../components/ui/popover";
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Package,
  Eye,
  MoreHorizontal,
  X,
  ShoppingBag,
  Clock,
  Filter,
  CheckCircle2,
  XCircle,
  Loader2,
  Truck,
  CreditCard,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import DevUserSwitcher from "../../components/DevUserSwitcher";
import { useCustomerOrders, type Order } from "@/hooks/useCustomerOrders";

export default function OrdersPage() {
  const router = useRouter();
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

  const { data, isLoading, isFetching, error } = useCustomerOrders({
    page,
    pageSize,
    status,
    q,
    dateRange,
  });

  const orders: Order[] = data?.items || [];
  const total = data?.total ?? 0;
  const isPaginating = isFetching && !isLoading;

  const statusConfig: Record<
    string,
    {
      color: string;
      icon: React.ReactNode;
      label: string;
    }
  > = {
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
  };

  const statuses = React.useMemo(
    () => [
      { key: null, label: "All Orders" },
      { key: "PENDING_PAYMENT", label: "Pending Payment" },
      { key: "PAYMENT_REVIEW", label: "Payment Review" },
      { key: "PROCESSING", label: "Processing" },
      { key: "SHIPPED", label: "Shipped" },
      { key: "CONFIRMED", label: "Confirmed" },
      { key: "CANCELLED", label: "Cancelled" },
    ],
    []
  );

  const noResultsForFilter = false;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen">
        {/* Gradient Header */}
        <div className="relative border-b border-border/40 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 backdrop-blur-sm">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-primary-gradient shadow-lg shadow-primary/20">
                    <ShoppingBag className="h-6 w-6 text-primary-foreground" />
                  </div>
                  <div>
                    <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                      Your Orders
                    </h1>
                    <p className="text-sm text-muted-foreground mt-1">
                      Manage and track your orders
                    </p>
                  </div>
                </div>
              </div>
              <DevUserSwitcher />
            </div>
          </div>
        </div>

        {/* Loading content */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-36 bg-gradient-to-br from-card/80 to-card/40 rounded-2xl animate-pulse border border-border/50"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <div className="max-w-md w-full text-center">
          <div className="p-4 rounded-full bg-rose-100/80 dark:bg-rose-900/20 w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <XCircle className="h-10 w-10 text-rose-600 dark:text-rose-500" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
          <p className="text-muted-foreground mb-6">
            {error instanceof Error ? error.message : "Failed to load your orders. Please try again."}
          </p>
          <Button
            onClick={() => window.location.reload()}
            className="bg-primary-gradient hover:opacity-90 shadow-lg shadow-primary/25"
          >
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Gradient Header with Stats */}
      <div className="relative border-b border-border/40 bg-gradient-to-br from-primary/5 via-accent/5 to-primary/10 backdrop-blur-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-start justify-between mb-8">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary-gradient shadow-lg shadow-primary/20">
                  <ShoppingBag className="h-6 w-6 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="text-3xl sm:text-4xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                    Your Orders
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1">
                    {total > 0
                      ? `${total} orders found`
                      : "Manage and track your orders"}
                  </p>
                </div>
              </div>
            </div>
            <DevUserSwitcher />
          </div>
          {/* Search and Filters */}
          <div className="space-y-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search by Order ID or Product Name..."
                  value={searchInput}
                  onChange={(e) => {
                    setSearchInput(e.target.value);
                  }}
                  className="h-11 w-full rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={`h-11 sm:w-72 rounded-xl border-border/60 bg-card/80 backdrop-blur-sm justify-start text-left font-normal hover:bg-card/90 transition-all ${
                      !dateRange.from && "text-muted-foreground"
                    }`}
                  >
                    <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
                    <span className="truncate">
                      {dateRange.from ? (
                        dateRange.to ? (
                          dateRange.from.getTime() === dateRange.to.getTime() ? (
                            format(dateRange.from, "PPP")
                          ) : (
                            <>
                              {format(dateRange.from, "MMM dd")} -{" "}
                              {format(dateRange.to, "MMM dd, yyyy")}
                            </>
                          )
                        ) : (
                          format(dateRange.from, "PPP")
                        )
                      ) : (
                        "Pick date range"
                      )}
                    </span>
                    {(dateRange.from || dateRange.to) && (
                      <X
                        className="ml-auto h-4 w-4 flex-shrink-0 opacity-50 hover:opacity-100"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDateRange({ from: undefined, to: undefined });
                          setPage(1);
                        }}
                      />
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 rounded-2xl border-border/60 shadow-lg" align="start">
                  <div className="p-4 space-y-3">
                    <CalendarComponent
                      mode="range"
                      selected={{
                        from: dateRange.from,
                        to: dateRange.to,
                      }}
                      onSelect={(range: { from?: Date; to?: Date } | undefined) => {
                        setDateRange({
                          from: range?.from,
                          to: range?.to,
                        });
                        setPage(1);
                      }}
                      initialFocus
                      className="rounded-lg"
                      numberOfMonths={1}
                    />
                    {(dateRange.from || dateRange.to) && (
                      <div className="flex gap-2 pt-3 border-t border-border/40">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            setDateRange({ from: undefined, to: undefined });
                            setPage(1);
                          }}
                          className="flex-1 rounded-lg"
                        >
                          Clear
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => {
                            const today = new Date();
                            setDateRange({ from: today, to: today });
                            setPage(1);
                          }}
                          className="flex-1 rounded-lg bg-primary-gradient hover:opacity-90"
                        >
                          Today
                        </Button>
                      </div>
                    )}
                  </div>
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex flex-wrap justify-center gap-3">
              {statuses.map((s) => {
                const active = status === s.key;
                return (
                  <motion.button
                    key={s.key || "all"}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    animate={{
                      backgroundColor: active
                        ? "rgb(152, 224, 121)" // #98E079
                        : "rgb(229, 246, 220)", // Light green for inactive
                      color: active ? "rgb(255, 255, 255)" : "rgb(74, 122, 50)", // Dark green text for inactive
                    }}
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 25,
                    }}
                    onClick={() => {
                      setStatus(s.key);
                      setPage(1);
                    }}
                    className={`relative overflow-hidden whitespace-nowrap rounded-full px-6 py-2.5 text-sm font-medium shadow-sm ${
                      active ? "shadow-lg shadow-[#98E079]/40" : ""
                    }`}
                  >
                    {active && (
                      <motion.div
                        layoutId="activeStatus"
                        className="absolute inset-0 bg-gradient-to-r from-[#98E079] to-[#BBEB88]"
                        initial={false}
                        transition={{
                          type: "spring",
                          stiffness: 300,
                          damping: 30,
                        }}
                      />
                    )}
                    <span className="relative z-10">{s.label}</span>
                  </motion.button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        {noResultsForFilter ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-6 rounded-2xl bg-muted/30 mb-6">
              <Filter className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold mb-2">No orders found</h3>
            <p className="text-muted-foreground mb-6 max-w-md">
              No orders match your current filters. Try adjusting your search
              criteria to find what you&apos;re looking for.
            </p>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-6 rounded-2xl bg-muted/30 mb-6">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
            </div>
            <h3 className="text-xl font-bold mb-2">No orders yet</h3>
            <p className="text-muted-foreground max-w-md">
              When you place your first order, it will appear here. Start
              shopping to see your order history!
            </p>
          </div>
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
                  key={`${status || "all"}-${q || "noq"}-${dateRange.from?.getTime() || "nodate"}-${dateRange.to?.getTime() || "nodate"}`}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-3"
                >
                  {orders.map((order, index) => {
                    const orderStatus = statusConfig[order.status] || {
                      color: "bg-muted text-muted-foreground border-muted",
                      icon: <Package className="h-3.5 w-3.5" />,
                      label: order.status,
                    };

                    const totalItems = order.items?.reduce(
                      (sum, it) => sum + (it?.quantity ?? 1),
                      0
                    ) ?? 0;

                    return (
                      <motion.div
                        key={order.id}
                        initial={{ opacity: 0, y: 30, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={{
                          duration: 0.4,
                          delay: index * 0.05,
                          ease: [0.25, 0.46, 0.45, 0.94],
                        }}
                        whileHover={{
                          y: -4,
                          transition: { duration: 0.2 },
                        }}
                        className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-sm p-3 cursor-pointer"
                        onClick={(e) => {
                          const target = e.target as HTMLElement | null;
                          if (!target) return;
                          if (target.closest('button, a, input, textarea, select')) return;
                          if (target.closest('.radix-portal')) return;
                          router.push(`/orders/${order.id}`);
                        }}
                      >
                        <div className="flex items-center justify-between mb-3 pl-3 pr-3">
                          <h3 className="text-base lg:text-md font-semibold text-muted-foreground leading-tight">
                            ID {order.id}
                          </h3>

                          <div>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-8 w-8 p-0 rounded-md bg-muted/8 hover:bg-muted/16"
                                >
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="end"
                                className="w-48"
                              >
                                <DropdownMenuItem asChild>
                                  <Link
                                    href={`/orders/${order.id}`}
                                    className="cursor-pointer"
                                  >
                                    <Eye className="mr-2 h-4 w-4" />
                                    View Details
                                  </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => {
                                    navigator.clipboard.writeText(
                                      String(order.id)
                                    );
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Package className="mr-2 h-4 w-4" />
                                  Copy Order ID
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        <div className="rounded-lg border border-border/40 bg-[#FFFFF5]/60 backdrop-blur-sm p-3 group-hover:border-primary/20 transition-colors duration-300">
                          <div className="flex flex-row flex-wrap items-center justify-between gap-3">
                            <div className="flex items-center gap-3 flex-1 min-w-0">
                              <div className="flex-shrink-0 rounded-lg overflow-hidden shadow-sm shadow-primary/20 group-hover:scale-105 transition-transform duration-300 relative h-20 w-20">
                                {(() => {
                                  const firstItem = order.items?.[0];
                                  const firstProduct = firstItem?.product;
                                  let finalImageUrl = '';
                                  
                                  if (Array.isArray(firstProduct?.images) && firstProduct.images.length > 0) {
                                    const firstImageObj = firstProduct.images[0];
                                    if (firstImageObj && typeof firstImageObj.imageUrl === 'string' && firstImageObj.imageUrl.trim()) {
                                      finalImageUrl = firstImageObj.imageUrl.trim();
                                    }
                                  }
                                  
                                  const productName = firstProduct?.name || "Product";

                                  if (finalImageUrl) {
                                    return (
                                      <Image
                                        src={finalImageUrl}
                                        alt={productName}
                                        fill
                                        className="object-cover"
                                        sizes="96px"
                                        onError={() => {}}
                                      />
                                    );
                                  } else {
                                    return (
                                      <div className="h-full w-full p-4 bg-primary-gradient flex items-center justify-center">
                                        <Package className="h-12 w-12 text-primary-foreground" />
                                      </div>
                                    );
                                  }
                                })()}
                              </div>

                              <div className="flex-1 min-w-0">
                                <div className="mb-2">
                                  <h4 className="text-base font-bold mb-1 group-hover:text-primary transition-colors line-clamp-1">
                                    {order.items?.[0]?.product?.name || "Product Name"}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {formatDate(order.createdAt)}
                                  </p>
                                </div>
                              </div>
                            </div>

                            <div className="flex flex-col items-end gap-3 flex-shrink-0 min-w-[120px] sm:min-w-[140px] lg:min-w-[180px]">
                              <Badge
                                className={`flex items-center gap-1.5 px-3 py-1.5 border font-medium ${orderStatus.color}`}
                              >
                                {orderStatus.icon}
                                {orderStatus.label}
                              </Badge>
                            </div>
                          </div>
                          <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
                              <p className="text-sm font-medium text-foreground">
                                {totalItems > 0 ? `${totalItems} ${totalItems === 1 ? 'item' : 'items'}` : '0 items'}
                              </p>
                            <p className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                              {formatCurrency(Number(order.grandTotal || 0))}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </motion.div>
              </AnimatePresence>
            </div>

            {orders.length > 0 && (
              <div className="mt-8 p-6 rounded-2xl border border-border/50 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-sm">
                <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-sm text-muted-foreground order-2 sm:order-1">
                    Showing <span className="font-semibold text-foreground">{orders.length}</span> of <span className="font-semibold text-foreground">{total}</span> orders
                  </div>

                  <div className="flex items-center gap-2 order-1 sm:order-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="h-10 rounded-xl border-border/60 hover:bg-muted/80 disabled:opacity-50"
                    >
                      <ChevronLeft className="mr-1.5 h-4 w-4" />
                      Previous
                    </Button>

                    <div className="hidden sm:flex items-center gap-1">
                      {Array.from(
                        { length: Math.min(5, Math.ceil(total / pageSize)) },
                        (_, i) => {
                          const pageNum = Math.max(1, page - 2) + i;
                          if (pageNum > Math.ceil(total / pageSize))
                            return null;

                          return (
                            <Button
                              key={pageNum}
                              variant={pageNum === page ? "default" : "outline"}
                              size="sm"
                              onClick={() => setPage(pageNum)}
                              className={`h-10 w-10 p-0 rounded-xl ${
                                pageNum === page
                                  ? "bg-primary-gradient shadow-lg shadow-primary/25"
                                  : "border-border/60 hover:bg-muted/80"
                              }`}
                            >
                              {pageNum}
                            </Button>
                          );
                        }
                      )}
                    </div>

                    <div className="sm:hidden px-4 py-2 rounded-xl bg-muted/50 text-sm font-medium">
                      {page} / {Math.ceil(total / pageSize)}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPage((p) => p + 1)}
                      disabled={page * pageSize >= total}
                      className="h-10 rounded-xl border-border/60 hover:bg-muted/80 disabled:opacity-50"
                    >
                      Next
                      <ChevronRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
