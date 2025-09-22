"use client";

import { useUpdateCartItem, useRemoveCartItem } from "@/hooks/useCart";
import { useStockHandler } from "@/hooks/useStockHandler";
import { getRemainingStock } from "@/utils/cartStockUtils";
import type { CartItemResponse as CartItemType } from "@repo/schemas";
import { useState, useEffect, useRef, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import CartItemImage from "./CartItemImage";
import CategoryBadge from "./CategoryBadge";
import { toast } from "sonner";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import formatIDR from "@/utils/formatCurrency";
import { TrashIcon } from "./CartItemIcons";
import QuantityControls from "./QuantityControls";
import { Skeleton } from "@/components/ui/skeleton";

interface CartItemProps {
  item: CartItemType;
  userId: number;
  /** optional store id to use with cart hooks; if omitted, hooks fall back to nearestStoreId */
  storeId?: number;
  selected?: boolean;
  onToggle?: () => void;
  readOnly?: boolean;
}

export default function CartItem({
  item,
  userId,
  storeId,
  selected = true,
  onToggle,
  readOnly = false,
}: CartItemProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [currentQty, setCurrentQty] = useState(item.qty);
  const [hasManuallyUpdated, setHasManuallyUpdated] = useState(false);
  const [lastKnownStock, setLastKnownStock] = useState(
    item.storeInventory?.stockQty ?? 9999
  );
  const stockQty = item.storeInventory?.stockQty ?? 9999;
  const pendingQtyRef = useRef<number | null>(null);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use stock handler for consistent behavior
  const stockHandler = useStockHandler({
    currentQuantity: currentQty,
    stockQuantity: stockQty,
    showToasts: true,
  });

  useEffect(() => {
    setCurrentQty(item.qty);
  }, [item.qty]);

  // Track stock changes and reset warning dismissal when stock increases significantly
  useEffect(() => {
    const currentStock = item.storeInventory?.stockQty ?? 9999;
    if (currentStock > lastKnownStock && currentStock > 5) {
      // Stock increased and is no longer limited, reset manual update flag
      setHasManuallyUpdated(false);
    }
    setLastKnownStock(currentStock);
  }, [item.storeInventory?.stockQty, lastKnownStock]);

  const updateCartItemMutation = useUpdateCartItem(userId, storeId);
  const removeCartItemMutation = useRemoveCartItem(userId, storeId);

  // Get product details to get the correct category
  const { data: productsData } = useQuery({
    queryKey: ["products"],
    queryFn: () =>
      import("@/services/products.service").then((s) =>
        s.productsService.getProducts()
      ),
  });

  // Find the product with matching ID to get category
  const productDetails = productsData?.products?.find(
    (p: { id: string; category: string }) => parseInt(p.id) === item.productId
  );
  const productCategory = productDetails?.category || "General";

  const clearPending = () => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
    pendingQtyRef.current = null;
  };

  // ...existing code... (removed getErrorMessage helper)

  const handleQtyChange = (newQty: number) => {
    if (newQty === currentQty || isUpdating) return;
    if (newQty <= 0) {
      // ask for confirmation before removing the item
      clearPending();
      setShowConfirm(true);
      return;
    }

    // Use stock handler to validate quantity change
    if (!stockHandler.handleQuantityChange(newQty)) {
      return;
    }

    // Mark as manually updated when user changes quantity via +/- buttons
    setHasManuallyUpdated(true);

    // If the user increased the quantity and hit the exact stock limit,
    // show an informational toast so they know they've reached the max.
    if (newQty > currentQty && newQty === stockQty) {
      toast(`You've reached the maximum available stock (${stockQty})`);
    }

    setCurrentQty(newQty);

    pendingQtyRef.current = newQty;
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(async () => {
      const qtyToSend = pendingQtyRef.current;
      pendingQtyRef.current = null;
      debounceTimerRef.current = null;
      if (qtyToSend == null) return;
      // Perform optimistic update without setting local isUpdating flag so
      // the UI (especially the quantity controls) doesn't show a loading
      // overlay or become disabled while the network request runs. The
      // mutation hook already performs optimistic updates and will rollback
      // on error.
      try {
        await updateCartItemMutation.mutateAsync({
          itemId: item.id,
          qty: qtyToSend,
        });
        if (hasManuallyUpdated) setHasManuallyUpdated(false);
      } catch {
        // Reset local qty to server value; hook handles error toasts.
        setCurrentQty(item.qty);
      }
    }, 250);
  };

  const removeCartItem = async () => {
    if (isUpdating) return;
    clearPending();
    setIsUpdating(true);
    try {
      await removeCartItemMutation.mutateAsync(item.id);
      // Show contextual success toast for user-initiated removal.
      toast.success(`${item.product.name} removed from cart`);
    } catch {
      // Hook handles error toasts; nothing to do here besides local state reset
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
          <label className="inline-flex items-center cursor-pointer">
            {/* Visually-hidden real checkbox for accessibility */}
            <input
              type="checkbox"
              checked={selected}
              onChange={onToggle}
              readOnly={!onToggle}
              className="sr-only"
            />

            {/* Custom visual box that shows primary gradient when checked */}
            <span
              aria-hidden
              className="inline-flex items-center justify-center h-6 w-6 rounded-sm border-2 transition-all duration-150"
              style={{
                background: selected ? "var(--cart-check)" : "transparent",
                borderColor: selected ? "var(--cart-check)" : "var(--border)",
              }}
            >
              {selected && (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  className="h-4 w-4"
                  style={{ color: "var(--primary-foreground)" }}
                >
                  <path
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </span>
          </label>
        </div>
      )}

      {/* Card Container */}
      <div className="relative bg-card rounded-2xl p-3 sm:p-4 shadow-sm border border-border hover:shadow-md transition-all duration-200 flex-1 backdrop-blur-sm">
        {/* Delete Button - Positioned to blend with card border */}
        {!readOnly && (
          <>
            <button
              onClick={() => setShowConfirm(true)}
              disabled={isUpdating}
              className={`absolute -top-3 -right-3 w-8 h-8 sm:w-9 sm:h-9 bg-red-100 border-2 border-card rounded-full shadow-lg hover:shadow-xl flex items-center justify-center text-red-600 hover:text-red-700 hover:bg-red-200 transition-all duration-200 z-10 cursor-pointer disabled:cursor-not-allowed ${
                isUpdating ? "opacity-50" : ""
              }`}
              aria-label="Remove item"
            >
              {isUpdating ? (
                <div className="w-4 h-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <TrashIcon />
              )}
            </button>
            <ConfirmDialog
              open={showConfirm}
              title="Remove item"
              description={`Remove ${item.product.name} from your cart?`}
              confirmLabel="Remove"
              cancelLabel="Cancel"
              onCancel={() => setShowConfirm(false)}
              onConfirm={async () => {
                setShowConfirm(false);
                await removeCartItem();
              }}
            />
          </>
        )}

        <div className="flex flex-col sm:flex-row items-center gap-3">
          {/* Product Image */}
          <div className="relative">
            <CartItemImage productId={item.productId} alt={item.product.name} />
            {isUpdating && (
              <div className="absolute inset-0 bg-card/50 rounded-xl flex items-center justify-center">
                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
              </div>
            )}
          </div>

          {/* Product Details */}
          <div className="flex-1 min-w-0">
            {/* Category Badge */}
            <CategoryBadge>{productCategory}</CategoryBadge>

            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-semibold text-foreground text-lg leading-tight">
                {item.product.name}
              </h3>
              {stockHandler.isOutOfStock && (
                <span className="ml-2 inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                  Out of Stock
                </span>
              )}
            </div>

            <p className="text-sm text-muted-foreground mb-1">
              {formatIDR(unitPrice)}
            </p>

            {/* Stock warning - show when stock is low or item quantity was high, but hide if user manually updated */}
            {!stockHandler.isOutOfStock &&
              !hasManuallyUpdated &&
              (() => {
                const remainingStock = getRemainingStock(item);
                const showStockWarning =
                  remainingStock <= 5 || currentQty >= remainingStock;

                if (showStockWarning) {
                  return (
                    <div className="flex items-center gap-1 text-xs">
                      <svg
                        className="h-3 w-3 text-orange-500"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      <span className="text-orange-600 font-medium">
                        Only {remainingStock} left in stock
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
          </div>

          {/* Centered Price */}
          <div className="text-center flex-shrink-0 mt-2 sm:mt-0 sm:ml-2">
            <div className="text-sm sm:text-base md:text-lg font-bold text-foreground">
              {formatIDR(totalPrice)}
            </div>
          </div>

          {/* Quantity Controls */}
          {!readOnly ? (
            stockHandler.isOutOfStock ? (
              <div className="text-sm text-red-600 flex-shrink-0 font-medium">
                Out of Stock
              </div>
            ) : (
              <QuantityControls
                currentQty={currentQty}
                onDecrease={() => handleQtyChange(currentQty - 1)}
                onIncrease={() => handleQtyChange(currentQty + 1)}
                disabled={isUpdating || stockHandler.isOutOfStock}
                maxReached={stockHandler.isMaxReached}
              />
            )
          ) : (
            <div className="text-sm text-muted-foreground flex-shrink-0">
              Quantity: {currentQty}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
