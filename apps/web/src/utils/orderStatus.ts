/**
 * Centralized order status badge colors for consistent UI across the app
 * All pages (admin and user-facing) use the same color scheme for consistency
 */

export function getOrderStatusBadgeColor(status: string): string {
  switch (status) {
    case "PENDING_PAYMENT":
      return "bg-yellow-500/10 text-yellow-700 dark:text-yellow-400 border border-yellow-500/20";
    case "PAYMENT_REVIEW":
      return "bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border border-cyan-500/20";
    case "PAID":
    case "PROCESSING":
      return "bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-500/20";
    case "CONFIRMED":
      return "bg-green-500/10 text-green-700 dark:text-green-400 border border-green-500/20";
    case "SHIPPED":
      return "bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-500/20";
    case "DELIVERED":
    case "COMPLETED":
      return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/20";
    case "CANCELLED":
      return "bg-red-500/10 text-red-700 dark:text-red-400 border border-red-500/20";
    case "EXPIRED":
      return "bg-gray-500/10 text-gray-700 dark:text-gray-400 border border-gray-500/20";
    default:
      return "bg-muted text-muted-foreground border border-border";
  }
}
