"use client";

import { Badge } from "../ui/badge";
import { ShoppingCart } from "lucide-react";
import { useCart } from "@/hooks/useCart";
import useLocationStore from "@/stores/locationStore";

interface CartBadgeProps {
  userId: number;
  storeId?: number;
  className?: string;
}

export function CartBadge({ userId, storeId, className }: CartBadgeProps) {
  const nearestStoreId = useLocationStore((s) => s.nearestStoreId) ?? 1;
  const effectiveStoreId = storeId ?? nearestStoreId;
  const { data: cart } = useCart(userId, effectiveStoreId);
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
