"use client";

import { useDeleteProduct, useDeactivateProduct } from "@/hooks/useProduct";
import { toast } from "sonner";
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

export default function DeleteProductButton({ slug }: { slug: string }) {
  const deleteProduct = useDeleteProduct();
  const deactivateProduct = useDeactivateProduct();

  const handleDelete = () => {
    deleteProduct.mutate(slug, {
      onSuccess: () => {
        toast.success("Produk berhasil dihapus");
      },
      onError: (err: Error) => {
        if (
          err.message?.includes("Cannot delete product that has been ordered")
        ) {
          // otomatis tawarkan nonaktifkan
          deactivateProduct.mutate(slug, {
            onSuccess: () => {
              toast.success("Produk berhasil dinonaktifkan");
            },
            onError: (e: Error) => {
              toast.error("Gagal menonaktifkan produk: " + e.message);
            },
          });
        } else {
          toast.error("Gagal menghapus produk: " + err.message);
        }
      },
    });
  };

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <button
          type="button"
          disabled={deleteProduct.isPending || deactivateProduct.isPending}
          className="text-red-600 hover:underline"
        >
          {deleteProduct.isPending || deactivateProduct.isPending
            ? "Processing..."
            : "Delete"}
        </button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
          <AlertDialogDescription>
            Yakin ingin menghapus produk ini? Tindakan ini tidak bisa
            dibatalkan.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction onClick={handleDelete}>
            Ya, Hapus
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
