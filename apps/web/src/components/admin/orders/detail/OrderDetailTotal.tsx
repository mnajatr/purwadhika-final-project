import { DollarSign, Truck, Tag } from "lucide-react";

interface OrderDetailTotalProps {
  subtotalAmount: number;
  shippingCost: number;
  discountTotal: number;
  grandTotal: number;
}

export default function OrderDetailTotal({
  subtotalAmount,
  shippingCost,
  discountTotal,
  grandTotal,
}: OrderDetailTotalProps) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <DollarSign className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">Order Total</h2>
      </div>

      <div className="space-y-3">
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-muted-foreground">Subtotal</span>
          <span className="text-foreground">
            Rp {subtotalAmount.toLocaleString()}
          </span>
        </div>

        <div className="flex justify-between items-center py-2">
          <div className="flex items-center gap-1.5">
            <Truck className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Shipping</span>
          </div>
          <span className="text-foreground">
            Rp {shippingCost.toLocaleString()}
          </span>
        </div>

        {discountTotal > 0 && (
          <div className="flex justify-between items-center py-2">
            <div className="flex items-center gap-1.5">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Discount</span>
            </div>
            <span className="text-red-600">
              -Rp {discountTotal.toLocaleString()}
            </span>
          </div>
        )}

        <div className="border-t border-border pt-3 mt-3">
          <div className="flex justify-between items-center">
            <span className="text-base font-semibold text-foreground">
              Grand Total
            </span>
            <span className="text-xl font-bold text-primary">
              Rp {grandTotal.toLocaleString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
