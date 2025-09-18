"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useProduct } from "@/hooks/useProduct";
import { useAddToCart } from "@/hooks/useCart";
import { toast } from "sonner";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, error } = useProduct(slug);
  const [userId, setUserId] = useState<number>(1);
  const [quantity, setQuantity] = useState(1);
  
  const addToCartMutation = useAddToCart(userId, 1);

  // Get development user ID from localStorage
  useEffect(() => {
    const devUserId = localStorage.getItem("devUserId");
    if (devUserId && devUserId !== "none") {
      setUserId(parseInt(devUserId));
    } else {
      setUserId(1); // Default user for demo
    }
  }, []);

  const handleAddToCart = async () => {
    if (!product || !userId) return;

    try {
      await addToCartMutation.mutateAsync({
        productId: parseInt(product.id),
        qty: quantity,
        storeId: 1,
        userId: userId,
      });
      toast.success(`${quantity} ${product.name} berhasil ditambahkan ke keranjang!`);
      setQuantity(1); // Reset quantity after adding
    } catch (error) {
      console.error("Failed to add to cart:", error);
      toast.error("Gagal menambahkan produk ke keranjang");
    }
  };

  if (isLoading) return <p className="p-6 text-center">Loading...</p>;
  if (error instanceof Error)
    return <p className="p-6 text-center text-red-500">{error.message}</p>;
  if (!product)
    return <p className="p-6 text-center text-red-500">Product not found</p>;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Gambar Produk */}
        <div className="relative w-full h-80 md:h-[500px]">
          <Image
            src={product.imageUrl}
            alt={product.name}
            fill
            className="object-cover rounded-2xl shadow-md"
          />
        </div>

        {/* Detail Produk */}
        <div className="flex flex-col justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>
            <p className="text-gray-600 mb-6">{product.description}</p>
            <p className="text-indigo-600 font-bold text-2xl mb-6">
              Rp {product.price.toLocaleString("id-ID")}
            </p>

            {/* Info Tambahan */}
            <div className="space-y-3 text-sm">
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Kategori</span>
                <span className="font-medium">{product.category}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Berat</span>
                <span className="font-medium">{product.weight} gram</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Volume</span>
                <span className="font-medium">
                  {(product.weight ?? 0) *
                    (product.length ?? 0) *
                    (product.height ?? 0)}
                </span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Toko</span>
                <span className="font-medium">{product.store}</span>
              </div>
            </div>
          </div>

          {/* Quantity Selector */}
          <div className="mt-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Quantity
            </label>
            <div className="flex items-center space-x-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
              >
                -
              </button>
              <span className="text-xl font-semibold min-w-[3rem] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-lg border border-gray-300 flex items-center justify-center hover:bg-gray-50 transition"
              >
                +
              </button>
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="mt-8 flex gap-4">
            <button className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition">
              Beli Sekarang
            </button>
            <button
              onClick={handleAddToCart}
              disabled={addToCartMutation.isPending}
              className="flex-1 border border-indigo-600 text-indigo-600 py-3 rounded-lg hover:bg-indigo-50 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {addToCartMutation.isPending ? "Menambahkan..." : "Tambah ke Keranjang"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
