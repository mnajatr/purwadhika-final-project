"use client";

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
    <div className="flex items-center gap-4">
      {/* Checkbox - Outside the card, centered vertically */}
      {!readOnly && (
        <div className="flex items-center justify-center">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            readOnly={!onToggle}
            className="h-5 w-5 rounded-md text-green-600 focus:ring-green-500 border-gray-300"
          />
        </div>
      )}

      {/* Card Container */}
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-4 shadow-sm border-4 border-white hover:shadow-md transition-all duration-200 flex-1">
        {/* Delete Button - Positioned to blend with card border */}
        {!readOnly && (
          <button
            onClick={removeCartItem}
            disabled={isUpdating}
            className="absolute -top-3 -right-3 w-8 h-8 bg-orange-100 border-2 border-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-orange-600 hover:text-orange-700 transition-all duration-200 z-10"
            aria-label="Remove item"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
          </button>
        )}

        <div className="flex items-center gap-4">
          {/* Product Image */}
          <div className="w-16 h-16 bg-white rounded-xl flex-shrink-0 overflow-hidden relative shadow-sm">
            <Image
              src={`https://picsum.photos/seed/${item.productId}/200/200`}
              alt={item.product.name}
              fill
              sizes="64px"
              className="object-cover"
            />
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            {/* Category Badge */}
            <div className="mb-2">
              <span className="inline-block bg-gray-200 text-gray-700 text-xs font-medium px-3 py-1 rounded-full">
                Fruits & Vegetables
              </span>
            </div>
            
            <h3 className="font-semibold text-gray-900 text-base mb-1 leading-tight">
              {item.product.name}
            </h3>
            <p className="text-sm text-gray-500 mb-1">
              ${(Number(item.product?.price ?? 0) / 1000).toFixed(2)}
            </p>
          </div>

          {/* Centered Price */}
          <div className="text-center flex-shrink-0">
            <div className="text-xl font-bold text-gray-900">
              ${((Number(item.product?.price ?? 0) * currentQty) / 1000).toFixed(2)}
            </div>
          </div>

          {/* Quantity Controls */}
          {!readOnly ? (
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                className="w-8 h-8 rounded-full bg-gray-200 hover:bg-gray-300 flex items-center justify-center text-gray-600 transition-colors duration-200"
                onClick={() => handleQtyChange(currentQty - 1)}
                disabled={isUpdating}
                aria-label="Decrease quantity"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M20 12H4"
                  />
                </svg>
              </button>

              <span className="w-6 text-center font-semibold text-base text-gray-900">
                {currentQty}
              </span>

              <button
                className="w-8 h-8 rounded-full bg-indigo-600 hover:bg-indigo-700 flex items-center justify-center text-white transition-colors duration-200"
                onClick={() => handleQtyChange(currentQty + 1)}
                disabled={isUpdating || currentQty >= stockQty}
                aria-label="Increase quantity"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
              </button>
            </div>
          ) : (
            <div className="text-sm text-gray-600 flex-shrink-0">
              Quantity: {currentQty}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
