"use client";

import Image from "next/image";
import { Package } from "lucide-react";

type OrderItemsProps = {
  items: Array<{
    id: number;
    productId: number;
    qty: number;
    totalAmount: string | number;
    product?: {
      id: number;
      name: string;
      images?: Array<{ url: string }>;
      price?: string | number;
    };
  }>;
  formatCurrency: (amount: string | number) => string;
};

export default function OrderItems({ items, formatCurrency }: OrderItemsProps) {
  const getTotalItems = () =>
    items.reduce((total, item) => total + item.qty, 0);

  return (
    <div className="bg-card/80 rounded-xl p-6 shadow-sm border border-border/60">
      <h3 className="text-lg font-semibold text-foreground mb-6">
        Items{" "}
        <span className="font-normal text-muted-foreground">
          {getTotalItems()}
        </span>
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {items.map((item) => (
          <div
            key={item.id}
            className="bg-muted/30 rounded-xl p-4 border border-border/30"
          >
            <div className="flex gap-3 sm:gap-4">
              <div className="flex-shrink-0">
                {item.product?.images?.[0]?.url ? (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-card rounded-lg overflow-hidden border border-border/60 shadow-sm">
                    <Image
                      src={item.product.images[0].url}
                      alt={item.product.name || `Product #${item.productId}`}
                      width={80}
                      height={80}
                      className="w-full h-full object-cover"
                    />
                  </div>
                ) : (
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-card rounded-lg flex items-center justify-center border border-border/60 shadow-sm">
                    <Package className="w-10 h-10 text-muted-foreground" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-medium text-foreground text-sm mb-2 line-clamp-2">
                  {item.product?.name || `Product #${item.productId}`}
                </h4>
                <p className="text-sm font-semibold text-foreground mb-1">
                  {formatCurrency(item.product?.price || 0)}
                </p>
                <p className="text-xs text-muted-foreground">
                  Quantity: {item.qty}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
