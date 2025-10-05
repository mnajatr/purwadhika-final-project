"use client";

import { useState } from "react";
import { useDeleteDiscount } from "@/hooks/useDiscount";
import { Button } from "@/components/ui/button";
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
import { toast } from "sonner";

export default function DeleteDiscountButton({ id }: { id: number }) {
  const deleteDiscount = useDeleteDiscount();
  const [open, setOpen] = useState(false);

  const handleDelete = () => {
    deleteDiscount.mutate(id, {
      onSuccess: () => {
        toast.success("✅ Discount berhasil dihapus");
        setOpen(false);
      },
      onError: (err) => {
        toast.error("❌ Gagal menghapus discount: " + err.message);
      },
    });
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm">
          {deleteDiscount.isPending ? "Deleting..." : "Delete"}
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Hapus Discount?</AlertDialogTitle>
          <AlertDialogDescription>
            Tindakan ini tidak bisa dibatalkan. Discount akan dihapus secara
            permanen dari sistem.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <AlertDialogFooter>
          <AlertDialogCancel>Batal</AlertDialogCancel>
          <AlertDialogAction
            onClick={handleDelete}
            disabled={deleteDiscount.isPending}
          >
            {deleteDiscount.isPending ? "Menghapus..." : "Ya, Hapus"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
