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
  items?: { id: number; quantity: number }[];
  orderDetails?: {
    quantity: number;
    product: {
      name: string;
    };
  }[];
}

// Simple fetch function
async function fetchOrders(filters: { status?: string; q?: string; date?: string } = {}) {
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
  console.log('Fetching orders from:', url);
  
  const response = await fetch(url, {
    headers: {
      "x-dev-user-id": "4",
      "Content-Type": "application/json"
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const data = await response.json();
  console.log('API Response:', data);
  
  if (data.success && data.data) {
    return data.data.items || [];
  }
  
  return [];
}

// Fetch counts function
async function fetchOrderCounts() {
  const url = `http://localhost:8000/api/orders/counts`;
  console.log('Fetching counts from:', url);
  
  const response = await fetch(url, {
    headers: {
      "x-dev-user-id": "4",
      "Content-Type": "application/json"
    }
  });
  
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}`);
  }
  
  const data = await response.json();
  console.log('Counts response:', data);
  return data.data || {};
}

export default function OrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [counts, setCounts] = React.useState<Record<string, number>>({});
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  
  const [q, setQ] = React.useState<string | null>(null);
  const [date, setDate] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  
  const [searchTimeoutId, setSearchTimeoutId] = React.useState<NodeJS.Timeout | null>(null);

  // Load orders when filters change
  React.useEffect(() => {
    const loadData = async () => {
      console.log('🔄 Loading data with filters:', { status, q, date, refreshKey });
      setIsLoading(true);
      setError(null);
      
      try {
        const filters: Record<string, string> = {};
        if (status) filters.status = status;
        if (q) filters.q = q;
        if (date) filters.date = date;
        
        console.log('📡 Fetching orders and counts...');
        const [ordersData, countsData] = await Promise.all([
          fetchOrders(filters),
          fetchOrderCounts()
        ]);
        
        console.log('✅ Orders loaded:', ordersData.length, 'orders');
        console.log('✅ Counts loaded:', countsData);
        setOrders(ordersData);
        setCounts(countsData);
      } catch (err) {
        console.error('❌ Error loading orders:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, [status, q, date, refreshKey]);

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
        <div className="text-xl font-semibold text-red-600">
          {error}
        </div>
        <p className="text-sm text-muted-foreground">Failed to load orders.</p>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="max-w-5xl mx-auto p-6 text-center">
        <div className="text-xl">No orders found</div>
        <p className="text-sm text-muted-foreground">
          You do not have any orders yet.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold tracking-tight mb-6">Your Orders</h1>

      <div className="flex flex-col md:flex-row md:items-center md:gap-4 mb-4">
        <div className="flex-1">
          <input
            value={q ?? ""}
            placeholder="Search by Order ID or Product Name"
            className="w-full border rounded-lg px-4 py-3 text-sm"
            onChange={(e) => {
              const value = e.target.value ? e.target.value : null;
              console.log('🔍 Search input changed:', value);
              setQ(value);
              
              // Clear existing timeout
              if (searchTimeoutId) {
                clearTimeout(searchTimeoutId);
              }
              
              // Set new timeout for debounced search
              const newTimeoutId = setTimeout(() => {
                console.log('⏰ Debounced search triggered for:', value);
                setRefreshKey(prev => prev + 1);
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
                setRefreshKey(prev => prev + 1);
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
              // Auto-trigger search when date changes
              setRefreshKey(prev => prev + 1);
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
                  console.log('🔘 Status button clicked:', s.key);
                  console.log('🔄 Setting status from', status, 'to', s.key);
                  setStatus(s.key);
                  // Force refetch immediately
                  setRefreshKey(prev => prev + 1);
                }}
                className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                  active
                    ? "bg-white shadow-md text-slate-900 border-b-2 border-primary"
                    : "text-muted-foreground hover:bg-white/30"
                }`}
              >
                <span className="whitespace-nowrap">
                  {s.label}
                </span>
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
                  {o.items?.length || 0} item{(o.items?.length || 0) !== 1 ? "s" : ""}
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
