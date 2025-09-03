"use client";

import CartItem from "./CartItem";
import { useCart, useClearCart } from "@/hooks/useCart";
import { Button } from "../ui/button";

interface CartPageProps {
  userId: number;
}

export function CartPage({ userId }: CartPageProps) {
  // TODO: derive `storeId` from the route, user session, or app context instead of hardcoding.
  // Temporary hardcoded value for development when store data isn't available.
  const storeId = 1;
  const { data: cart, isLoading } = useCart(userId, storeId);
  const clearCartMutation = useClearCart(userId, storeId);

  if (isLoading || !cart) return <div>Loading cart...</div>;
  if (cart.items.length === 0) return <div>Keranjang kosong.</div>;

  // Calculate total from cart items
  const totalAmount = cart.items.reduce(
    (sum, item) => sum + Number(item.unitPriceSnapshot) * item.qty,
    0
  );

  const handleClearCart = async () => {
    try {
      await clearCartMutation.mutateAsync();
    } catch {
      alert("Gagal menghapus semua item");
    }
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Keranjang Belanja</h2>
      {cart.items.map((item) => (
        <CartItem key={item.id} item={item} userId={userId} />
      ))}
      <div className="flex justify-between items-center mt-4">
        <div className="font-semibold">
          Total: Rp {totalAmount.toLocaleString()}
        </div>
        <Button
          variant="destructive"
          onClick={handleClearCart}
          disabled={clearCartMutation.isPending}
        >
          {clearCartMutation.isPending ? "Menghapus..." : "Hapus Semua"}
        </Button>
      </div>
    </div>
  );
}
