// Shared utility functions for order components

export function formatCurrency(amount: string | number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function formatDateShort(dateString?: string): string | null {
  return dateString
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(dateString))
    : null;
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "COMPLETED":
    case "CONFIRMED":
      return "bg-emerald-100/80 text-emerald-700 border-emerald-200";
    case "PAID":
    case "PROCESSING":
      return "bg-primary/10 text-primary border-primary/20";
    case "SHIPPED":
      return "bg-indigo-100/80 text-indigo-700 border-indigo-200";
    case "PENDING_PAYMENT":
      return "bg-amber-100/80 text-amber-700 border-amber-200";
    case "CANCELLED":
    case "EXPIRED":
      return "bg-rose-100/80 text-rose-700 border-rose-200";
    default:
      return "bg-muted text-muted-foreground border-border/60";
  }
}

export function getStatusHeadline(
  status: string,
  paymentMethod: string
): string {
  const s = status.toUpperCase();
  const pm = (paymentMethod || "").toUpperCase();

  if (s === "PENDING_PAYMENT") {
    return pm === "MANUAL_TRANSFER"
      ? "Please upload your payment proof to complete the order"
      : "Please complete your payment to proceed";
  }
  if (s === "PAYMENT_REVIEW") return "Your payment is under review";
  if (s === "PAID" || s === "PROCESSING") return "Your order is being prepared";
  if (s === "SHIPPED") return "Be patient, package on deliver!";
  if (s === "COMPLETED" || s === "CONFIRMED")
    return "Order confirmed — package delivered";
  if (s === "CANCELLED" || s === "EXPIRED") return "Order cancelled";
  return "Order status";
}
