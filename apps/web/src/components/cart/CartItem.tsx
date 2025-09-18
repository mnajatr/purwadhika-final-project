"use client";

import { useUpdateCartItem, useRemoveCartItem } from "@/hooks/useCart";
import type { CartItem as CartItemType } from "@/types/cart.types";
import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
// Image moved to CartItemImage
import CartItemImage from "./CartItemImage";
import CategoryBadge from "./CategoryBadge";
import { toast } from "sonner";
import formatIDR from "@/utils/formatCurrency";
import { TrashIcon } from "./CartItemIcons";
import QuantityControls from "./QuantityControls";

interface CartItemProps {
  item: CartItemType;
  userId: number;
  /** optional store id to use with cart hooks; defaults to 1 */
  storeId?: number;
  selected?: boolean;
  onToggle?: () => void;
  readOnly?: boolean;
}

export default function CartItem({
  item,
  userId,
  storeId = 1,
  selected = true,
  onToggle,
  readOnly = false,
}: CartItemProps) {
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

  // Get product details to get the correct category
  const { data: products } = useQuery({
    queryKey: ["products"],
    queryFn: () =>
      import("@/services/products.service").then((s) =>
        s.productsService.getProducts()
      ),
  });

  // Find the product with matching ID to get category
  const productDetails = products?.find(
    (p) => parseInt(p.id) === item.productId
  );
  const productCategory = productDetails?.category || "General";

  const clearPending = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    pendingQtyRef.current = null;
  };

  const getErrorMessage = (error: unknown, defaultMsg: string) => {
    if (error && typeof error === "object") {
      const maybe = error as Record<string, unknown>;
      if ("message" in maybe && typeof maybe.message === "string") {
        return maybe.message as string;
      }
    }
    return defaultMsg;
  };

  const handleQtyChange = (newQty: number) => {
    if (newQty === currentQty || isUpdating) return;
    if (newQty <= 0) {
      clearPending();
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
    clearPending();
    setIsUpdating(true);
    try {
      await removeCartItemMutation.mutateAsync(item.id);
      toast.success("Item berhasil dihapus");
    } catch (error) {
      const msg = getErrorMessage(error, "Gagal menghapus item");
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

  const unitPrice = useMemo(
    () => Number(item.product?.price ?? 0),
    [item.product]
  );
  const totalPrice = useMemo(
    () => unitPrice * currentQty,
    [unitPrice, currentQty]
  );

  return (
    <div className="flex items-start sm:items-center gap-4">
      {/* Checkbox - Outside the card, centered vertically */}
      {!readOnly && (
        <div className="flex items-center justify-center self-center sm:self-auto">
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            readOnly={!onToggle}
            className="h-5 w-5 rounded-md text-indigo-600 focus:ring-indigo-500 border-gray-300"
          />
        </div>
      )}

      {/* Card Container */}
      <div className="relative bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl p-3 sm:p-4 shadow-sm border-2 sm:border-4 border-white hover:shadow-md transition-all duration-200 flex-1">
        {/* Delete Button - Positioned to blend with card border */}
        {!readOnly && (
          <button
            onClick={removeCartItem}
            disabled={isUpdating}
            className="absolute -top-3 -right-3 w-8 h-8 sm:w-9 sm:h-9 bg-orange-100 border-2 border-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-orange-600 hover:text-orange-700 transition-all duration-200 z-10"
            aria-label="Remove item"
          >
            <TrashIcon />
          </button>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Product Image */}
          <CartItemImage productId={item.productId} alt={item.product.name} />

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            {/* Category Badge */}
            <CategoryBadge>{productCategory}</CategoryBadge>

            <h3 className="font-semibold text-gray-900 text-base mb-1 leading-tight">
              {item.product.name}
            </h3>
            <p className="text-sm text-gray-500 mb-1">{formatIDR(unitPrice)}</p>
          </div>

          {/* Centered Price */}
          <div className="text-center flex-shrink-0 mt-2 sm:mt-0 sm:ml-2">
            <div className="text-sm sm:text-base md:text-lg font-bold text-gray-900">
              {formatIDR(totalPrice)}
            </div>
          </div>

          {/* Quantity Controls */}
          {!readOnly ? (
            <QuantityControls
              currentQty={currentQty}
              onDecrease={() => handleQtyChange(currentQty - 1)}
              onIncrease={() => handleQtyChange(currentQty + 1)}
              disabled={isUpdating}
              maxReached={currentQty >= stockQty}
            />
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
