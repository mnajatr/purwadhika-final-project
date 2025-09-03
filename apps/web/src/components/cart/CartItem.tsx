"use client";

import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { useUpdateCartItem, useRemoveCartItem } from "@/hooks/useCart";
import type { CartItem as CartItemType } from "@/types/cart.types";
import { useState, useEffect } from "react";
import { toast } from "sonner";

interface CartItemProps {
  item: CartItemType;
  userId: number;
  stockQty?: number;
}

export default function CartItem({ item, userId }: CartItemProps) {
  // TODO: derive `storeId` from route, user session, or app context
  // Temporary hardcoded value for development when store data isn't available.
  const storeId = 1;
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentQty, setCurrentQty] = useState(item.qty);
  const stockQty = item.storeInventory?.stockQty ?? 9999;

  useEffect(() => {
    setCurrentQty(item.qty);
  }, [item.qty]);

  const updateCartItemMutation = useUpdateCartItem(userId, storeId);
  const removeCartItemMutation = useRemoveCartItem(userId, storeId);
  const handleQtyChange = async (newQty: number) => {
    if (newQty === currentQty || isUpdating) return;
    if (newQty <= 0) {
      await removeCartItem();
      return;
    }
    if (newQty > stockQty) {
      toast.error(`Qty melebihi stok tersedia (${stockQty})`);
      return;
    }
    setIsUpdating(true);
    setCurrentQty(newQty);
    try {
      await updateCartItemMutation.mutateAsync({
        itemId: item.id,
        qty: newQty,
      });
    } catch (error) {
      setCurrentQty(item.qty);
      let msg = "Gagal update qty";
      if (error && typeof error === "object" && "message" in error) {
        msg = (error as { message?: string }).message ?? msg;
      }
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

  const removeCartItem = async () => {
    if (isUpdating) return;
    setIsUpdating(true);
    try {
      await removeCartItemMutation.mutateAsync(item.id);
      toast.success("Item berhasil dihapus");
    } catch (error) {
      let msg = "Gagal menghapus item";
      if (error && typeof error === "object" && "message" in error) {
        msg = (error as { message?: string }).message ?? msg;
      }
      toast.error(msg);
    } finally {
      setIsUpdating(false);
    }
  };

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
          onClick={removeCartItem}
          disabled={isUpdating}
        >
          Hapus
        </Button>
      </div>
    </Card>
  );
}
