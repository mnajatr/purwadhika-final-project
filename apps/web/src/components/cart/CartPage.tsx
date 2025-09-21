"use client";

import * as React from "react";
import useLocationStore from "@/stores/locationStore";
import CartItem from "./CartItem";
import { useCart, useClearCart, useUpdateCartItem } from "@/hooks/useCart";
import { Button } from "../ui/button";
import ConfirmDialog from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import useCreateOrder from "@/hooks/useOrder";
import { useRouter } from "next/navigation";
import formatIDR from "@/utils/formatCurrency";
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
  const { data: cart, isLoading } = useCart(userId, storeId);
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

  if (isLoading || !cart) return <div>Loading cart...</div>;
  if (cart.items.length === 0)
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
        <div className="text-center">
          <p className="text-xl font-semibold text-gray-900 mb-4">
            Your cart is empty. Start shopping!
          </p>
          <Button
            size="lg"
            className="bg-indigo-600 text-white hover:bg-indigo-700 px-6 py-3 rounded-lg font-semibold"
            onClick={() => router.push("/products")}
          >
            Shop now
          </Button>
        </div>
      </div>
    );

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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100">
      <div className="max-w-6xl mx-auto p-4 sm:p-6">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">My Cart</h2>
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          <div className="bg-white rounded-xl border border-gray-200 p-4 sm:p-6 shadow-sm">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-1 pb-4 border-b mb-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  aria-label="select all"
                  checked={allSelected}
                  onChange={toggleSelectAll}
                  className="h-5 w-5 rounded-md text-indigo-600 focus:ring-indigo-500 border-gray-300"
                />
                <span className="text-lg font-semibold text-gray-900">
                  Select All
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {cart.items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  userId={userId}
                  selected={!!selectedIds[item.id]}
                  onToggle={() => toggleSelect(item.id)}
                />
              ))}
            </div>

            <div className="mt-6 border-t pt-4">
              <div className="flex w-full items-center justify-end">
                <div className="w-full sm:w-auto">
                  <>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setShowConfirmAll(true)}
                      disabled={clearCartMutation.isPending}
                      className="w-full sm:w-auto"
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

          <div className="w-full lg:w-auto">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-sm lg:sticky lg:top-6">
              <h3 className="text-xl font-semibold mb-4 text-gray-900">
                Shopping Summary
              </h3>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm text-gray-600">
                  <span>Subtotal:</span>
                  <span className="font-medium text-gray-900">
                    {formatIDR(subtotal)}
                  </span>
                </div>
                <div className="border-t pt-3">
                  <div className="flex justify-between text-lg font-semibold text-gray-900">
                    <span>Total:</span>
                    <span>{formatIDR(subtotal)}</span>
                  </div>
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

                {/* Idempotency is intentionally handled at the checkout/order
                    level (server + checkout UI). Removing cart-level idempotency
                    input to avoid confusion — users generate/see keys on Checkout. */}
                <Button
                  className={`w-full py-3 rounded-lg font-semibold ${
                    hasOutOfStockInSelection
                      ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                      : "bg-indigo-600 text-white hover:bg-indigo-700"
                  }`}
                  size="lg"
                  onClick={handleCheckout}
                  disabled={creating || hasOutOfStockInSelection}
                >
                  {creating ? "Processing..." : "Checkout"}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
