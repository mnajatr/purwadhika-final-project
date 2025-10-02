"use client";

import { useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useProduct } from "@/hooks/useProduct";
import UpdateProductForm, {
  ProductForUpdate,
} from "@/components/products/UpdateProductForm";

export default function UpdateProductPage() {
  const { slug } = useParams();
  const { data: product, isLoading, error } = useProduct(slug as string);

  const [file, setFile] = useState<File | null>(null);

  async function urlToFile(url: string, filename: string, mimeType: string) {
    const response = await fetch(url);
    const blob = await response.blob();
    return new File([blob], filename, { type: mimeType });
  }

  useEffect(() => {
    if (product?.imageUrl) {
      urlToFile(product.imageUrl, "image.jpg", "image/jpeg").then(setFile);
    }
  }, [product?.imageUrl]);

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">Gagal load produk</p>;
  if (!product) return <p>Produk tidak ditemukan</p>;

  const productz: ProductForUpdate = {
    id: Number(product?.id) ?? 0,
    name: product?.name,
    slug: product?.slug,
    description: product?.description,
    price: product?.price,
    weight: product?.weight,
    width: product?.width,
    height: product?.height,
    length: product?.length,
    categoryId: product?.categoryId,
    images: file ? [file] : [], // file dipakai di sini
  };

  return <UpdateProductForm product={productz} />;
}
