"use client";

import * as React from "react";
import useLocationStore from "@/stores/locationStore";
import CartItem from "./CartItem";
import { useCart, useClearCart, useUpdateCartItem } from "@/hooks/useCart";
import { Button } from "../ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import useCreateOrder from "@/hooks/useOrder";
import { useRouter } from "next/navigation";
import formatIDR from "@/utils/formatCurrency";
import { CartPageSkeleton } from "./CartSkeleton";
import { EmptyCartState } from "./EmptyCartState";
import {
  validateCartForCheckout,
  hasOutOfStockItems,
  getItemsNeedingQuantityAdjustment,
  getAdjustedQuantity,
} from "@/utils/cartStockUtils";

interface CartPageProps {
  userId: number;
}

export function CartPage({ userId }: CartPageProps) {
  // Derive storeId from location store so cart follows nearest store selection
  const nearestStoreId = useLocationStore((s) => s.nearestStoreId) ?? 1;
  const storeId = nearestStoreId;
  const { data: cart, isInitialLoading, isFetching } = useCart(userId, storeId);
  const clearCartMutation = useClearCart(userId, storeId);
  const updateCartItemMutation = useUpdateCartItem(userId, storeId);
  const [selectedIds, setSelectedIds] = React.useState<Record<number, boolean>>(
    {}
  );
  // do not pass storeId so server can resolve the best store for the order
  const createOrder = useCreateOrder(userId);
  const creating = createOrder.status === "pending";
  const router = useRouter();
  const [showConfirmAll, setShowConfirmAll] = React.useState(false);
  const [hasAutoAdjusted, setHasAutoAdjusted] = React.useState(false);

  React.useEffect(() => {
    if (!cart) return;
    const map: Record<number, boolean> = {};
    cart.items.forEach((it) => (map[it.id] = true));
    setSelectedIds(map);
  }, [cart]);

  // Auto-adjust cart quantities when they exceed stock
  React.useEffect(() => {
    if (!cart || hasAutoAdjusted) return;

    const itemsNeedingAdjustment = getItemsNeedingQuantityAdjustment(
      cart.items
    );
    if (itemsNeedingAdjustment.length === 0) return;

    setHasAutoAdjusted(true);

    // Process adjustments sequentially
    const processAdjustments = async () => {
      for (const item of itemsNeedingAdjustment) {
        const adjustedQty = getAdjustedQuantity(item);

        try {
          if (adjustedQty === 0) {
            // Item is completely out of stock, show specific message
            toast.warning(
              `${item.product.name} is out of stock and was removed from your cart`
            );
          } else {
            // Quantity was reduced to match available stock
            await updateCartItemMutation.mutateAsync({
              itemId: item.id,
              qty: adjustedQty,
            });
            toast.warning(
              `Quantity adjusted to available stock: ${adjustedQty} for ${item.product.name}`
            );
          }
        } catch (error) {
          console.error("Failed to adjust cart item quantity:", error);
          toast.error(`Failed to adjust quantity for ${item.product.name}`);
        }
      }
    };

    processAdjustments();
  }, [cart, updateCartItemMutation, hasAutoAdjusted]);

  // Reset auto-adjustment flag when cart data changes (after mutations)
  React.useEffect(() => {
    if (cart && hasAutoAdjusted) {
      const itemsStillNeedingAdjustment = getItemsNeedingQuantityAdjustment(
        cart.items
      );
      if (itemsStillNeedingAdjustment.length === 0) {
        setHasAutoAdjusted(false);
      }
    }
  }, [cart, hasAutoAdjusted]);

  // Only show the full-page skeleton while the query is loading for the
  // first time (initial load). During background fetches (e.g. after a
  // mutation) we keep the UI stable and show a subtle inline spinner.
  if (isInitialLoading) return <CartPageSkeleton />;
  if (!cart) return <CartPageSkeleton />;
  if (cart.items.length === 0) return <EmptyCartState />;

  const allSelected = cart.items.every((it) => selectedIds[it.id]);

  const toggleSelect = (id: number) => {
    setSelectedIds((s) => ({ ...s, [id]: !s[id] }));
  };

  const toggleSelectAll = () => {
    const next = !allSelected;
    const map: Record<number, boolean> = {};
    cart.items.forEach((it) => (map[it.id] = next));
    setSelectedIds(map);
  };

  const subtotal = cart.items.reduce((sum, item) => {
    if (!selectedIds[item.id]) return sum;
    return sum + Number(item.product?.price ?? 0) * item.qty;
  }, 0);

  // Validate selected items for checkout
  const selectedItems = cart.items.filter((item) => selectedIds[item.id]);
  const cartValidation = validateCartForCheckout(selectedItems);
  const hasOutOfStockInSelection = hasOutOfStockItems(selectedItems);

  const handleCheckout = () => {
    // Check for out of stock items in selection
    if (hasOutOfStockInSelection) {
      toast.error(
        "Please remove out of stock items from your selection before checkout."
      );
      return;
    }

    if (!cartValidation.isValid) {
      const itemNames = cartValidation.outOfStockItems
        .map((item) => item.product.name)
        .join(", ");
      toast.error(`The following items are out of stock: ${itemNames}`);
      return;
    }

    const selectedIdsArr = Object.keys(selectedIds)
      .filter((k) => selectedIds[Number(k)])
      .map((k) => Number(k));

    // store selection + userId in session so Checkout page can read it
    try {
      sessionStorage.setItem(
        "checkout:selectedIds",
        JSON.stringify(selectedIdsArr)
      );
      sessionStorage.setItem("checkout:userId", String(userId));
    } catch {}
    router.push("/checkout");
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        {/* Header - Consistent with skeleton layout */}
        <div className="flex items-center gap-3 mb-6">
          <button
            aria-label="Back to landing"
            title="Back"
            onClick={() => router.push("/")}
            className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-card border border-border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-bold text-foreground">My Cart</h2>
              {isFetching && (
                <div
                  className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"
                  aria-hidden
                />
              )}
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              {cart.items.length} {cart.items.length === 1 ? "item" : "items"}{" "}
              in your cart
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Main Cart Content - Matching skeleton padding */}
          <div className="bg-card rounded-xl border border-border p-4 sm:p-6 shadow-sm backdrop-blur-sm">
            {/* Select All Header - Matching skeleton spacing */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-1 pb-4 border-b border-border mb-4">
              <div className="flex items-center gap-3">
                <label className="inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    aria-label="select all"
                    checked={allSelected}
                    onChange={toggleSelectAll}
                    className="sr-only"
                  />
                  <span
                    aria-hidden
                    className="inline-flex items-center justify-center h-6 w-6 rounded-sm border-2 transition-all duration-200"
                    style={{
                      background: allSelected
                        ? "var(--cart-check)"
                        : "transparent",
                      borderColor: allSelected
                        ? "var(--cart-check)"
                        : "var(--border)",
                    }}
                  >
                    {allSelected && (
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
                <span className="text-xl font-bold text-foreground">
                  Select All
                </span>
              </div>
              <div className="text-sm text-muted-foreground mt-2 sm:mt-0">
                {Object.values(selectedIds).filter(Boolean).length} of{" "}
                {cart.items.length} selected
              </div>
            </div>

            {/* Cart Items */}
            <div className="space-y-4">
              {cart.items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  userId={userId}
                  storeId={storeId}
                  selected={!!selectedIds[item.id]}
                  onToggle={() => toggleSelect(item.id)}
                />
              ))}
            </div>

            {/* Clear Cart Button - Matching skeleton spacing */}
            <div className="mt-6 border-t border-border pt-4">
              <div className="flex w-full items-center justify-end">
                <div className="w-full sm:w-auto">
                  <>
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={() => setShowConfirmAll(true)}
                      disabled={clearCartMutation.isPending}
                      className="text-md w-full sm:w-auto"
                    >
                      {clearCartMutation.isPending
                        ? "Clearing..."
                        : "Clear Cart"}
                    </Button>
                    <ConfirmDialog
                      open={showConfirmAll}
                      title="Clear cart"
                      description={`Remove all items from your cart?`}
                      confirmLabel="Clear"
                      cancelLabel="Cancel"
                      onCancel={() => setShowConfirmAll(false)}
                      onConfirm={async () => {
                        setShowConfirmAll(false);
                        try {
                          await clearCartMutation.mutateAsync();
                          // Success toast handled by hook's onSuccess
                        } catch {
                          // Error toast handled by hook's onError
                        }
                      }}
                    />
                  </>
                </div>
              </div>
            </div>
          </div>

          {/* Checkout Sidebar - Matching skeleton layout */}
          <div className="w-full lg:w-auto">
            <div className="bg-card rounded-2xl border border-border p-6 shadow-lg backdrop-blur-sm lg:sticky lg:top-6">
              <h3 className="text-xl font-bold mb-6 text-foreground">
                Order Summary
              </h3>

              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center py-2 border-b border-border">
                  <span className="text-muted-foreground font-medium">
                    Subtotal (
                    {Object.values(selectedIds).filter(Boolean).length} items):
                  </span>
                  <span className="font-semibold text-foreground text-lg">
                    {formatIDR(subtotal)}
                  </span>
                </div>

                <div className="flex justify-between items-center py-3">
                  <span className="text-xl font-bold text-foreground">
                    Total:
                  </span>
                  <span className="text-2xl font-bold text-primary">
                    {formatIDR(subtotal)}
                  </span>
                </div>
              </div>

              <div className="space-y-3">
                {/* Show warning if there are out of stock items in selection */}
                {hasOutOfStockInSelection && (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                    <div className="flex items-center gap-2">
                      <svg
                        className="h-5 w-5 text-red-500"
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
                      <span className="text-sm text-red-700 font-medium">
                        Remove out of stock items to checkout
                      </span>
                    </div>
                  </div>
                )}

                <Button
                  className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-200 ${
                    hasOutOfStockInSelection ||
                    Object.values(selectedIds).filter(Boolean).length === 0
                      ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                      : "bg-primary-gradient text-primary-foreground hover:opacity-95 shadow-lg hover:shadow-xl"
                  }`}
                  size="lg"
                  onClick={handleCheckout}
                  disabled={
                    creating ||
                    hasOutOfStockInSelection ||
                    Object.values(selectedIds).filter(Boolean).length === 0
                  }
                >
                  {creating ? (
                    "Processing..."
                  ) : (
                    <span className="inline-flex items-center justify-center gap-2">
                      Proceed to Checkout
                      <ChevronRight className="w-4 h-4" />
                    </span>
                  )}
                </Button>

                {Object.values(selectedIds).filter(Boolean).length === 0 && (
                  <p className="text-center text-sm text-muted-foreground">
                    Select items to proceed with checkout
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
