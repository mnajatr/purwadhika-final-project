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

  return (
    <div className="mb-6">
      <button
        onClick={onBack}
        className="flex items-center text-muted-foreground hover:text-foreground mb-4 transition-colors group"
      >
        <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Orders
      </button>

      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <div className="flex items-center space-x-3 mb-2">
            <h1 className="text-3xl font-bold text-foreground">
              Order #{orderId}
            </h1>
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 text-sm font-medium rounded-full ${getStatusBadgeColor(
                status
              )}`}
            >
              {getStatusIcon(status)}
              {status.replace(/_/g, " ")}
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Created{" "}
            {new Date(createdAt).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {canConfirmPayment && (
            <button
              onClick={onConfirmPayment}
              disabled={actionLoading.confirm}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <CheckCircle2 className="w-4 h-4" />
              {actionLoading.confirm ? "Processing..." : "Confirm Payment"}
            </button>
          )}
          {canShip && (
            <button
              onClick={onShipOrder}
              disabled={actionLoading.ship}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
            >
              <Truck className="w-4 h-4" />
              {actionLoading.ship ? "Processing..." : "Ship Order"}
            </button>
          )}
          {canCancel && (
            <button
              onClick={onCancelOrder}
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
  );
}
