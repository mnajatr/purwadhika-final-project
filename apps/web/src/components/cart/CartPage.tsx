"use client";

import { useEffect } from "react";
import { useCartStore } from "@/stores/cart-store";
import { CartItem } from "./CartItem";
import { Button } from "../ui/button";

interface CartPageProps {
  userId: number;
}

export function CartPage({ userId }: CartPageProps) {
  const { cart, totalAmount, isLoading, clearCart, setStoreId } =
    useCartStore();

  useEffect(() => {
    if (userId) {
      setStoreId(1); // default storeId, ganti sesuai kebutuhan
      useCartStore.getState().initializeCart(userId);
    }
  }, [userId, setStoreId]);

  if (isLoading || !cart) return <div>Loading cart...</div>;
  if (cart.items.length === 0) return <div>Keranjang kosong.</div>;

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">Keranjang Belanja</h2>
      {cart?.items.map((item) => (
        <CartItem key={item.id} item={item} userId={userId} />
      ))}
      <div className="flex justify-between items-center mt-4">
        <div className="font-semibold">
          Total: Rp {totalAmount.toLocaleString()}
        </div>
        <Button variant="destructive" onClick={() => clearCart(userId)}>
          Hapus Semua
        </Button>
      </div>
    </div>
  );
}
