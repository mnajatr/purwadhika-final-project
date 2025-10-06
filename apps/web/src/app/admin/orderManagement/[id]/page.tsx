"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Sidebar from "@/components/admin/sidebar";
import { adminOrdersService } from "@/services/adminOrders.service";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import OrderDetailHeader from "@/components/admin/orders/detail/OrderDetailHeader";
import OrderDetailSummary from "@/components/admin/orders/detail/OrderDetailSummary";
import OrderDetailItems from "@/components/admin/orders/detail/OrderDetailItems";
import OrderDetailPayment from "@/components/admin/orders/detail/OrderDetailPayment";
import OrderDetailTotal from "@/components/admin/orders/detail/OrderDetailTotal";
import { XCircle, X } from "lucide-react";
import type { AdminOrderDetail } from "@repo/schemas";
import { toast } from "sonner";

type ConfirmDialogState = {
  open: boolean;
  action: "confirm" | "ship" | "cancel" | null;
  title: string;
  description: string;
  variant: "default" | "destructive" | "warning";
};

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params.id as string;

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState<Record<string, boolean>>(
    {}
  );
  const [isImageZoomed, setIsImageZoomed] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState>({
    open: false,
    action: null,
    title: "",
    description: "",
    variant: "default",
  });

  const fetchOrderDetail = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await adminOrdersService.getOrderById(Number(orderId));
      setOrder(data);
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
      if (e.key === "Escape") {
        setIsImageZoomed(false);
      }
    };

    if (isImageZoomed) {
      window.addEventListener("keydown", handleEscape);
      return () => window.removeEventListener("keydown", handleEscape);
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

    setConfirmDialog({
      open: false,
      action: null,
      title: "",
      description: "",
      variant: "default",
    });
    setActionLoading((prev) => ({ ...prev, [action]: true }));

    try {
      await adminOrdersService.updateOrderStatus(order.id, action);
      toast.success(
        `Order #${order.id} ${actionNames[action]}ed successfully!`
      );
      await fetchOrderDetail(); // Refresh the order details
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "An error occurred";
      toast.error(`Failed to ${actionNames[action]} order: ${message}`);
    } finally {
      setActionLoading((prev) => ({ ...prev, [action]: false }));
    }
  };

  const canConfirmPayment = (order: AdminOrderDetail) => {
    return (
      order.status === "PAYMENT_REVIEW" && order.payment?.status === "PENDING"
    );
  };

  const canShip = (order: AdminOrderDetail) => {
    return order.status === "PROCESSING";
  };

  const canCancel = (order: AdminOrderDetail) => {
    return ["PENDING_PAYMENT", "PAYMENT_REVIEW", "PROCESSING"].includes(
      order.status
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-muted/20">
        <aside className="w-48 bg-sidebar border-r border-sidebar-border p-4 space-y-4 sticky top-0 h-screen">
          <Sidebar />
        </aside>
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center space-y-4">
            <div className="relative inline-flex">
              <div className="w-16 h-16 border-4 border-primary/30 border-t-primary rounded-full animate-spin"></div>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-8 h-8 bg-primary/20 rounded-full animate-pulse"></div>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-lg font-medium text-foreground">
                Loading order details
              </p>
              <p className="text-sm text-muted-foreground">
                Please wait while we fetch the information...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-muted/20">
        <aside className="w-48 bg-sidebar border-r border-sidebar-border p-4 space-y-4 sticky top-0 h-screen">
          <Sidebar />
        </aside>
        <div className="flex-1 p-8 flex items-center justify-center">
          <div className="text-center max-w-md">
            <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-destructive/10">
              <XCircle className="w-12 h-12 text-destructive" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">
              Order Not Found
            </h2>
            <p className="text-muted-foreground mb-6">
              {error ||
                "The order you're looking for doesn't exist or has been removed."}
            </p>
            <button
              onClick={() => router.back()}
              className="px-6 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium shadow-sm hover:shadow-md"
            >
              Go Back to Orders
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-background via-background to-muted/20">
      <aside className="w-48 bg-gray-800 text-white p-4 space-y-4 sticky top-0 h-screen">
        <Sidebar />
      </aside>

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <OrderDetailHeader
            orderId={order.id}
            status={order.status}
            createdAt={order.createdAt}
            canConfirmPayment={canConfirmPayment(order)}
            canShip={canShip(order)}
            canCancel={canCancel(order)}
            actionLoading={actionLoading}
            onBack={() => router.back()}
            onConfirmPayment={() => handleOrderAction("confirm")}
            onShipOrder={() => handleOrderAction("ship")}
            onCancelOrder={() => handleOrderAction("cancel")}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <OrderDetailSummary
                userId={order.userId}
                storeId={order.storeId}
                paymentMethod={order.paymentMethod}
                createdAt={order.createdAt}
                updatedAt={order.updatedAt}
              />

              <OrderDetailItems
                items={order.items}
                totalItems={order.totalItems}
              />
            </div>

            <div className="space-y-6">
              {order.payment && (
                <OrderDetailPayment
                  payment={order.payment}
                  onImageClick={() => setIsImageZoomed(true)}
                />
              )}

              <OrderDetailTotal
                subtotalAmount={order.subtotalAmount}
                shippingCost={order.shippingCost}
                discountTotal={order.discountTotal}
                grandTotal={order.grandTotal}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Image Zoom Modal */}
      {isImageZoomed && order?.payment?.proofImageUrl && (
        <div
          className="fixed inset-0 bg-black/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setIsImageZoomed(false)}
        >
          <button
            className="absolute top-4 right-4 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition-all hover:scale-110"
            onClick={() => setIsImageZoomed(false)}
            aria-label="Close image"
          >
            <X className="w-6 h-6" />
          </button>
          <div
            className="max-w-7xl max-h-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute -top-12 left-0 text-white text-sm opacity-75">
              Press ESC or click outside to close
            </div>
            <Image
              src={order.payment.proofImageUrl}
              alt="Payment Proof - Full Size"
              width={1200}
              height={800}
              className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
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
          setConfirmDialog({
            open: false,
            action: null,
            title: "",
            description: "",
            variant: "default",
          })
        }
        confirmLabel="Confirm"
        cancelLabel="Cancel"
        variant={confirmDialog.variant}
      />
    </div>
  );
}
