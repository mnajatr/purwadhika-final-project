"use client";

import { useParams } from "next/navigation";
import Image from "next/image";
import { useProduct } from "@/hooks/useProduct";

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading, error } = useProduct(slug);

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
                <span className="font-medium">{product.volume}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-gray-500">Toko</span>
                <span className="font-medium">{product.store}</span>
              </div>
            </div>
          </div>

          {/* Tombol Aksi */}
          <div className="mt-8 flex gap-4">
            <button className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition">
              Beli Sekarang
            </button>
            <button className="flex-1 border border-indigo-600 text-indigo-600 py-3 rounded-lg hover:bg-indigo-50 transition">
              Tambah ke Keranjang
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
