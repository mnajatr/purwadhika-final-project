"use client";

import React from "react";

export default function OrdersSimplePage() {
  const [orders, setOrders] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [currentStatus, setCurrentStatus] = React.useState("");

  const fetchOrders = async (status = "") => {
    setLoading(true);
    try {
      const url = status
        ? `http://localhost:8000/api/orders?status=${status}`
        : `http://localhost:8000/api/orders`;

      console.log("Fetching from:", url);

      const response = await fetch(url, {
        headers: {
          "x-dev-user-id": "4",
        },
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (data.success) {
        setOrders(data.data.items || []);
      }
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOrders();
  }, []);

  const handleStatusClick = (status: string) => {
    console.log("Status clicked:", status);
    setCurrentStatus(status);
    fetchOrders(status);
  };

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Orders - Simple Test</h1>

      <div className="mb-6">
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => handleStatusClick("")}
            className={`px-4 py-2 rounded ${
              currentStatus === "" ? "bg-blue-500 text-white" : "bg-gray-200"
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => handleStatusClick("PENDING_PAYMENT")}
            className={`px-4 py-2 rounded ${
              currentStatus === "PENDING_PAYMENT"
                ? "bg-blue-500 text-white"
                : "bg-gray-200"
            }`}
          >
            Pending Payment
          </button>
          <button
            onClick={() => handleStatusClick("PAYMENT_REVIEW")}
            className={`px-4 py-2 rounded ${
              currentStatus === "PAYMENT_REVIEW"
                ? "bg-blue-500 text-white"
                : "bg-gray-200"
            }`}
          >
            Payment Review
          </button>
          <button
            onClick={() => handleStatusClick("PROCESSING")}
            className={`px-4 py-2 rounded ${
              currentStatus === "PROCESSING"
                ? "bg-blue-500 text-white"
                : "bg-gray-200"
            }`}
          >
            Processing
          </button>
          <button
            onClick={() => handleStatusClick("CANCELLED")}
            className={`px-4 py-2 rounded ${
              currentStatus === "CANCELLED"
                ? "bg-blue-500 text-white"
                : "bg-gray-200"
            }`}
          >
            Cancelled
          </button>
        </div>
      </div>

      {loading && <div className="text-center py-4">Loading...</div>}

      <div className="space-y-4">
        {orders.map((order: any) => (
          <div key={order.id} className="border rounded p-4 bg-white shadow">
            <div className="flex justify-between">
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
              </div>
              <div>
                <span
                  className={`px-2 py-1 rounded text-xs ${
                    order.status === "PENDING_PAYMENT"
                      ? "bg-yellow-100 text-yellow-800"
                      : order.status === "PAYMENT_REVIEW"
                      ? "bg-blue-100 text-blue-800"
                      : order.status === "PROCESSING"
                      ? "bg-green-100 text-green-800"
                      : order.status === "CANCELLED"
                      ? "bg-red-100 text-red-800"
                      : "bg-gray-100 text-gray-800"
                  }`}
                >
                  {order.status}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {orders.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500">
          No orders found for status: {currentStatus || "All"}
        </div>
      )}
    </div>
  );
}
