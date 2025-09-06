"use client";

import * as React from "react";
import CartItem from "./CartItem";
import { useCart, useClearCart } from "@/hooks/useCart";
import { Button } from "../ui/button";
import useCreateOrder from "@/hooks/useOrder";
import { useRouter } from "next/navigation";

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

  const [idempotencyKey, setIdempotencyKey] = React.useState<string | null>(
    null
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
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <h2 className="text-2xl font-bold mb-6">Shopping Cart</h2>
      <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
        <div className="bg-card rounded-xl border-2 border-gray-300 p-4 sm:p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-1 pb-4 border-b mb-4">
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                aria-label="select all"
                checked={allSelected}
                onChange={toggleSelectAll}
                className="h-5 w-5 rounded-md accent-primary"
              />
              <span className="text-lg font-semibold">Select All</span>
            </div>
          </div>

          <div className="divide-y">
            {cart.items.map((item) => (
              <div key={item.id} className="py-4">
                <CartItem
                  item={item}
                  userId={userId}
                  selected={!!selectedIds[item.id]}
                  onToggle={() => toggleSelect(item.id)}
                />
              </div>
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
                  {clearCartMutation.isPending ? "Menghapus..." : "Hapus Semua"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-auto">
          <div className="bg-card rounded-xl border-2 border-gray-300 p-6 shadow-sm lg:sticky lg:top-6">
            <h3 className="text-xl font-semibold mb-4">Shopping Summary</h3>
            <div className="border-t border-b py-4">
              <div className="flex justify-between text-md text-muted-foreground">
                <span>Subtotal</span>
                <span className="font-medium">
                  Rp {subtotal.toLocaleString()}
                </span>
              </div>
            </div>
            <div className="mt-6">
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <input
                    type="text"
                    readOnly
                    value={idempotencyKey ?? "(no key generated)"}
                    className="flex-1 input input-bordered"
                    aria-label="idempotency-key"
                  />
                  <Button
                    size="sm"
                    onClick={() =>
                      setIdempotencyKey(String(Math.random()).slice(2, 14))
                    }
                  >
                    Generate
                  </Button>
                </div>

                <Button
                  className="w-full bg-blue-600 text-white hover:bg-blue-700"
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

                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const selectedIdsArr = Object.keys(selectedIds)
                      .filter((k) => selectedIds[Number(k)])
                      .map((k) => Number(k));
                    try {
                      sessionStorage.setItem(
                        "checkout:selectedIds",
                        JSON.stringify(selectedIdsArr)
                      );
                      sessionStorage.setItem("checkout:userId", String(userId));
                    } catch {}
                    router.push("/checkout");
                  }}
                >
                  Go to Checkout (simulate double-submit)
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
