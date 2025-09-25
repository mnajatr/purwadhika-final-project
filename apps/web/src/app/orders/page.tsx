"use client";

import * as React from "react";
import Link from "next/link";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";
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
  filters: { status?: string; q?: string; date?: string; page?: number; pageSize?: number } = {}
) {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.q) params.append("q", filters.q);
  if (typeof filters.page === "number") params.append("page", String(filters.page));
  if (typeof filters.pageSize === "number") params.append("pageSize", String(filters.pageSize));
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
  const [counts, setCounts] = React.useState<Record<string, number>>({});
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
        const resp = await fetchOrders({ status: status ?? undefined, q: q ?? undefined, date: date ?? undefined, page, pageSize });
        if (!mounted) return;
        setOrders(resp.items || []);
        setTotal(resp.total ?? 0);
        // counts endpoint exists — but to keep this change small, derive counts from resp.pagination if available
        // If a dedicated counts endpoint is preferred, we can call it separately.
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

  // Filter orders and calculate counts whenever filters or data change
  React.useEffect(() => {
    console.log("🔍 Filtering orders with:", { status, q, date });

    // No client-side filtering: server handles paging and filters. Keep counts as empty until a counts endpoint is used.
    setCounts({
      ALL: 0,
      PENDING_PAYMENT: 0,
      PAYMENT_REVIEW: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      CONFIRMED: 0,
      CANCELLED: 0,
    });
  }, [orders, status, q, date]);

  const statusColor: Record<string, string> = {
    PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
    PAYMENT_REVIEW: "bg-amber-100 text-amber-800",
    PROCESSING: "bg-indigo-100 text-indigo-800",
    SHIPPED: "bg-sky-100 text-sky-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-red-100 text-red-800",
  };

  const statuses = React.useMemo(
    () => [
      { key: null, label: "ALL" },
      { key: "PENDING_PAYMENT", label: "PENDING PAYMENT" },
      { key: "PAYMENT_REVIEW", label: "PAYMENT REVIEW" },
      { key: "PROCESSING", label: "PROCESSING" },
      { key: "SHIPPED", label: "SHIPPED" },
      { key: "CONFIRMED", label: "CONFIRMED" },
      { key: "CANCELLED", label: "CANCELLED" },
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

  // Show filter status and results info
  const hasActiveFilters = Boolean(status || q || date);
  const isFiltered = hasActiveFilters;
  const noResultsForFilter = isFiltered && orders.length === 0;

  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="text-center">
          <div className="text-xl font-semibold">Loading orders…</div>
          <p className="text-sm text-muted-foreground">
            Please wait while we load your orders.
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center">
        <div className="text-xl font-semibold text-red-600">{error}</div>
        <p className="text-sm text-muted-foreground">Failed to load orders.</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    if (noResultsForFilter) {
      // When filter is active but no results - show filter UI with clear options
      return (
        <div className="max-w-5xl mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

          <DevUserSwitcher />

          {/* Search and Filter UI */}
          <div className="mb-6 flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                value={q ?? ""}
                placeholder="Search by Order ID (e.g. 3, 10) or Product Name"
                className="w-full border rounded-lg px-4 py-3 text-sm"
                onChange={(e) => {
                  const value = e.target.value ? e.target.value : null;
                  console.log("🔍 Search input changed:", value);
                  setQ(value);

                  // Clear existing timeout
                  if (searchTimeoutId) {
                    clearTimeout(searchTimeoutId);
                  }

                  // Set new timeout for debounced search
                  const newTimeoutId = setTimeout(() => {
                    console.log("⏰ Debounced search triggered for:", value);
                    // Filter will happen automatically via useEffect
                  }, 500);
                  setSearchTimeoutId(newTimeoutId);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    // Clear timeout and immediately trigger search
                    if (searchTimeoutId) {
                      clearTimeout(searchTimeoutId);
                      setSearchTimeoutId(null);
                    }
                    // Filter will happen automatically via useEffect
                  }
                }}
              />
            </div>
            <div className="mt-3 md:mt-0">
              <input
                type="date"
                value={date ?? ""}
                className="border rounded-lg px-3 py-2 text-sm"
                onChange={(e) => {
                  const value = e.target.value ? e.target.value : null;
                  setDate(value);
                  // Auto-trigger search when date changes - filter will happen automatically via useEffect
                }}
              />
            </div>
          </div>

          {/* Status Filter Tabs */}
          <div className="bg-muted/40 rounded-lg p-2 mb-4 overflow-auto">
            <div className="flex gap-2">
              {statuses.map((s) => {
                const active = status === s.key;
                const countKey = s.key || "ALL";
                return (
                  <button
                    key={s.key || "all"}
                    onClick={() => {
                      console.log("🔘 Status button clicked:", s.key);
                      console.log(
                        "🔄 Setting status from",
                        status,
                        "to",
                        s.key
                      );
                      setStatus(s.key);
                      // Force refetch immediately - filter will happen automatically via useEffect
                    }}
                    className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                      active
                        ? "bg-white shadow-md text-slate-900 border-b-2 border-primary"
                        : "text-muted-foreground hover:bg-white/30"
                    }`}
                  >
                    <span className="whitespace-nowrap">{s.label}</span>
                    <span className="ml-1 inline-flex items-center justify-center min-w-[26px] px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                      {counts[countKey] ?? 0}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* No Results Message with Clear Filter Options */}
          <div className="text-center py-12 bg-gray-50 rounded-lg">
            <div className="mb-4">
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No orders match your current filters
              </h3>
              <div className="text-sm text-gray-600 mb-4">
                <span className="mr-2">Active filters:</span>
                {status && (
                  <span className="mx-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                    Status: {status}
                  </span>
                )}
                {q && (
                  <span className="mx-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                    Search: &quot;{q}&quot;
                  </span>
                )}
                {date && (
                  <span className="mx-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                    Date: {date}
                  </span>
                )}
              </div>
              <div className="flex gap-2 justify-center flex-wrap">
                <button
                  onClick={() => {
                    setStatus(null);
                    setQ(null);
                    setDate(null);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-sm"
                >
                  Clear All Filters
                </button>
                {status && (
                  <button
                    onClick={() => setStatus(null)}
                    className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                  >
                    Clear Status
                  </button>
                )}
                {q && (
                  <button
                    onClick={() => setQ(null)}
                    className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                  >
                    Clear Search
                  </button>
                )}
                {date && (
                  <button
                    onClick={() => setDate(null)}
                    className="px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
                  >
                    Clear Date
                  </button>
                )}
              </div>
            </div>
            <p className="text-gray-500 text-sm">
              <span className="font-medium">{total}</span> total orders
              available
            </p>
          </div>
        </div>
      );
    } else {
      // When no orders at all (initial state or real empty)
      return (
        <div className="max-w-5xl mx-auto p-6 text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>
          <DevUserSwitcher />
          <div className="text-xl">No orders found</div>
          <p className="text-sm text-muted-foreground">
            You do not have any orders yet.
          </p>
        </div>
      );
    }
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-2">Your Orders</h1>
      
      <DevUserSwitcher />

      {/* Filter Status Indicator */}
      {hasActiveFilters && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
              <div className="text-sm text-blue-700">
                <span className="font-medium">
                  Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} orders
                </span>
                <span className="mx-2">•</span>
                <span>Filtered by:</span>
              {status && (
                <span className="mx-1 px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
                  Status: {status}
                </span>
              )}
              {q && (
                <span className="mx-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
                  Search: &quot;{q}&quot;
                </span>
              )}
              {date && (
                <span className="mx-1 px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
                  Date: {date}
                </span>
              )}
            </div>
            <button
              onClick={() => {
                setStatus(null);
                setQ(null);
                setDate(null);
              }}
              className="text-xs text-blue-600 hover:text-blue-800 underline"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row md:items-center md:gap-4 mb-4">
        <div className="flex-1">
          <input
            value={q ?? ""}
            placeholder="Search by Order ID (e.g. 3, 10) or Product Name"
            className="w-full border rounded-lg px-4 py-3 text-sm"
            onChange={(e) => {
              const value = e.target.value ? e.target.value : null;
              console.log("🔍 Search input changed:", value);
              setQ(value);

              // Clear existing timeout
              if (searchTimeoutId) {
                clearTimeout(searchTimeoutId);
              }

              // Set new timeout for debounced search
              const newTimeoutId = setTimeout(() => {
                console.log("⏰ Debounced search triggered for:", value);
                // Filter will happen automatically via useEffect
              }, 500);
              setSearchTimeoutId(newTimeoutId);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // Clear timeout and immediately trigger search
                if (searchTimeoutId) {
                  clearTimeout(searchTimeoutId);
                  setSearchTimeoutId(null);
                }
                // Filter will happen automatically via useEffect
              }
            }}
          />
        </div>
        <div className="mt-3 md:mt-0">
          <input
            type="date"
            value={date ?? ""}
            className="border rounded-lg px-3 py-2 text-sm"
            onChange={(e) => {
              const value = e.target.value ? e.target.value : null;
              setDate(value);
              // Auto-trigger search when date changes - filter will happen automatically via useEffect
            }}
          />
        </div>
      </div>

      <div className="bg-muted/40 rounded-lg p-2 mb-4 overflow-auto">
        <div className="flex gap-2">
          {statuses.map((s) => {
            const active = status === s.key;
            const countKey = s.key || "ALL";
            return (
              <button
                key={s.key || "all"}
                onClick={() => {
                  console.log("🔘 Status button clicked:", s.key);
                  console.log("🔄 Setting status from", status, "to", s.key);
                  setStatus(s.key);
                  // Force refetch immediately - filter will happen automatically via useEffect
                }}
                className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                  active
                    ? "bg-white shadow-md text-slate-900 border-b-2 border-primary"
                    : "text-muted-foreground hover:bg-white/30"
                }`}
              >
                <span className="whitespace-nowrap">{s.label}</span>
                <span className="ml-1 inline-flex items-center justify-center min-w-[26px] px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                  {counts[countKey] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
  {orders.map((o: Order) => (
          <Card key={o.id}>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Order #{o.id}</CardTitle>
                <div className="text-xs text-muted-foreground">
                  {o.items?.length || 0} item
                  {(o.items?.length || 0) !== 1 ? "s" : ""}
                </div>
              </div>

              <div className="text-right flex flex-col items-end space-y-1">
                <Badge className={`${statusColor[o.status] ?? "bg-gray-200"}`}>
                  {o.status}
                </Badge>
                <div className="font-semibold">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  }).format(Number(o.grandTotal ?? 0))}
                </div>
                <div className="text-xs text-muted-foreground">
                  {o.createdAt ? new Date(o.createdAt).toLocaleString() : "-"}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex justify-end">
                <Link
                  href={`/orders/${o.id}`}
                  className="text-sm text-primary underline"
                >
                  View details
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Pagination controls */}
      <div className="mt-6 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <button
            className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </button>
          <button
            className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={page * pageSize >= total}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </button>
        </div>
        <div className="text-sm text-gray-700">
          Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} results
        </div>
      </div>
    </div>
  );
}
