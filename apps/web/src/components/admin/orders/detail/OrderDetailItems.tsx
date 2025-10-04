import { ShoppingCart } from "lucide-react";
import type { AdminOrderDetailItem } from "@repo/schemas";

interface OrderDetailItemsProps {
  items: AdminOrderDetailItem[];
  totalItems: number;
}

export default function OrderDetailItems({
  items,
  totalItems,
}: OrderDetailItemsProps) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <ShoppingCart className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Order Items</h2>
        </div>
        <span className="text-sm text-muted-foreground">
          {totalItems} {totalItems === 1 ? "item" : "items"}
        </span>
      </div>

      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={item.id}
            className={`flex items-start justify-between py-4 ${
              index !== items.length - 1 ? "border-b border-border" : ""
            }`}
          >
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">
                {item.product.name}
              </h3>
              <p className="text-sm text-muted-foreground mb-2">
                Product ID: #{item.productId}
              </p>
              <div className="flex items-center gap-4 text-sm">
                <span className="text-muted-foreground">
                  Unit Price:{" "}
                  <span className="text-foreground font-medium">
                    Rp {Number(item.unitPriceSnapshot).toLocaleString()}
                  </span>
                </span>
                <span className="text-muted-foreground">
                  Quantity:{" "}
                  <span className="text-foreground font-medium">
                    {item.qty}
                  </span>
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
  );
}
