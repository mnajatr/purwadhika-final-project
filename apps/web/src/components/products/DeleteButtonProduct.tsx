"use client";

import { useDeleteProduct } from "@/hooks/useProduct";

export default function DeleteProductButton({ slug }: { slug: string }) {
  const deleteProduct = useDeleteProduct();

  const handleDelete = () => {
    if (confirm("Yakin ingin menghapus produk ini?")) {
      deleteProduct.mutate(slug, {
        onSuccess: () => {
          alert("Produk berhasil dihapus");
        },
        onError: (err: any) => {
          alert("Gagal menghapus produk: " + err.message);
        },
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleteProduct.isLoading}
      className="text-red-600 hover:underline"
    >
      {deleteProduct.isLoading ? "Deleting..." : "Delete"}
    </button>
  );
}
