import React from "react";
import Link from "next/link";

// lightweight local type for display purposes
type OrderType = {
  id: number;
  status: string;
  grandTotal?: number;
  items: Array<{
    id: number;
    productId: number;
    qty: number;
    totalAmount?: number;
  }>;
  payment?: { status?: string; amount?: number } | null;
};

// allow one explicit any here because Next's generated PageProps type is strict
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function OrderPage(props: any): Promise<React.ReactNode> {
  // In next.js app router the `params` object may be a promise-like value
  // when used in server components. Await it before accessing properties
  // to avoid runtime errors like: "params should be awaited before using".
  const params = await props?.params;
  const id = Number(params?.id);

  // Server-side fetch must call the real API server. Prefer the public API
  // base (NEXT_PUBLIC_API_URL). If not set, derive from VERCEL_URL or fall
  // back to the local backend default (http://localhost:8000/api).
  // TODO: Prefer `NEXT_PUBLIC_API_URL` in production. The `VERCEL_URL` fallback
  // is temporary for Vercel deployments — replace it with a single explicit
  // `NEXT_PUBLIC_API_URL` (or environment-specific config) to avoid platform
  // specific logic.
  // Normalize so we always end up with a base that already includes `/api`.
  const rawApi =
    process.env.NEXT_PUBLIC_API_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`
      : undefined);
  const apiBase = rawApi
    ? (() => {
        const cleaned = rawApi.replace(/\/$/, "");
        return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;
      })()
    : "http://localhost:8000/api";

  const url = `${apiBase}/orders/${id}`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) {
    return <div className="max-w-4xl mx-auto p-6">Order not found</div>;
  }
  const data = await res.json();
  const order: OrderType | null = data?.data ?? null;

  if (!order)
    return <div className="max-w-4xl mx-auto p-6">Order not found</div>;

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-4">Order #{order.id}</h1>
      <div className="bg-white border rounded-lg p-4 mb-4">
        <div className="flex justify-between items-center">
          <div>
            <div className="text-sm text-muted-foreground">Status</div>
            <div className="font-medium">{order.status}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Total</div>
            <div className="font-bold">
              Rp {order.grandTotal?.toLocaleString()}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Items</h3>
          <ul className="space-y-2">
            {order.items.map((it) => (
              <li key={it.id} className="flex justify-between">
                <div>
                  <div className="font-medium">Product #{it.productId}</div>
                  <div className="text-sm text-muted-foreground">
                    Qty: {it.qty}
                  </div>
                </div>
                <div className="font-medium">
                  Rp {it.totalAmount?.toLocaleString()}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h3 className="font-semibold mb-2">Payment</h3>
          {order.payment ? (
            <div>
              <div className="text-sm">Status: {order.payment.status}</div>
              <div className="text-sm">
                Amount: Rp {order.payment.amount?.toLocaleString()}
              </div>
            </div>
          ) : (
            <div className="text-sm text-muted-foreground">
              No payment recorded
            </div>
          )}

          <div className="mt-4">
            <Link
              href="/orders"
              className="inline-block px-4 py-2 bg-gray-100 rounded"
            >
              Back
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
