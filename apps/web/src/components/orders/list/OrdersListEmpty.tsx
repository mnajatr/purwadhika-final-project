"use client";

import { ShoppingBag, Filter } from "lucide-react";

interface OrdersListEmptyProps {
  hasFilters: boolean;
}

export default function OrdersListEmpty({ hasFilters }: OrdersListEmptyProps) {
  if (hasFilters) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="p-6 rounded-2xl bg-muted/30 mb-6">
          <Filter className="h-12 w-12 text-muted-foreground/40" />
        </div>
        <h3 className="text-xl font-bold mb-2">No orders found</h3>
        <p className="text-muted-foreground mb-6 max-w-md">
          No orders match your current filters. Try adjusting your search
          criteria to find what you&apos;re looking for.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="p-6 rounded-2xl bg-muted/30 mb-6">
        <ShoppingBag className="h-12 w-12 text-muted-foreground/40" />
      </div>
      <h3 className="text-xl font-bold mb-2">No orders yet</h3>
      <p className="text-muted-foreground max-w-md">
        When you place your first order, it will appear here. Start shopping to
        see your order history!
      </p>
    </div>
  );
}
