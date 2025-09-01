"use client";

import { Badge } from "../ui/badge";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cart-store";

interface CartBadgeProps {
  className?: string;
}

export function CartBadge({ className }: CartBadgeProps) {
  const itemCount = useCartStore((state) => state.itemCount);

  return (
    <Badge
      className={className}
      variant={itemCount > 0 ? "default" : "outline"}
    >
      <ShoppingCart className="w-4 h-4 mr-1 inline" />
      {itemCount}
    </Badge>
  );
}
