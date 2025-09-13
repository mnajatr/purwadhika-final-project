"use client";

import Sidebar from "@/components/admin/sidebar";
import { useState, useEffect } from "react";
import { useOrders } from "@/hooks/useOrders";
import { ordersService } from "@/services/orders.service";
import Link from "next/link";

type Order = {
  id: number;
  userId: number;
  storeId: number;
  status: string;
  grandTotal: number;
  totalItems: number;
  createdAt: string;
  paymentMethod: string;
  payment?: {
    id: number;
    status: string;
    proofImageUrl?: string;
    reviewedAt?: string;
  };
  items: Array<{
    id: number;
    productId: number;
    qty: number;
    totalAmount: number;
    product: {
      id: number;
      name: string;
      price: string;
    };
  }>;
};

export default function AdminOrdersPage() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const pageSize = 20;
  const { items, loading, error, reload, meta } = useOrders({
    page,
    pageSize,
    status: status || undefined,
    q: searchQuery || undefined,
  });
  const [devUserId, setDevUserId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {}
  );

  // read devUserId from localStorage on client (useEffect avoids setting state during render)
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      setDevUserId(localStorage.getItem("devUserId"));
    } catch {
      setDevUserId(null);
    }
  }, []);

  const isLikelyNonAdmin =
    devUserId === null || devUserId === "none" || devUserId === "4";

  const handleOrderAction = async (
    orderId: number,
    action: "confirm" | "ship" | "cancel"
  ) => {
    const actionKey = `${orderId}-${action}`;

    // Confirmation dialog
    const actionNames = {
      confirm: "confirm payment",
      ship: "ship",
      cancel: "cancel",
    };
    if (
      !window.confirm(
        `Are you sure you want to ${actionNames[action]} order #${orderId}?`
      )
    ) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [actionKey]: true }));

    try {
      await ordersService.updateOrderStatus(orderId, action);
      alert(`Order #${orderId} ${actionNames[action]}ed successfully!`);
      reload(); // Refresh the list
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      alert(`Failed to ${actionNames[action]} order: ${message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [actionKey]: false }));
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return "bg-yellow-100 text-yellow-800";
      case "PAYMENT_REVIEW":
        return "bg-blue-100 text-blue-800";
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "SHIPPED":
        return "bg-purple-100 text-purple-800";
      case "DELIVERED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const canConfirmPayment = (order: Order) => {
    return (
      order.status === "PAYMENT_REVIEW" && order.payment?.status === "PENDING"
    );
  };

  const canShip = (order: Order) => {
    return order.status === "CONFIRMED";
  };

  const canCancel = (order: Order) => {
    return ["PENDING_PAYMENT", "PAYMENT_REVIEW", "CONFIRMED"].includes(
      order.status
    );
  };

  return (
    <div className="flex min-h-screen">
      <aside className="w-48 bg-gray-800 text-white p-4 space-y-4 sticky top-0 h-screen">
        <Sidebar />
      </aside>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Order Management</h1>
          <div>
            <button
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              onClick={() => reload()}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="mb-6 bg-white p-4 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search by Order ID
              </label>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Enter order ID..."
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Status Filter
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm"
              >
                <option value="">All Statuses</option>
                <option value="PENDING_PAYMENT">Pending Payment</option>
                <option value="PAYMENT_REVIEW">Payment Review</option>
                <option value="CONFIRMED">Confirmed</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSearchQuery("");
                  setStatus("");
                  setPage(1);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Debug panel (dev-only) */}
        {process.env.NODE_ENV !== "production" && (
          <div className="mb-4 p-3 bg-gray-50 border rounded text-sm">
            <div className="flex items-center justify-between">
              <div>
                <strong>Dev user:</strong> {devUserId ?? "(none)"}
                <span className="ml-3 text-gray-600">
                  (used for x-dev-user-id header)
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  className="px-2 py-1 bg-gray-200 rounded text-sm"
                  onClick={() => {
                    try {
                      const v =
                        typeof window !== "undefined"
                          ? localStorage.getItem("devUserId")
                          : null;
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
                      if (typeof window !== "undefined")
                        localStorage.removeItem("devUserId");
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
                  Dev user looks like a non-admin ({devUserId ?? "(none)"}).
                  Select <strong>2</strong> or <strong>3</strong> in the Dev
                  user switch (sidebar) so you can see admin orders for that
                  store.
                </div>
              )}
              <strong>Last fetch:</strong> total {meta?.total ?? 0}, page{" "}
              {meta?.page ?? page}
              {loading && (
                <span className="ml-2 text-gray-500">(loading...)</span>
              )}
              {error && (
                <span className="ml-2 text-red-600">(error: {error})</span>
              )}
            </div>
          </div>
        )}

        {loading && <p>Loading...</p>}
        {error && <p className="text-red-600">{error}</p>}

        <div className="bg-white rounded-lg shadow">
          {items.length === 0 && !loading ? (
            <p className="text-center text-gray-500 p-6">No orders found.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Items
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {(items as unknown as Order[]).map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <Link
                            href={`/admin/orders/${order.id}`}
                            className="text-sm font-medium text-blue-600 hover:text-blue-900"
                          >
                            #{order.id}
                          </Link>
                          <div className="text-sm text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                            order.status
                          )}`}
                        >
                          {order.status.replace("_", " ")}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        User #{order.userId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.totalItems} items
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        Rp {order.grandTotal.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.paymentMethod}
                        </div>
                        {order.payment && (
                          <div className="text-xs text-gray-500">
                            Status: {order.payment.status}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium space-x-2">
                        {canConfirmPayment(order) && (
                          <button
                            onClick={() =>
                              handleOrderAction(order.id, "confirm")
                            }
                            disabled={actionLoading[`${order.id}-confirm`]}
                            className="text-green-600 hover:text-green-900 disabled:opacity-50"
                          >
                            {actionLoading[`${order.id}-confirm`]
                              ? "Processing..."
                              : "Confirm Payment"}
                          </button>
                        )}
                        {canShip(order) && (
                          <button
                            onClick={() => handleOrderAction(order.id, "ship")}
                            disabled={actionLoading[`${order.id}-ship`]}
                            className="text-blue-600 hover:text-blue-900 disabled:opacity-50"
                          >
                            {actionLoading[`${order.id}-ship`]
                              ? "Processing..."
                              : "Ship Order"}
                          </button>
                        )}
                        {canCancel(order) && (
                          <button
                            onClick={() =>
                              handleOrderAction(order.id, "cancel")
                            }
                            disabled={actionLoading[`${order.id}-cancel`]}
                            className="text-red-600 hover:text-red-900 disabled:opacity-50"
                          >
                            {actionLoading[`${order.id}-cancel`]
                              ? "Processing..."
                              : "Cancel"}
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
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
              disabled={page * pageSize >= (meta?.total ?? 0)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
          <div className="text-sm text-gray-700">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, meta?.total ?? 0)} of {meta?.total ?? 0}{" "}
            results
          </div>
        </div>
      </div>
    </div>
  );
}
