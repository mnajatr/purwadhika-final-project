"use client";

type OrderTimelineProps = {
  status: string;
  orderId: number;
  createdAt?: string;
  updatedAt?: string;
  shippedAt?: string;
  confirmedAt?: string;
  storeName?: string;
  storeCity?: string;
  addressLine?: string;
  addressCity?: string;
  addressProvince?: string;
  formatDateShort: (dateString?: string) => string | null;
};

export default function OrderTimeline({
  status,
  orderId,
  createdAt,
  updatedAt,
  shippedAt,
  confirmedAt,
  storeName,
  storeCity,
  addressLine,
  addressCity,
  addressProvince,
  formatDateShort,
}: OrderTimelineProps) {
  const formatTime = (dateString?: string) =>
    dateString
      ? new Date(dateString).toLocaleTimeString("en-US", {
          hour12: false,
          hour: "2-digit",
          minute: "2-digit",
        })
      : "00:00";

  const isShippedOrCompleted = ["SHIPPED", "CONFIRMED", "COMPLETED"].includes(
    status
  );
  const isProcessingOrLater = [
    "PROCESSING",
    "SHIPPED",
    "CONFIRMED",
    "COMPLETED",
  ].includes(status);

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/60 p-4 shadow-sm">
      <h4 className="text-sm font-medium text-foreground mb-4">Timeline</h4>
      <div className="space-y-4">
        {/* Shipped/Delivered */}
        {isShippedOrCompleted && (
          <div className="flex gap-3">
            <div className="text-sm">
              <p className="font-medium text-foreground">
                {shippedAt
                  ? formatDateShort(shippedAt)
                  : updatedAt
                  ? formatDateShort(updatedAt)
                  : formatDateShort(new Date().toISOString())}
                {status === "SHIPPED" && !confirmedAt ? " (Now)" : ""}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatTime(
                  shippedAt || updatedAt || new Date().toISOString()
                )}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {status === "COMPLETED" || status === "CONFIRMED"
                  ? "Package delivered"
                  : "Package is on delivery"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {addressLine}, {addressCity}, {addressProvince}
              </p>
            </div>
          </div>
        )}

        {/* Processing */}
        {isProcessingOrLater && (
          <div className="flex gap-3">
            <div className="text-sm">
              <p className="font-medium text-foreground">
                {updatedAt && status !== "PROCESSING"
                  ? formatDateShort(updatedAt)
                  : createdAt
                  ? formatDateShort(
                      new Date(
                        new Date(createdAt).getTime() +
                          ((orderId % 5) + 2) * 60 * 60 * 1000
                      ).toISOString()
                    )
                  : "Processing"}
              </p>
              <p className="text-xs text-muted-foreground">
                {updatedAt && status !== "PROCESSING"
                  ? formatTime(updatedAt)
                  : createdAt
                  ? formatTime(
                      new Date(
                        new Date(createdAt).getTime() +
                          ((orderId % 5) + 2) * 60 * 60 * 1000
                      ).toISOString()
                    )
                  : "06:00"}
              </p>
            </div>
            <div className="flex-1">
              <p className="text-sm text-muted-foreground">
                Order is being prepared
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {storeName || "Online Store"}, {storeCity || "Store City"}
              </p>
            </div>
          </div>
        )}

        {/* Order Placed */}
        <div className="flex gap-3">
          <div className="text-sm">
            <p className="font-medium text-foreground">
              {createdAt ? formatDateShort(createdAt) : "Order Date"}
            </p>
            <p className="text-xs text-muted-foreground">{formatTime(createdAt)}</p>
          </div>
          <div className="flex-1">
            <p className="text-sm text-muted-foreground">Order placed</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">
                  ✓
                </span>
              </div>
              <span className="text-xs font-medium text-foreground">
                Online Store
              </span>
              <div className="w-3 h-3 bg-primary rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
