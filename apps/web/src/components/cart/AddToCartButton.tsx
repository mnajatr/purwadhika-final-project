"use client";

import { useState } from "react";
import { Button } from "../ui/button";
import { useCartStore } from "@/stores/cart-store";
import { toast } from "sonner";

interface AddToCartButtonProps {
  productId: number;
  storeId: number;
  userId: number;
  qty?: number;
  disabled?: boolean;
  className?: string;
}

export function AddToCartButton({
  productId,
  storeId,
  userId,
  qty = 1,
  disabled = false,
  className,
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const addToCart = useCartStore((state) => state.addToCart);
  const setStoreId = useCartStore((state) => state.setStoreId);

  const getErrorMessage = (error: unknown): string => {
    let errorMessage = "Failed to add to cart";
    
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      errorMessage = (error as { message: string }).message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }
    
    // Show user-friendly message for common stock issues
    if (errorMessage.includes("stock") || errorMessage.includes("exceeds available") || errorMessage.includes("Insufficient stock")) {
      return "Sorry, not enough stock available for the requested quantity.";
    } else if (errorMessage.includes("out of stock") || errorMessage.includes("stock: 0") || errorMessage.includes("Available: 0")) {
      return "Sorry, this product is currently out of stock.";
    }
    
    return errorMessage;
  };

  const handleClick = () => {
    setLoading(true);
    setStoreId(storeId);
    
    // Use a Promise wrapper to handle the async cart action properly
    Promise.resolve(addToCart(productId, qty, userId))
      .then(() => {
        // Success is already handled by the store with toast messages
      })
      .catch((error) => {
        // Additional error handling here if needed
        console.warn("AddToCartButton error:", error);
        const message = getErrorMessage(error);
        toast.error(message);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || loading}
      className={className}
      aria-label="Add to cart"
    >
      {loading ? "Adding..." : "Add to cart"}
    </Button>
  );
}
