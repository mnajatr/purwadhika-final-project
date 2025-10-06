import {
  ArrowLeft,
  CheckCircle2,
  Truck,
  XCircle,
  Clock,
  Package,
  Eye,
  FileText,
} from "lucide-react";
import { getOrderStatusBadgeColor } from "@/utils/orderStatus";

interface OrderDetailHeaderProps {
  orderId: number;
  status: string;
  createdAt: string;
  canConfirmPayment: boolean;
  canShip: boolean;
  canCancel: boolean;
  actionLoading: Record<string, boolean>;
  onBack: () => void;
  onConfirmPayment: () => void;
  onShipOrder: () => void;
  onCancelOrder: () => void;
}

export default function OrderDetailHeader({
  orderId,
  status,
  createdAt,
  canConfirmPayment,
  canShip,
  canCancel,
  actionLoading,
  onBack,
  onConfirmPayment,
  onShipOrder,
  onCancelOrder,
}: OrderDetailHeaderProps) {
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

  return (
    <div className="mb-8">
      <button
        onClick={onBack}
        className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-all group px-3 py-2 rounded-lg hover:bg-muted/50"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
        <span className="font-medium">Back to Orders</span>
      </button>

      <div className="bg-card border border-border rounded-2xl shadow-sm p-6">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-3">
            <div className="flex items-center gap-3 flex-wrap">
              <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Order #{orderId}
              </h1>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full transition-all ${getOrderStatusBadgeColor(
                  status
                )}`}
              >
                {getStatusIcon(status)}
                <span>{status.replace(/_/g, " ")}</span>
              </span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>
                Created on{" "}
                {new Date(createdAt).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {canConfirmPayment && (
              <button
                onClick={onConfirmPayment}
                disabled={actionLoading.confirm}
                className="px-5 py-2.5 bg-gradient-to-r from-green-600 to-green-500 text-white rounded-lg hover:from-green-700 hover:to-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium shadow-lg shadow-green-500/20 hover:shadow-xl hover:shadow-green-500/30 hover:scale-105"
              >
                <CheckCircle2 className="w-4 h-4" />
                {actionLoading.confirm ? "Processing..." : "Confirm Payment"}
              </button>
            )}
            {canShip && (
              <button
                onClick={onShipOrder}
                disabled={actionLoading.ship}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-blue-500 text-white rounded-lg hover:from-blue-700 hover:to-blue-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium shadow-lg shadow-blue-500/20 hover:shadow-xl hover:shadow-blue-500/30 hover:scale-105"
              >
                <Truck className="w-4 h-4" />
                {actionLoading.ship ? "Processing..." : "Ship Order"}
              </button>
            )}
            {canCancel && (
              <button
                onClick={onCancelOrder}
                disabled={actionLoading.cancel}
                className="px-5 py-2.5 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-lg hover:from-red-700 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-medium shadow-lg shadow-red-500/20 hover:shadow-xl hover:shadow-red-500/30 hover:scale-105"
              >
                <XCircle className="w-4 h-4" />
                {actionLoading.cancel ? "Processing..." : "Cancel Order"}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
