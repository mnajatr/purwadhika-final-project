"use client";

import React from "react";

export default function OrdersDebugPage() {
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [search, setSearch] = React.useState("");

  const fetchOrders = async (filters: any = {}) => {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams();
      if (filters.status) params.append("status", filters.status);
      if (filters.q) params.append("q", filters.q);

      const url = `http://localhost:8000/api/orders?${params.toString()}`;
      console.log("Fetching:", url);

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
      console.log("Response:", data);

      if (data.success && data.data) {
        setOrders(data.data.items || []);
      } else {
        setError("Invalid response format");
      }
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOrders();
  }, []);

  const handleFilter = () => {
    const filters: any = {};
    if (status) filters.status = status;
    if (search) filters.q = search;
    fetchOrders(filters);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Orders Debug Page</h1>

      <div className="mb-4 space-y-4">
        <div className="flex gap-4">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="border rounded px-3 py-2"
          >
            <option value="">All Status</option>
            <option value="PENDING_PAYMENT">PENDING_PAYMENT</option>
            <option value="PAYMENT_REVIEW">PAYMENT_REVIEW</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by ID or product name"
            className="border rounded px-3 py-2 flex-1"
          />

          <button
            onClick={handleFilter}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Filter
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-4">Loading...</div>}

      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          Error: {error}
        </div>
      )}

      <div className="space-y-4">
        {orders.map((order: any) => (
          <div key={order.id} className="border rounded p-4 bg-white shadow">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="font-semibold">Order #{order.id}</h3>
                <p className="text-sm text-gray-600">Status: {order.status}</p>
                <p className="text-sm text-gray-600">
                  Total:{" "}
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    maximumFractionDigits: 0,
                  }).format(Number(order.grandTotal || 0))}
                </p>
                <p className="text-sm text-gray-600">
                  Created: {new Date(order.createdAt).toLocaleString()}
                </p>
              </div>
              <div className="text-right">
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    order.status === "PENDING_PAYMENT"
                      ? "bg-yellow-100 text-yellow-800"
                      : order.status === "PAYMENT_REVIEW"
                      ? "bg-blue-100 text-blue-800"
                      : order.status === "CANCELLED"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </div>

            <div className="mt-2">
              <p className="text-sm font-medium">Items:</p>
              <ul className="text-sm text-gray-600">
                {order.items?.map((item: any, idx: number) => (
                  <li key={idx}>
                    {item.product?.name || "Unknown Product"} x{item.qty}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && !loading && !error && (
        <div className="text-center py-8 text-gray-500">No orders found</div>
      )}
    </div>
  );
}
