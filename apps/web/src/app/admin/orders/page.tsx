"use client";

import Sidebar from "@/components/admin/sidebar";
import { useState, useEffect } from "react";
import { useOrders } from "@/hooks/useOrders";

type Order = {
  id: number;
  userId: number;
  storeId: number;
  status: string;
  grandTotal: number;
  totalItems: number;
  createdAt: string;
};

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const pageSize = 20;
  const { items, loading, error, reload, meta } = useOrders({ page, pageSize });
  const [devUserId, setDevUserId] = useState<string | null>(null);

  // read devUserId from localStorage on client (useEffect avoids setting state during render)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setDevUserId(localStorage.getItem("devUserId"));
    } catch {
      setDevUserId(null);
    }
  }, []);

  const isLikelyNonAdmin = devUserId === null || devUserId === "none" || devUserId === "4";

  return (
    <div className="flex min-h-screen">
      <aside className="w-48 bg-gray-800 text-white p-4 space-y-4 sticky top-0 h-screen">
        <Sidebar />
      </aside>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Orders</h1>
          <div>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded"
              onClick={() => reload()}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Debug panel (dev-only) */}
        <div className="mb-4 p-3 bg-gray-50 border rounded text-sm">
          <div className="flex items-center justify-between">
            <div>
              <strong>Dev user:</strong>{" "}{devUserId ?? "(none)"}
              <span className="ml-3 text-gray-600">(used for x-dev-user-id header)</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                className="px-2 py-1 bg-gray-200 rounded text-sm"
                onClick={() => {
                  try {
                    const v = typeof window !== "undefined" ? localStorage.getItem("devUserId") : null;
                    setDevUserId(v);
                  } catch {
                    setDevUserId(null);
                  }
                }}
              >
                Reload
              </button>
              <button
                className="px-2 py-1 bg-red-100 text-red-700 rounded text-sm"
                onClick={() => {
                  try {
                    if (typeof window !== "undefined") localStorage.removeItem("devUserId");
                  } catch {}
                  setDevUserId(null);
                }}
              >
                Clear
              </button>
            </div>
          </div>
          <div className="mt-2 text-sm text-gray-700">
            {isLikelyNonAdmin && (
              <div className="mb-2 text-sm text-yellow-700 bg-yellow-50 p-2 rounded">
                Dev user looks like a non-admin ({devUserId ?? "(none)"}). Select <strong>2</strong> or <strong>3</strong> in the Dev user switch (sidebar) so you can see admin orders for that store.
              </div>
            )}
            <strong>Last fetch:</strong> total {meta?.total ?? 0}, page {meta?.page ?? page}
            {loading && <span className="ml-2 text-gray-500">(loading...)</span>}
            {error && <span className="ml-2 text-red-600">(error: {error})</span>}
          </div>
        </div>

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="overflow-x-auto">
          {items.length === 0 && !loading ? (
            <p className="text-center text-gray-500 p-6">No orders found.</p>
          ) : (
            <table className="min-w-full bg-white">
            <thead>
              <tr>
                <th className="px-4 py-2">ID</th>
                <th className="px-4 py-2">Status</th>
                <th className="px-4 py-2">Store</th>
                <th className="px-4 py-2">Items</th>
                <th className="px-4 py-2">Total</th>
                <th className="px-4 py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {(items as unknown as Order[]).map((o) => (
                <tr key={o.id} className="border-t">
                  <td className="px-4 py-2">{o.id}</td>
                  <td className="px-4 py-2">{o.status}</td>
                  <td className="px-4 py-2">{o.storeId}</td>
                  <td className="px-4 py-2">{o.totalItems}</td>
                  <td className="px-4 py-2">{o.grandTotal}</td>
                  <td className="px-4 py-2">{new Date(o.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          )}
        </div>

        {/* Pagination */}
        <div className="mt-4 flex items-center justify-between">
          <div>
            <button
              className="px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <button
              className="ml-2 px-3 py-1 bg-gray-200 rounded disabled:opacity-50"
              disabled={page * pageSize >= (meta?.total ?? 0)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
          <div className="text-sm text-gray-600">Page {meta?.page ?? page} — {meta?.total ?? 0} orders</div>
        </div>
      </div>
    </div>
  );
}
