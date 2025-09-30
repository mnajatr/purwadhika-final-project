"use client";

import * as React from "react";
import Link from "next/link";
import { Badge } from "../../components/ui/badge";
import { Button } from "../../components/ui/button";
import { Separator } from "../../components/ui/separator";
import {
  Search,
  Calendar,
  ChevronLeft,
  ChevronRight,
  Package,
  Eye,
  MoreHorizontal,
  X,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import DevUserSwitcher from "../../components/DevUserSwitcher";

interface Order {
  id: number;
  status: string;
  invoiceId: string;
  createdAt: string;
  total: number;
  grandTotal?: number;
  items?: {
    id: number;
    quantity: number;
    product?: {
      name: string;
    };
  }[];
  orderDetails?: {
    quantity: number;
    product: {
      name: string;
    };
  }[];
}

// Get current user ID using the same logic as axios client
function getCurrentUserId(): string {
  if (typeof window === "undefined") return "4"; // server-side fallback

  try {
    const stored = localStorage.getItem("devUserId");
    console.log("fetchOrders: devUserId from localStorage:", stored);
    if (stored && stored !== "none") {
      return stored;
    }
  } catch {
    // ignore localStorage errors
  }

  // Default fallback when none is set
  return "4";
}

// Fetch paginated orders from backend and return envelope { items, total, page, pageSize }
async function fetchOrders(
  filters: {
    status?: string;
    q?: string;
    date?: string;
    page?: number;
    pageSize?: number;
  } = {}
) {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.q) params.append("q", filters.q);
  if (typeof filters.page === "number")
    params.append("page", String(filters.page));
  if (typeof filters.pageSize === "number")
    params.append("pageSize", String(filters.pageSize));
  if (filters.date) {
    const selectedDate = new Date(filters.date);
    const dateFrom = new Date(selectedDate);
    dateFrom.setHours(0, 0, 0, 0);

    const dateTo = new Date(selectedDate);
    dateTo.setHours(23, 59, 59, 999);

    params.append("dateFrom", dateFrom.toISOString());
    params.append("dateTo", dateTo.toISOString());
  }

  const currentUserId = getCurrentUserId();
  const url = `http://localhost:8000/api/orders?${params.toString()}`;
  console.log("Fetching orders from:", url, "for user:", currentUserId);

  const response = await fetch(url, {
    headers: {
      "x-dev-user-id": currentUserId,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  console.log("API Response:", data);

  if (data.success && data.data) {
    return data.data; // envelope with items, total, page, pageSize
  }

  return { items: [], total: 0, page: 1, pageSize: filters.pageSize ?? 10 };
}

export default function OrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [total, setTotal] = React.useState<number>(0);
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [q, setQ] = React.useState<string | null>(null);
  const [date, setDate] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);

  const [searchTimeoutId, setSearchTimeoutId] =
    React.useState<NodeJS.Timeout | null>(null);

  const [page, setPage] = React.useState<number>(1);
  const pageSize = 10;

  // Load orders from server whenever filters or page change
  React.useEffect(() => {
    let mounted = true;
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const resp = await fetchOrders({
          status: status ?? undefined,
          q: q ?? undefined,
          date: date ?? undefined,
          page,
          pageSize,
        });
        if (!mounted) return;
        setOrders(resp.items || []);
        setTotal(resp.total ?? 0);
      } catch (err) {
        console.error("❌ Error loading orders:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        if (mounted) setIsLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, [status, q, date, page]);

  // Log filter changes for debugging
  React.useEffect(() => {
    console.log("🔍 Filtering orders with:", { status, q, date });
  }, [orders, status, q, date]);

  const statusColor: Record<string, string> = {
    PENDING_PAYMENT: "bg-amber-100/80 text-amber-700 border-amber-200",
    PAYMENT_REVIEW: "bg-orange-100/80 text-orange-700 border-orange-200",
    PROCESSING: "bg-blue-100/80 text-blue-700 border-blue-200",
    SHIPPED: "bg-indigo-100/80 text-indigo-700 border-indigo-200",
    CONFIRMED: "bg-emerald-100/80 text-emerald-700 border-emerald-200",
    CANCELLED: "bg-rose-100/80 text-rose-700 border-rose-200",
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

  // Cleanup timeout on unmount
  React.useEffect(() => {
    return () => {
      if (searchTimeoutId) {
        clearTimeout(searchTimeoutId);
      }
    };
  }, [searchTimeoutId]);

  const hasActiveFilters = Boolean(status || q || date);
  const isFiltered = hasActiveFilters;
  const noResultsForFilter = isFiltered && orders.length === 0;

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

  const clearAllFilters = () => {
    setStatus(null);
    setQ(null);
    setDate(null);
    setPage(1);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent">
        {/* Header */}
        <div className="border-b border-border/60 bg-card/80 backdrop-blur">
          <div className="mx-auto max-w-6xl px-6 py-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold tracking-tight">
                  Your Orders
                </h1>
                <p className="text-muted-foreground">
                  Manage and track your orders
                </p>
              </div>
              <DevUserSwitcher />
            </div>
          </div>
        </div>

        {/* Loading content */}
        <div className="mx-auto max-w-6xl px-6 py-8">
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-muted/40 rounded-lg animate-pulse"
              />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-transparent flex items-center justify-center">
        <div className="text-center">
          <div className="text-xl font-semibold text-rose-600 mb-2">
            {error}
          </div>
          <p className="text-muted-foreground">Failed to load orders</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-transparent">
      {/* Header */}
      <div className="border-b border-border/60 bg-card/80 backdrop-blur">
        <div className="mx-auto max-w-6xl px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Your Orders</h1>
              <p className="text-muted-foreground">
                {total > 0
                  ? `${total} orders found`
                  : "Manage and track your orders"}
              </p>
            </div>
            <DevUserSwitcher />
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by Order ID or Product Name..."
                value={q ?? ""}
                onChange={(e) => {
                  const value = e.target.value || null;
                  setQ(value);

                  if (searchTimeoutId) clearTimeout(searchTimeoutId);

                  const newTimeoutId = setTimeout(() => {
                    setPage(1);
                  }, 500);
                  setSearchTimeoutId(newTimeoutId);
                }}
                className="h-10 w-full rounded-lg border border-border/60 bg-background pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Date Filter */}
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="date"
                value={date ?? ""}
                onChange={(e) => {
                  setDate(e.target.value || null);
                  setPage(1);
                }}
                className="h-10 rounded-lg border border-border/60 bg-background pl-10 pr-4 text-sm focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
              />
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
          </div>

          {/* Status Tabs */}
          <div className="mt-6 flex gap-1 overflow-x-auto pb-2">
            {statuses.map((s) => {
              const active = status === s.key;
              return (
                <button
                  key={s.key || "all"}
                  onClick={() => {
                    setStatus(s.key);
                    setPage(1);
                  }}
                  className={`whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {s.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto max-w-6xl px-6 py-8">
        {noResultsForFilter ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders found</h3>
            <p className="text-muted-foreground mb-4">
              No orders match your current filters. Try adjusting your search
              criteria.
            </p>
            <Button onClick={clearAllFilters}>Clear All Filters</Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Package className="h-12 w-12 text-muted-foreground/40 mb-4" />
            <h3 className="text-lg font-semibold mb-2">No orders yet</h3>
            <p className="text-muted-foreground">
              When you place your first order, it will appear here.
            </p>
          </div>
        ) : (
          <>
            {/* Orders List */}
            <div className="space-y-3">
              {orders.map((order) => (
                <div
                  key={order.id}
                  className="group flex items-center justify-between rounded-lg border border-border/60 bg-card/80 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="flex items-center gap-4">
                    {/* Order Icon */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Package className="h-5 w-5" />
                    </div>

                    {/* Order Details */}
                    <div>
                      <div className="flex items-center gap-3">
                        <h3 className="font-semibold">Order #{order.id}</h3>
                        <Badge
                          className={`border ${
                            statusColor[order.status] ||
                            "bg-muted text-muted-foreground"
                          }`}
                        >
                          {order.status.replace("_", " ")}
                        </Badge>
                      </div>
                      <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                        <span>
                          {order.items?.length || 0} item
                          {(order.items?.length || 0) !== 1 ? "s" : ""}
                        </span>
                        <Separator orientation="vertical" className="h-4" />
                        <span>{formatDate(order.createdAt)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    {/* Total */}
                    <div className="text-right">
                      <div className="font-semibold">
                        {formatCurrency(Number(order.grandTotal || 0))}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <Link href={`/orders/${order.id}`}>
                        <Button variant="outline" size="sm">
                          <Eye className="mr-2 h-4 w-4" />
                          View
                        </Button>
                      </Link>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/orders/${order.id}`}>
                              View Details
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => {
                              navigator.clipboard.writeText(String(order.id));
                            }}
                          >
                            Copy Order ID
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {total > pageSize && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Showing {(page - 1) * pageSize + 1} to{" "}
                  {Math.min(page * pageSize, total)} of {total} orders
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="mr-2 h-4 w-4" />
                    Previous
                  </Button>

                  <div className="flex items-center gap-1">
                    {/* Show page numbers around current page */}
                    {Array.from(
                      { length: Math.min(5, Math.ceil(total / pageSize)) },
                      (_, i) => {
                        const pageNum = Math.max(1, page - 2) + i;
                        if (pageNum > Math.ceil(total / pageSize)) return null;

                        return (
                          <Button
                            key={pageNum}
                            variant={pageNum === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setPage(pageNum)}
                            className="h-8 w-8 p-0"
                          >
                            {pageNum}
                          </Button>
                        );
                      }
                    )}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * pageSize >= total}
                  >
                    Next
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
