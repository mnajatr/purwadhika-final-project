"use client";

import { Button } from "../ui/button";
import { useAddToCart } from "@/hooks/useCart";
import type { AddToCartRequest } from "@/types/cart.types";
import { toast } from "sonner";

interface AddToCartButtonProps {
  productId: number;
  storeId: number;
  userId: number;
  qty?: number;
  disabled?: boolean;
  className?: string;
  productName?: string; // Optional product name for better toast message
}

export function AddToCartButton({
  productId,
  storeId,
  userId,
  qty = 1,
  disabled = false,
  className,
  productName,
}: AddToCartButtonProps) {
  const addToCartMutation = useAddToCart(userId, storeId);

  const handleClick = () => {
    const data: AddToCartRequest = {
      productId,
      qty,
      storeId,
      userId,
    };

    addToCartMutation.mutate(data, {
      onSuccess: () => {
        // Show detailed toast if product name is available, otherwise generic
        const message = productName
          ? `${qty} ${productName} added to cart!`
          : "Added to cart";
        toast.success(message);
      },
    });
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || addToCartMutation.isPending}
      className={className}
      aria-label="Add to cart"
    >
      {addToCartMutation.isPending ? "Adding..." : "Add to cart"}
    </Button>
  );
}
