"use client";

import * as React from "react";
import Link from "next/link";
import { useGetOrders, OrderDetail, OrdersFilter } from "../../hooks/useOrder";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from "../../components/ui/card";
import { Badge } from "../../components/ui/badge";

export default function OrdersPage() {
  const [q, setQ] = React.useState<string | null>(null);
  const [date, setDate] = React.useState<string | null>(null);
  const [status, setStatus] = React.useState<string | null>("PENDING_PAYMENT");
  // searchToken allows explicit refetch when user hits Enter
  const [searchToken, setSearchToken] = React.useState(0);

  // pass undefined instead of null/empty to omit params from request
  const filters: OrdersFilter = {
    q: q && q.length > 0 ? q : undefined,
    date: date && date.length > 0 ? date : undefined,
    status: status && status.length > 0 ? status : undefined,
  };

  const { data: orders, isLoading, error } = useGetOrders(filters, searchToken);
  // fetch unfiltered list to compute counters per status (client-side counts)
  const { data: allOrders } = useGetOrders(undefined, /* extraKey: */ 0);

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
      "PENDING_PAYMENT",
      "PAYMENT_REVIEW",
      "PROCESSING",
      "SHIPPED",
      "CONFIRMED",
      "CANCELLED",
    ],
    []
  );

  const counts = React.useMemo(() => {
    const map: Record<string, number> = {};
    statuses.forEach((s) => (map[s] = 0));
    if (!allOrders) return map;
    for (const o of allOrders) {
      const st = o?.status ?? "";
      if (map[st] !== undefined) map[st] = map[st] + 1;
    }
    return map;
  }, [allOrders, statuses]);

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
          {error.message}
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
            placeholder="Search by Order ID"
            className="w-full border rounded-lg px-4 py-3 text-sm"
            onChange={(e) => setQ(e.target.value ? e.target.value : null)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                // bump token to force refetch in case query key didn't change
                setSearchToken((s) => s + 1);
              }
            }}
          />
        </div>
        <div className="mt-3 md:mt-0">
          <input
            type="date"
            value={date ?? ""}
            className="border rounded-lg px-3 py-2 text-sm"
            onChange={(e) => setDate(e.target.value ? e.target.value : null)}
          />
        </div>
      </div>

      <div className="bg-muted/40 rounded-lg p-2 mb-4 overflow-auto">
        <div className="flex gap-2">
          {statuses.map((s) => {
            const active = status === s;
            return (
              <button
                key={s}
                onClick={() => setStatus(s)}
                className={`px-4 py-2 rounded-md text-sm flex items-center gap-2 transition-colors ${
                  active
                    ? "bg-white shadow-md text-slate-900 border-b-2 border-primary"
                    : "text-muted-foreground hover:bg-white/30"
                }`}
              >
                <span className="whitespace-nowrap">
                  {s.replace(/_/g, " ")}
                </span>
                <span className="ml-1 inline-flex items-center justify-center min-w-[26px] px-2 py-0.5 text-xs font-medium rounded-full bg-muted text-muted-foreground">
                  {counts[s] ?? 0}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
  {orders.map((o: OrderDetail & { createdAt?: string | Date | null }) => (
          <Card key={o.id}>
            <CardHeader className="flex items-center justify-between">
              <div>
                <CardTitle className="text-sm">Order #{o.id}</CardTitle>
                <div className="text-xs text-muted-foreground">
                  {o.items.length} item{o.items.length !== 1 ? "s" : ""}
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
