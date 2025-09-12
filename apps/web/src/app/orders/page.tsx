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

// Simple fetch function
async function fetchOrders(
  filters: { status?: string; q?: string; date?: string } = {}
) {
  const params = new URLSearchParams();
  if (filters.status) params.append("status", filters.status);
  if (filters.q) params.append("q", filters.q);
  if (filters.date) {
    const selectedDate = new Date(filters.date);
    const dateFrom = new Date(selectedDate);
    dateFrom.setHours(0, 0, 0, 0);

    const dateTo = new Date(selectedDate);
    dateTo.setHours(23, 59, 59, 999);

    params.append("dateFrom", dateFrom.toISOString());
    params.append("dateTo", dateTo.toISOString());
  }

  const url = `http://localhost:8000/api/orders?${params.toString()}`;
  console.log("Fetching orders from:", url);

  const response = await fetch(url, {
    headers: {
      "x-dev-user-id": "4",
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }

  const data = await response.json();
  console.log("API Response:", data);

  if (data.success && data.data) {
    return data.data.items || [];
  }

  return [];
}

export default function OrdersPage() {
  const [allOrders, setAllOrders] = React.useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = React.useState<Order[]>([]);
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const [q, setQ] = React.useState<string | null>(null);
  const [date, setDate] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);

  const [searchTimeoutId, setSearchTimeoutId] =
    React.useState<NodeJS.Timeout | null>(null);

  // Load orders when filters change
  // Load all orders once at startup
  React.useEffect(() => {
    const loadAllOrders = async () => {
      console.log("🔄 Loading all orders (once)...");
      setIsLoading(true);
      setError(null);

      try {
        // Fetch all orders without filters
        const ordersData = await fetchOrders({});
        console.log("✅ All orders loaded:", ordersData.length, "orders");
        setAllOrders(ordersData);
      } catch (err) {
        console.error("❌ Error loading orders:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    };

    loadAllOrders();
  }, []); // Only run once

  // Filter orders and calculate counts whenever filters or data change
  React.useEffect(() => {
    console.log("🔍 Filtering orders with:", { status, q, date });

    let filtered = allOrders;

    // Filter by status
    if (status) {
      filtered = filtered.filter((order) => order.status === status);
      console.log(
        `📊 After status filter (${status}):`,
        filtered.length,
        "orders"
      );
    }

    // Filter by search query (order ID or product name)
    if (q) {
      const searchTerm = q.toLowerCase();
      filtered = filtered.filter((order) => {
        // Search in numeric order ID (convert to string for partial matching)
        const orderIdString = order.id.toString();
        if (orderIdString.includes(searchTerm)) return true;

        // Search in invoiceId if it exists
        if (order.invoiceId?.toLowerCase().includes(searchTerm)) return true;

        // Search in product names
        const hasMatchingProduct = order.items?.some((item) =>
          item.product?.name?.toLowerCase().includes(searchTerm)
        );

        return hasMatchingProduct;
      });
      console.log(`🔍 After search filter (${q}):`, filtered.length, "orders");
      console.log(
        "🔍 Search matched orders:",
        filtered.map((o) => ({ id: o.id, invoiceId: o.invoiceId }))
      );
    }

    // Filter by date
    if (date) {
      const selectedDate = new Date(date);
      const dateFrom = new Date(selectedDate);
      dateFrom.setHours(0, 0, 0, 0);

      const dateTo = new Date(selectedDate);
      dateTo.setHours(23, 59, 59, 999);

      filtered = filtered.filter((order) => {
        const orderDate = new Date(order.createdAt);
        return orderDate >= dateFrom && orderDate <= dateTo;
      });
      console.log(`📅 After date filter (${date}):`, filtered.length, "orders");
    }

    setFilteredOrders(filtered);

    // Calculate counts from all orders
    const newCounts: Record<string, number> = {
      ALL: allOrders.length,
      PENDING_PAYMENT: 0,
      PAYMENT_REVIEW: 0,
      PROCESSING: 0,
      SHIPPED: 0,
      CONFIRMED: 0,
      CANCELLED: 0,
    };

    for (const order of allOrders) {
      if (newCounts[order.status] !== undefined) {
        newCounts[order.status]++;
      }
    }

    setCounts(newCounts);
    console.log("📊 Counts calculated:", newCounts);
  }, [allOrders, status, q, date]);

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
  const hasActiveFilters = status || q || date;
  const isFiltered = hasActiveFilters;
  const showingFilteredResults = isFiltered && filteredOrders.length > 0;
  const noResultsForFilter = isFiltered && filteredOrders.length === 0;

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

  if (!filteredOrders || filteredOrders.length === 0) {
    if (noResultsForFilter) {
      // When filter is active but no results - show filter UI with clear options
      return (
        <div className="max-w-5xl mx-auto p-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>

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
              <span className="font-medium">{allOrders.length}</span> total
              orders available
            </p>
          </div>
        </div>
      );
    } else {
      // When no orders at all (initial state or real empty)
      return (
        <div className="max-w-5xl mx-auto p-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders</h1>
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

      {/* Filter Status Indicator */}
      {hasActiveFilters && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center justify-between">
            <div className="text-sm text-blue-700">
              <span className="font-medium">
                Showing {filteredOrders.length} of {allOrders.length} orders
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
        {filteredOrders.map((o: Order) => (
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
    </div>
  );
}
