"use client";

import { useParams } from "next/navigation";
import { useDiscount } from "@/hooks/useDiscount";
import EditDiscountForm from "@/components/discount/EditDiscountForm";

export default function UpdateProductPage() {
  const { id } = useParams();
  const { data: discount, isLoading, error } = useDiscount(Number(id!));

  if (isLoading) return <p>Loading...</p>;
  if (error) return <p className="text-red-500">Gagal load produk</p>;
  if (!discount) return <p>Produk tidak ditemukan</p>;

  return <EditDiscountForm discount={discount} />;
}
