"use client";

import * as React from "react";
import CartItem from "./CartItem";
import { useCart, useClearCart } from "@/hooks/useCart";
import { Button } from "../ui/button";
import useCreateOrder from "@/hooks/useOrder";
import { useRouter } from "next/navigation";
import formatIDR from "@/utils/formatCurrency";

interface CartPageProps {
  userId: number;
}

export function CartPage({ userId }: CartPageProps) {
  // TODO: derive `storeId` from the route, user session, or app context instead of hardcoding.
  const storeId = 1;
  const { data: cart, isLoading } = useCart(userId, storeId);
  const clearCartMutation = useClearCart(userId, storeId);
  const [selectedIds, setSelectedIds] = React.useState<Record<number, boolean>>(
    {}
  );
  // do not pass storeId so server can resolve the best store for the order
  const createOrder = useCreateOrder(userId);
  const creating = createOrder.status === "pending";
  const router = useRouter();

  React.useEffect(() => {
    if (!cart) return;
    const map: Record<number, boolean> = {};
    cart.items.forEach((it) => (map[it.id] = true));
    setSelectedIds(map);
  }, [cart]);

  if (isLoading || !cart) return <div>Loading cart...</div>;
  if (cart.items.length === 0) return <div>Keranjang kosong.</div>;

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
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => clearCartMutation.mutateAsync()}
                    disabled={clearCartMutation.isPending}
                    className="w-full sm:w-auto"
                  >
                    {clearCartMutation.isPending
                      ? "Menghapus..."
                      : "Clear Cart"}
                  </Button>
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
                {/* Idempotency is intentionally handled at the checkout/order
                    level (server + checkout UI). Removing cart-level idempotency
                    input to avoid confusion — users generate/see keys on Checkout. */}
                <Button
                  className="w-full bg-indigo-600 text-white hover:bg-indigo-700 py-3 rounded-lg font-semibold"
                  size="lg"
                  onClick={() => {
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
                  }}
                  disabled={creating}
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
