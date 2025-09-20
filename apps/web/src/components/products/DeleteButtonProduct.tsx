"use client";

import { useDeleteProduct, useDeactivateProduct } from "@/hooks/useProduct";

export default function DeleteProductButton({ slug }: { slug: string }) {
  const deleteProduct = useDeleteProduct();
  const deactivateProduct = useDeactivateProduct();

  const handleDelete = () => {
    if (confirm("Yakin ingin menghapus produk ini?")) {
      deleteProduct.mutate(slug, {
        onSuccess: () => {
          alert("Produk berhasil dihapus");
        },
        onError: (err: Error) => {
          if (err.message?.includes("Cannot delete product that has been ordered")) {
            const deactivateConfirm = confirm(
              "Produk ini tidak dapat dihapus karena sudah pernah dipesan. Apakah Anda ingin menonaktifkan produk ini sebagai gantinya?"
            );
            if (deactivateConfirm) {
              deactivateProduct.mutate(slug, {
                onSuccess: () => {
                  alert("Produk berhasil dinonaktifkan");
                },
                onError: (e: Error) => {
                  alert("Gagal menonaktifkan produk: " + e.message);
                },
              });
            }
          } else {
            alert("Gagal menghapus produk: " + err.message);
          }
        },
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleteProduct.isPending || deactivateProduct.isPending}
      className="text-red-600 hover:underline"
    >
      {deleteProduct.isPending || deactivateProduct.isPending ? "Processing..." : "Delete"}
    </button>
  );
}
