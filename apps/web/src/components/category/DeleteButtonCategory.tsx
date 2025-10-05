"use client";

import { useDeleteCategory } from "@/hooks/useCategory";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface DeleteCategoryButtonProps {
  id: number;
  onSuccess?: () => void;
}

export default function DeleteCategoryButton({
  id,
  onSuccess,
}: DeleteCategoryButtonProps) {
  const deleteCategory = useDeleteCategory();

  const handleDelete = () => {
    deleteCategory.mutate(id, {
      onSuccess: () => {
        toast.success("✅ Category berhasil dihapus");
        onSuccess?.();
      },
      onError: (err: Error) => {
        toast.error(`❌ Gagal menghapus category: ${err.message}`);
      },
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={deleteCategory.isPending}
          className="text-red-600 hover:underline"
        >
          {deleteCategory.isPending ? "Processing..." : "Delete"}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Apakah kamu yakin?</AlertDialogTitle>
          <AlertDialogDescription>
            Category ini akan dihapus secara permanen dan tidak bisa
            dikembalikan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteCategory.isPending}
          >
            {deleteCategory.isPending ? "Menghapus..." : "Ya, Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
