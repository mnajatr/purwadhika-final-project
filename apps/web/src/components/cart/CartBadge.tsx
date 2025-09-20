"use client";

import { Badge } from "../ui/badge";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";

interface CartBadgeProps {
  userId: number;
  storeId?: number;
  className?: string;
}

export function CartBadge({ userId, storeId = 1, className }: CartBadgeProps) {
  const { data: cart } = useCart(userId, storeId);
  const itemCount = cart?.items?.length || 0;

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
