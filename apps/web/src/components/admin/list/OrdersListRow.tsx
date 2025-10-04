import Link from "next/link";
import { CheckCircle, Truck, XCircle, Eye, MoreVertical } from "lucide-react";
import type { AdminOrderListItem } from "@repo/schemas";

interface OrdersListRowProps {
  order: AdminOrderListItem;
  isSelected: boolean;
  onSelect: (orderId: number, checked: boolean) => void;
  onOrderAction: (orderId: number, action: "confirm" | "ship" | "cancel") => void;
  actionLoading: Record<string, boolean>;
}

export default function OrdersListRow({
  order,
  isSelected,
  onSelect,
  onOrderAction,
  actionLoading,
}: OrdersListRowProps) {
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
      case "CANCELLED":
        return "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20";
      default:
        return "bg-muted text-muted-foreground border border-border";
    }
  };

  const canConfirmPayment = (order: AdminOrderListItem) => {
    return (
      order.status === "PAYMENT_REVIEW" && order.payment?.status === "PENDING"
    );
  };

  const canShip = (order: AdminOrderListItem) => {
    return order.status === "PROCESSING";
  };

  const canCancel = (order: AdminOrderListItem) => {
    return ["PENDING_PAYMENT", "PAYMENT_REVIEW", "PROCESSING"].includes(
      order.status
    );
  };

  return (
    <tr className="hover:bg-accent/5 transition-colors">
      <td className="px-6 py-4">
        <input
          type="checkbox"
          className="rounded border-border cursor-pointer accent-primary"
          checked={isSelected}
          onChange={(e) => onSelect(order.id, e.target.checked)}
        />
      </td>
      <td className="px-6 py-4">
        <Link
          href={`/admin/orderManagement/${order.id}`}
          className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
        >
          #{order.id}
        </Link>
      </td>
      <td className="px-6 py-4 text-sm text-foreground">
        {new Date(order.createdAt).toLocaleDateString("en-US", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        })}
      </td>
      <td className="px-6 py-4">
        <div className="text-sm font-semibold text-foreground">
          Rp{order.grandTotal.toLocaleString()}
        </div>
        <div className="text-xs text-muted-foreground">
          {order.totalItems} item
          {order.totalItems !== 1 ? "s" : ""}
        </div>
      </td>
      <td className="px-6 py-4">
        <div className="space-y-1">
          <div className="text-sm font-medium text-foreground uppercase">
            {order.paymentMethod || "GATEWAY"}
          </div>
          <div className="text-xs text-muted-foreground">
            Status: {order.payment?.status || "PAID"}
          </div>
        </div>
      </td>
      <td className="px-6 py-4">
        <span
          className={`inline-flex items-center px-3 py-1 text-xs font-medium rounded-full ${getStatusBadgeColor(
            order.status
          )}`}
        >
          <span className="w-1.5 h-1.5 rounded-full bg-current mr-2"></span>
          {order.status === "CONFIRMED"
            ? "Confirmed"
            : order.status === "CANCELLED"
            ? "Canceled"
            : order.status.replace(/_/g, " ")}
        </span>
      </td>
      <td className="px-6 py-4">
        <div className="flex items-center justify-end space-x-2">
          {canConfirmPayment(order) && (
            <button
              onClick={() => onOrderAction(order.id, "confirm")}
              disabled={actionLoading[`${order.id}-confirm`]}
              className="p-2 text-green-600 hover:bg-green-50 rounded-lg disabled:opacity-50 transition-colors"
              title="Confirm Payment"
            >
              <CheckCircle className="w-5 h-5" />
            </button>
          )}
          {canShip(order) && (
            <button
              onClick={() => onOrderAction(order.id, "ship")}
              disabled={actionLoading[`${order.id}-ship`]}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg disabled:opacity-50 transition-colors"
              title="Ship Order"
            >
              <Truck className="w-5 h-5" />
            </button>
          )}
          {canCancel(order) && (
            <button
              onClick={() => onOrderAction(order.id, "cancel")}
              disabled={actionLoading[`${order.id}-cancel`]}
              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg disabled:opacity-50 transition-colors"
              title="Cancel Order"
            >
              <XCircle className="w-5 h-5" />
            </button>
          )}
          <Link
            href={`/admin/orderManagement/${order.id}`}
            className="p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors"
            title="View Details"
          >
            <Eye className="w-5 h-5" />
          </Link>
          <button className="p-2 text-muted-foreground hover:bg-accent hover:text-accent-foreground rounded-lg transition-colors">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </td>
    </tr>
  );
}
