"use client";

import { Button } from "../ui/button";
import { Card } from "../ui/card";
import { useUpdateCartItem, useRemoveCartItem } from "@/hooks/useCart";
import type { CartItem as CartItemType } from "@/types/cart.types";
import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { toast } from "sonner";

interface CartItemProps {
  item: CartItemType;
  userId: number;
  stockQty?: number;
  selected?: boolean;
  onToggle?: () => void;
  readOnly?: boolean;
}

export default function CartItem({
  item,
  userId,
  selected = true,
  onToggle,
  readOnly = false,
}: CartItemProps) {
  const storeId = 1;
  const [isUpdating, setIsUpdating] = useState(false);
  const [currentQty, setCurrentQty] = useState(item.qty);
  const stockQty = item.storeInventory?.stockQty ?? 9999;
  const pendingQtyRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setCurrentQty(item.qty);
  }, [item.qty]);

  const updateCartItemMutation = useUpdateCartItem(userId, storeId);
  const removeCartItemMutation = useRemoveCartItem(userId, storeId);

  const handleQtyChange = (newQty: number) => {
    if (newQty === currentQty || isUpdating) return;
    if (newQty <= 0) {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
        pendingQtyRef.current = null;
      }
      void removeCartItem();
      return;
    }
    if (newQty > stockQty) {
      toast.error(`Qty melebihi stok tersedia (${stockQty})`);
      return;
    }

    setCurrentQty(newQty);

    pendingQtyRef.current = newQty;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      const qtyToSend = pendingQtyRef.current;
      pendingQtyRef.current = null;
      debounceTimerRef.current = null;
      if (qtyToSend == null) return;
      setIsUpdating(true);
      try {
        await updateCartItemMutation.mutateAsync({
          itemId: item.id,
          qty: qtyToSend,
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
    }, 250);
  };

  const removeCartItem = async () => {
    if (isUpdating) return;
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
      pendingQtyRef.current = null;
    }
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

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = null;
        pendingQtyRef.current = null;
      }
    };
  }, []);

  return (
    <Card className="p-3">
      <div className="flex flex-col md:flex-row items-start md:items-start gap-3 w-full">
        {!readOnly && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            readOnly={!onToggle}
            className="h-5 w-5 rounded-md accent-primary"
          />
        )}

        <div className="flex flex-row items-start gap-3 flex-1 ml-2">
          <div className="w-14 h-14 sm:w-16 sm:h-16 md:w-20 md:h-20 bg-muted rounded-lg flex-shrink-0 overflow-hidden relative">
            <Image
              src={`https://picsum.photos/seed/${item.productId}/200/200`}
              alt={item.product.name}
              fill
              sizes="80px"
              className="object-cover"
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="font-semibold text-base md:text-lg whitespace-normal break-words">
              {item.product.name}
            </div>
            <div className="text-sm text-muted-foreground mt-1 whitespace-normal">
              {item.product.description || "eceran"}
            </div>
            <div className="text-sm text-muted-foreground mt-2">
              Unit: Rp {Number(item.product?.price ?? 0).toLocaleString()}
            </div>
          </div>
        </div>

        <div className="mt-3 md:mt-0 md:ml-auto flex-shrink-0 w-full md:w-auto">
          <div className="flex items-center justify-between md:flex-col md:items-start gap-3 w-full md:w-auto">
            <div className="text-base font-semibold">
              Rp{" "}
              {(Number(item.product?.price ?? 0) * currentQty).toLocaleString()}
            </div>

            {!readOnly ? (
              <div className="flex items-center gap-2">
                <button
                  className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 text-sm text-muted-foreground hover:bg-gray-50"
                  onClick={() => handleQtyChange(currentQty - 1)}
                  disabled={isUpdating}
                  aria-label="Decrease quantity"
                >
                  -
                </button>
                <div className="w-10 text-center font-medium">{currentQty}</div>
                <button
                  className="inline-flex items-center justify-center h-8 w-8 rounded-full border border-gray-200 text-sm text-muted-foreground hover:bg-gray-50"
                  onClick={() => handleQtyChange(currentQty + 1)}
                  disabled={isUpdating || currentQty >= stockQty}
                  aria-label="Increase quantity"
                >
                  +
                </button>

                <Button
                  size="sm"
                  variant="destructive"
                  onClick={removeCartItem}
                  disabled={isUpdating}
                  className="ml-2"
                  aria-label="Remove item"
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 24 24"
                    className="w-4 h-4"
                    fill="currentColor"
                  >
                    <path d="M3 6h18v2H3V6zm3 3h12l-1 11H7L6 9zM9 4h6l1 1H8l1-1z" />
                  </svg>
                </Button>
              </div>
            ) : (
              <div className="text-sm text-muted-foreground">
                Quantity: {currentQty}
              </div>
            )}
          </div>
        </div>
      </div>
    </Card>
  );
}
