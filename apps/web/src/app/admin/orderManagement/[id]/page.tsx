"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Sidebar from "@/components/admin/sidebar";
import { adminOrdersService as ordersService } from "@/services/adminOrders.service";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import {
  ArrowLeft,
  Package,
  User,
  Store,
  Calendar,
  CreditCard,
  Truck,
  CheckCircle2,
  XCircle,
  Clock,
  FileText,
  DollarSign,
  Tag,
  ShoppingCart,
  Receipt,
  Eye,
  X,
  ZoomIn,
} from "lucide-react";

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
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "confirm" | "ship" | "cancel" | null;
    title: string;
    description: string;
    variant: "default" | "destructive" | "warning";
  }>({
    open: false,
    action: null,
    title: "",
    description: "",
    variant: "default",
  });

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

  // Close modal on ESC key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsImageZoomed(false);
      }
    };
    
    if (isImageZoomed) {
      window.addEventListener('keydown', handleEscape);
      return () => window.removeEventListener('keydown', handleEscape);
    }
  }, [isImageZoomed]);

  const handleOrderAction = async (action: "confirm" | "ship" | "cancel") => {
    if (!order) return;

    const actionNames = {
      confirm: "Confirm Payment",
      ship: "Ship Order",
      cancel: "Cancel Order",
    };

    const actionDescriptions = {
      confirm: `This will mark the payment as confirmed for order #${order.id}. The order will move to processing status.`,
      ship: `This will mark order #${order.id} as shipped. The customer will be notified.`,
      cancel: `This will cancel order #${order.id}. This action cannot be undone.`,
    };

    const actionVariants = {
      confirm: "default" as const,
      ship: "default" as const,
      cancel: "destructive" as const,
    };

    setConfirmDialog({
      open: true,
      action,
      title: actionNames[action],
      description: actionDescriptions[action],
      variant: actionVariants[action],
    });
  };

  const executeOrderAction = async () => {
    if (!order || !confirmDialog.action) return;

    const action = confirmDialog.action;
    const actionNames = {
      confirm: "confirm payment",
      ship: "ship",
      cancel: "cancel",
    };

    setConfirmDialog({ open: false, action: null, title: "", description: "", variant: "default" });
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
        return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20";
      case "PROCESSING":
        return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20";
      case "PAYMENT_REVIEW":
        return "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20";
      case "CONFIRMED":
        return "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20";
      case "SHIPPED":
        return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20";
      case "DELIVERED":
        return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border border-gray-500/20";
      case "CANCELLED":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20";
      default:
        return "bg-muted text-muted-foreground border border-border";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return <Clock className="w-4 h-4" />;
      case "PROCESSING":
        return <Package className="w-4 h-4" />;
      case "PAYMENT_REVIEW":
        return <Eye className="w-4 h-4" />;
      case "CONFIRMED":
        return <CheckCircle2 className="w-4 h-4" />;
      case "SHIPPED":
        return <Truck className="w-4 h-4" />;
      case "DELIVERED":
        return <CheckCircle2 className="w-4 h-4" />;
      case "CANCELLED":
        return <XCircle className="w-4 h-4" />;
      default:
        return <FileText className="w-4 h-4" />;
    }
  };

  const canConfirmPayment = (order: OrderDetail) => {
    return (
      order.status === "PAYMENT_REVIEW" && order.payment?.status === "PENDING"
    );
  };

  const canShip = (order: OrderDetail) => {
    // Ship allowed when order is processing (payment accepted by admin)
    return order.status === "PROCESSING";
  };

  const canCancel = (order: OrderDetail) => {
    // Admin may cancel before shipped/confirmed. Allow cancelling when
    // pending payment, under review, or processing.
    return ["PENDING_PAYMENT", "PAYMENT_REVIEW", "PROCESSING"].includes(
      order.status
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-background">
        <aside className="w-48 bg-sidebar border-r border-sidebar-border p-4 space-y-4 sticky top-0 h-screen">
          <Sidebar />
        </aside>
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
            <p className="text-muted-foreground">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex bg-background">
        <aside className="w-48 bg-sidebar border-r border-sidebar-border p-4 space-y-4 sticky top-0 h-screen">
          <Sidebar />
        </aside>
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center">
            <div className="mb-4">
              <XCircle className="w-16 h-16 text-destructive mx-auto mb-4" />
              <p className="text-destructive text-lg font-semibold">
                {error || "Order not found"}
              </p>
            </div>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-background">
      <aside className="w-48 bg-gray-800 text-white p-4 space-y-4 sticky top-0 h-screen">
        <Sidebar />
      </aside>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => router.back()}
              className="flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors group"
            >
              <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
              Back to Orders
            </button>
            
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-3xl font-bold text-foreground">Order #{order.id}</h1>
                  <span
                    className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeColor(
                      order.status
                    )}`}
                  >
                    {getStatusIcon(order.status)}
                    {order.status.replace(/_/g, " ")}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Created {new Date(order.createdAt).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>

              <div className="flex items-center gap-3">
                {canConfirmPayment(order) && (
                  <button
                    onClick={() => handleOrderAction("confirm")}
                    disabled={actionLoading.confirm}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {actionLoading.confirm ? "Processing..." : "Confirm Payment"}
                  </button>
                )}
                {canShip(order) && (
                  <button
                    onClick={() => handleOrderAction("ship")}
                    disabled={actionLoading.ship}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <Truck className="w-4 h-4" />
                    {actionLoading.ship ? "Processing..." : "Ship Order"}
                  </button>
                )}
                {canCancel(order) && (
                  <button
                    onClick={() => handleOrderAction("cancel")}
                    disabled={actionLoading.cancel}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors flex items-center gap-2"
                  >
                    <XCircle className="w-4 h-4" />
                    {actionLoading.cancel ? "Processing..." : "Cancel Order"}
                  </button>
                )}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column - Order Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Order Summary Card */}
              <div className="bg-card border border-border rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <Receipt className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Order Summary</h2>
                </div>
                
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <User className="w-4 h-4" />
                      <span>Customer</span>
                    </div>
                    <p className="font-medium text-foreground">User #{order.userId}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Store className="w-4 h-4" />
                      <span>Store</span>
                    </div>
                    <p className="font-medium text-foreground">Store #{order.storeId}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <CreditCard className="w-4 h-4" />
                      <span>Payment Method</span>
                    </div>
                    <p className="font-medium text-foreground uppercase">{order.paymentMethod}</p>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Calendar className="w-4 h-4" />
                      <span>Order Date</span>
                    </div>
                    <p className="font-medium text-foreground">
                      {new Date(order.createdAt).toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      })}
                    </p>
                  </div>

                  <div className="space-y-1 col-span-2">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm">
                      <Clock className="w-4 h-4" />
                      <span>Last Updated</span>
                    </div>
                    <p className="font-medium text-foreground">
                      {new Date(order.updatedAt).toLocaleString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Order Items Card */}
              <div className="bg-card border border-border rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <ShoppingCart className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Order Items</h2>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {order.totalItems} {order.totalItems === 1 ? "item" : "items"}
                  </span>
                </div>
                
                <div className="space-y-4">
                  {order.items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-start justify-between py-4 ${
                        index !== order.items.length - 1 ? "border-b border-border" : ""
                      }`}
                    >
                      <div className="flex-1">
                        <h3 className="font-semibold text-foreground mb-1">{item.product.name}</h3>
                        <p className="text-sm text-muted-foreground mb-2">
                          Product ID: #{item.productId}
                        </p>
                        <div className="flex items-center gap-4 text-sm">
                          <span className="text-muted-foreground">
                            Unit Price: <span className="text-foreground font-medium">Rp {Number(item.unitPriceSnapshot).toLocaleString()}</span>
                          </span>
                          <span className="text-muted-foreground">
                            Quantity: <span className="text-foreground font-medium">{item.qty}</span>
                          </span>
                        </div>
                      </div>
                      <div className="text-right ml-4">
                        <p className="text-sm text-muted-foreground mb-1">Subtotal</p>
                        <p className="font-semibold text-foreground">
                          Rp {item.totalAmount.toLocaleString()}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column - Payment & Total */}
            <div className="space-y-6">
              {/* Payment Information Card */}
              {order.payment && (
                <div className="bg-card border border-border rounded-xl shadow-sm p-6">
                  <div className="flex items-center gap-2 mb-6">
                    <CreditCard className="w-5 h-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Payment Details</h2>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Payment ID</span>
                      <span className="font-medium text-foreground">#{order.payment.id}</span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Status</span>
                      <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
                        {order.payment.status}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center py-2">
                      <span className="text-sm text-muted-foreground">Amount</span>
                      <span className="font-semibold text-foreground">
                        Rp {order.payment.amount.toLocaleString()}
                      </span>
                    </div>
                    
                    <div className="border-t border-border pt-4">
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Created</span>
                          <span className="text-foreground">
                            {new Date(order.payment.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {order.payment.reviewedAt && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Reviewed</span>
                            <span className="text-foreground">
                              {new Date(order.payment.reviewedAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                        {order.payment.paidAt && (
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Paid</span>
                            <span className="text-foreground">
                              {new Date(order.payment.paidAt).toLocaleDateString()}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Payment Proof Image */}
                  {order.payment.proofImageUrl && (
                    <div className="mt-6">
                      <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
                        <FileText className="w-4 h-4" />
                        Payment Proof
                      </h3>
                      <div 
                        className="border border-border rounded-lg overflow-hidden bg-muted/20 cursor-pointer hover:border-primary transition-colors group relative"
                        onClick={() => setIsImageZoomed(true)}
                      >
                        <Image
                          src={order.payment.proofImageUrl}
                          alt="Payment Proof"
                          width={400}
                          height={256}
                          className="w-full max-h-64 object-contain"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                          <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Order Total Card */}
              <div className="bg-card border border-border rounded-xl shadow-sm p-6">
                <div className="flex items-center gap-2 mb-6">
                  <DollarSign className="w-5 h-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">Order Total</h2>
                </div>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Subtotal</span>
                    <span className="text-foreground">Rp {order.subtotalAmount.toLocaleString()}</span>
                  </div>
                  
                  <div className="flex justify-between items-center py-2">
                    <div className="flex items-center gap-1.5">
                      <Truck className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">Shipping</span>
                    </div>
                    <span className="text-foreground">Rp {order.shippingCost.toLocaleString()}</span>
                  </div>
                  
                  {order.discountTotal > 0 && (
                    <div className="flex justify-between items-center py-2">
                      <div className="flex items-center gap-1.5">
                        <Tag className="w-4 h-4 text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Discount</span>
                      </div>
                      <span className="text-red-600">
                        -Rp {order.discountTotal.toLocaleString()}
                      </span>
                    </div>
                  )}
                  
                  <div className="border-t border-border pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <span className="text-base font-semibold text-foreground">Grand Total</span>
                      <span className="text-xl font-bold text-primary">
                        Rp {order.grandTotal.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {isImageZoomed && order?.payment?.proofImageUrl && (
        <div 
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setIsImageZoomed(false)}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={() => setIsImageZoomed(false)}
          >
            <X className="w-8 h-8" />
          </button>
          <div className="max-w-7xl max-h-full" onClick={(e) => e.stopPropagation()}>
            <Image
              src={order.payment.proofImageUrl}
              alt="Payment Proof - Full Size"
              width={1200}
              height={800}
              className="max-w-full max-h-[90vh] object-contain"
            />
          </div>
        </div>
      )}

      {/* Confirm Dialog */}
      <ConfirmDialog
        open={confirmDialog.open}
        title={confirmDialog.title}
        description={confirmDialog.description}
        onConfirm={executeOrderAction}
        onCancel={() =>
          setConfirmDialog({ open: false, action: null, title: "", description: "", variant: "default" })
        }
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        variant={confirmDialog.variant}
      />
    </div>
  );
}
