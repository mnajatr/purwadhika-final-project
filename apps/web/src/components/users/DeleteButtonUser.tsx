"use client";

import { useDeleteUser } from "@/hooks/useUsers";

export default function DeleteButtonUser({ id }: { id: number }) {
  const deleteUser = useDeleteUser();

  const handleDelete = () => {
    if (confirm("Yakin ingin menghapus user ini?")) {
      deleteUser.mutate(id, {
        onSuccess: () => {
          alert("User berhasil dihapus");
        },
        onError: (err: any) => {
          alert("Gagal menghapus user: " + err.message);
        },
      });
    }
  };

  return (
    <button
      type="button"
      onClick={handleDelete}
      disabled={deleteUser.isLoading}
      className="text-red-600 hover:underline"
    >
      {deleteUser.isLoading ? "Deleting..." : "Delete"}
    </button>
  );
}
