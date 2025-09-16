"use client";

import { useParams } from "next/navigation";
import { useProduct } from "@/hooks/useProduct";
import UpdateProductForm from "@/components/products/UpdateProductForm";

export default function UpdateProductPage() {
  const { slug } = useParams();
  const { data: product, isLoading, error } = useProduct(slug as string);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">Gagal load produk</p>;
  if (!product) return <p>Produk tidak ditemukan</p>;

  return <UpdateProductForm product={product} />;
}
