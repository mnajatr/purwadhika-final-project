"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Sidebar from "@/components/admin/sidebar";
import { ordersService } from "@/services/orders.service";

type OrderDetail = {
  id: number;
  userId: number;
  storeId: number;
  status: string;
  paymentMethod: string;
  subtotalAmount: number;
  shippingCost: number;
  discountTotal: number;
  grandTotal: number;
  totalItems: number;
  createdAt: string;
  updatedAt: string;
  payment?: {
    id: number;
    status: string;
    amount: number;
    proofImageUrl?: string;
    reviewedAt?: string;
    paidAt?: string;
    createdAt: string;
  };
  items: Array<{
    id: number;
    productId: number;
    qty: number;
    unitPriceSnapshot: string;
    totalAmount: number;
    product: {
      id: number;
      name: string;
      price: string;
    };
  }>;
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {}
  );

  const fetchOrderDetail = useCallback(async () => {
    try {
      setLoading(true);
      const data = await ordersService.getOrderById(Number(orderId));
      setOrder(data as OrderDetail);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Failed to fetch order details";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [orderId]);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId, fetchOrderDetail]);

  const handleOrderAction = async (action: "confirm" | "ship" | "cancel") => {
    if (!order) return;

    const actionNames = {
      confirm: "confirm payment",
      ship: "ship",
      cancel: "cancel",
    };
    if (
      !window.confirm(
        `Are you sure you want to ${actionNames[action]} order #${order.id}?`
      )
    ) {
      return;
    }

    setActionLoading((prev) => ({ ...prev, [action]: true }));

    try {
      await ordersService.updateOrderStatus(order.id, action);
      alert(`Order #${order.id} ${actionNames[action]}ed successfully!`);
      await fetchOrderDetail(); // Refresh the order details
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      alert(`Failed to ${actionNames[action]} order: ${message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [action]: false }));
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

  const canConfirmPayment = (order: OrderDetail) => {
    return (
      order.status === "PAYMENT_REVIEW" && order.payment?.status === "PENDING"
    );
  };

  const canShip = (order: OrderDetail) => {
    return order.status === "CONFIRMED";
  };

  const canCancel = (order: OrderDetail) => {
    return ["PENDING_PAYMENT", "PAYMENT_REVIEW", "CONFIRMED"].includes(
      order.status
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen">
        <aside className="w-48 bg-gray-800 text-white p-4 space-y-4 sticky top-0 h-screen">
          <Sidebar />
        </aside>
        <div className="flex-1 p-8">
          <div className="text-center">Loading order details...</div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex min-h-screen">
        <aside className="w-48 bg-gray-800 text-white p-4 space-y-4 sticky top-0 h-screen">
          <Sidebar />
        </aside>
        <div className="flex-1 p-8">
          <div className="text-center text-red-600">
            {error || "Order not found"}
          </div>
          <div className="text-center mt-4">
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen">
      <aside className="w-48 bg-gray-800 text-white p-4 space-y-4 sticky top-0 h-screen">
        <Sidebar />
      </aside>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <button
              onClick={() => router.back()}
              className="text-gray-500 hover:text-gray-700 mb-2"
            >
              ← Back to Orders
            </button>
            <h1 className="text-2xl font-semibold">Order #{order.id}</h1>
          </div>
          <div className="flex items-center space-x-3">
            {canConfirmPayment(order) && (
              <button
                onClick={() => handleOrderAction("confirm")}
                disabled={actionLoading.confirm}
                className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                {actionLoading.confirm ? "Processing..." : "Confirm Payment"}
              </button>
            )}
            {canShip(order) && (
              <button
                onClick={() => handleOrderAction("ship")}
                disabled={actionLoading.ship}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {actionLoading.ship ? "Processing..." : "Ship Order"}
              </button>
            )}
            {canCancel(order) && (
              <button
                onClick={() => handleOrderAction("cancel")}
                disabled={actionLoading.cancel}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading.cancel ? "Processing..." : "Cancel Order"}
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Order Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Status:</span>
                  <div className="mt-1">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(
                        order.status
                      )}`}
                    >
                      {order.status.replace("_", " ")}
                    </span>
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Customer:</span>
                  <div className="font-medium">User #{order.userId}</div>
                </div>
                <div>
                  <span className="text-gray-600">Store:</span>
                  <div className="font-medium">Store #{order.storeId}</div>
                </div>
                <div>
                  <span className="text-gray-600">Payment Method:</span>
                  <div className="font-medium">{order.paymentMethod}</div>
                </div>
                <div>
                  <span className="text-gray-600">Created:</span>
                  <div className="font-medium">
                    {new Date(order.createdAt).toLocaleString()}
                  </div>
                </div>
                <div>
                  <span className="text-gray-600">Last Updated:</span>
                  <div className="font-medium">
                    {new Date(order.updatedAt).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Order Items</h2>
              <div className="space-y-4">
                {order.items.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between py-3 border-b last:border-b-0"
                  >
                    <div className="flex-1">
                      <h3 className="font-medium">{item.product.name}</h3>
                      <p className="text-sm text-gray-600">
                        Product #{item.productId}
                      </p>
                      <p className="text-sm text-gray-600">
                        Unit Price: Rp{" "}
                        {Number(item.unitPriceSnapshot).toLocaleString()}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="font-medium">Qty: {item.qty}</div>
                      <div className="text-sm text-gray-600">
                        Total: Rp {item.totalAmount.toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Payment & Total */}
          <div className="space-y-6">
            {/* Payment Information */}
            {order.payment && (
              <div className="bg-white rounded-lg shadow p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Payment Information
                </h2>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Payment ID:</span>
                    <span className="font-medium">#{order.payment.id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Status:</span>
                    <span className="font-medium">{order.payment.status}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Amount:</span>
                    <span className="font-medium">
                      Rp {order.payment.amount.toLocaleString()}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {new Date(order.payment.createdAt).toLocaleString()}
                    </span>
                  </div>
                  {order.payment.reviewedAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Reviewed:</span>
                      <span className="font-medium">
                        {new Date(order.payment.reviewedAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                  {order.payment.paidAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Paid:</span>
                      <span className="font-medium">
                        {new Date(order.payment.paidAt).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>

                {/* Payment Proof */}
                {order.payment.proofImageUrl && (
                  <div className="mt-4">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">
                      Payment Proof:
                    </h3>
                    <div className="border rounded-lg overflow-hidden">
                      <Image
                        src={order.payment.proofImageUrl}
                        alt="Payment Proof"
                        width={400}
                        height={256}
                        className="w-full max-h-64 object-contain bg-gray-50"
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Order Total */}
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold mb-4">Order Total</h2>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Subtotal:</span>
                  <span>Rp {order.subtotalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping:</span>
                  <span>Rp {order.shippingCost.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span>Discount:</span>
                  <span className="text-red-600">
                    -Rp {order.discountTotal.toLocaleString()}
                  </span>
                </div>
                <div className="border-t pt-2 flex justify-between font-semibold text-lg">
                  <span>Total:</span>
                  <span>Rp {order.grandTotal.toLocaleString()}</span>
                </div>
                <div className="text-gray-600">
                  <span>Total Items: {order.totalItems}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
