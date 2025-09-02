"use client";

import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { useCartStore } from "@/stores/cart-store";
import type { CartItem as CartItemType } from "@/types/cart.types";
import { useState, useCallback, useEffect } from "react";
import { toast } from "sonner";

interface CartItemProps {
  item: CartItemType;
  userId: number;
  // Tambahkan prop stockQty jika tersedia dari backend
  stockQty?: number;
}

export function CartItem({ item, userId }: CartItemProps) {
  const updateCartItem = useCartStore((state) => state.updateCartItem);
  const removeCartItem = useCartStore((state) => state.removeCartItem);
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentQty, setCurrentQty] = useState(item.qty); // Track current qty locally
  // Ambil stock dari item.product.storeInventory jika tersedia
  const stockQty = item.storeInventory?.stockQty ?? 9999;

  // Update local qty when item changes
  useEffect(() => {
    setCurrentQty(item.qty);
  }, [item.qty]);

  const validateAndUpdate = useCallback(
    async (newQty: number) => {
        if (newQty <= 0) {
          await removeCartItem(item.id, userId);
          return;
        }
        // Batasi qty tidak boleh lebih dari stock
        if (newQty > stockQty) {
          toast.error(`Qty melebihi stok tersedia (${stockQty})`);
          return;
        }

        setIsUpdating(true);
        setCurrentQty(newQty);

        try {
          await updateCartItem(item.id, newQty, userId);
        } catch (error) {
          setCurrentQty(item.qty);
          // Tampilkan error dari backend
          let msg = "Gagal update qty";
          if (error && typeof error === "object" && "message" in error) {
            msg = (error as { message?: string }).message ?? msg;
          }
          toast.error(msg);
        } finally {
          setIsUpdating(false);
        }
    },
    [item.id, item.qty, userId, updateCartItem, removeCartItem, stockQty]
  );

  const handleQtyChange = useCallback(
    async (newQty: number) => {
      if (newQty === currentQty || isUpdating) return;
      await validateAndUpdate(newQty);
    },
    [currentQty, isUpdating, validateAndUpdate]
  );

  return (
    <Card className="flex items-center justify-between p-4 mb-2">
      <div className="flex-1">
        <div className="font-semibold">{item.product.name}</div>
        <div className="text-sm text-muted-foreground">
          {item.product.description || "No description"}
        </div>
        <div className="text-sm font-medium">
          Rp {Number(item.unitPriceSnapshot).toLocaleString()} x {currentQty}
        </div>
        <div className="text-sm font-bold text-primary">
          Total: Rp{" "}
          {(Number(item.unitPriceSnapshot) * currentQty).toLocaleString()}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-4">
        <Button
          size="icon"
          variant="outline"
          onClick={() => handleQtyChange(currentQty - 1)}
          disabled={isUpdating}
        >
          -
        </Button>
        <span className="w-8 text-center font-medium">{currentQty}</span>
        <Button
          size="icon"
          variant="outline"
            onClick={() => handleQtyChange(currentQty + 1)}
            disabled={isUpdating || currentQty >= stockQty}
        >
          +
        </Button>
        <Button
          size="sm"
          variant="destructive"
          onClick={() => removeCartItem(item.id, userId)}
          disabled={isUpdating}
        >
          Hapus
        </Button>
      </div>
    </Card>
  );
}
