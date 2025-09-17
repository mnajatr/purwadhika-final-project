"use client";

import { useDeleteDiscount } from "@/hooks/useDiscount";

export default function DeleteDiscountButton({ id }: { id: number }) {
  const deleteDiscount = useDeleteDiscount();

  const handleDelete = () => {
    if (confirm("Yakin ingin menghapus discount ini?")) {
      deleteDiscount.mutate(id, {
        onSuccess: () => {
          alert("Discount berhasil dihapus");
        },
        onError: (err: any) => {
          alert("Gagal menghapus discount: " + err.message);
        },
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleteDiscount.isLoading}
      className="text-red-600 hover:underline"
    >
      {deleteDiscount.isLoading ? "Deleting..." : "Delete"}
    </button>
  );
}
