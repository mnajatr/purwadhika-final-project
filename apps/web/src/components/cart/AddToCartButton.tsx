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
    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof (error as { message?: unknown }).message === "string"
    ) {
      return (error as { message: string }).message;
    }
    if (typeof error === "string") return error;
    return "Gagal menambah ke keranjang";
  };

  const handleClick = async () => {
    setLoading(true);
    try {
      setStoreId(storeId);
      await addToCart(productId, qty, userId);
    } catch (error) {
      toast.error(getErrorMessage(error));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleClick}
      disabled={disabled || loading}
      className={className}
      aria-label="Tambah ke keranjang"
    >
      {loading ? "Menambah..." : "Tambah ke Keranjang"}
    </Button>
  );
}
