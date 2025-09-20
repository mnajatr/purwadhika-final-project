"use client";

import { useDeleteCategory } from "@/hooks/useCategory";

interface DeleteCategoryButtonProps {
  id: number;
  onSuccess?: () => void; // opsional callback setelah sukses
}

export default function DeleteCategoryButton({
  id,
  onSuccess,
}: DeleteCategoryButtonProps) {
  const deleteCategory = useDeleteCategory();

  const handleDelete = () => {
    if (confirm("Yakin ingin menghapus category ini?")) {
      deleteCategory.mutate(id, {
        onSuccess: () => {
          alert("✅ Category berhasil dihapus");
          onSuccess?.();
        },
        onError: (err: any) => {
          alert("❌ Gagal menghapus category: " + err.message);
        },
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleteCategory.isLoading}
      className="text-red-600 hover:underline"
    >
      {deleteCategory.isLoading ? "Deleting..." : "Delete"}
    </button>
  );
}
