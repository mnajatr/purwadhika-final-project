"use client";

import React from "react";
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
import { useConfirmOrder } from "@/hooks/useOrder";
import { PackageCheck } from "lucide-react";

interface ConfirmButtonProps {
  orderId: number;
  userId?: number;
}

export default function ConfirmButton({ orderId, userId }: ConfirmButtonProps) {
  const confirm = useConfirmOrder();
  const [loading, setLoading] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState<string | null>(null);
  const [open, setOpen] = React.useState(false);

  const handleConfirm = async () => {
    setErrMsg(null);
    setLoading(true);
    try {
      await confirm.mutateAsync({ orderId, userId });
      setOpen(false);
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button>
            <PackageCheck className="mr-2 h-4 w-4" />
            Confirm Receipt
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Order Receipt?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to confirm that you have received this
              order? This action confirms that the items have been delivered to
              you in good condition.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={loading}
            >
              {loading ? "Confirming..." : "Yes, Confirm Receipt"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {errMsg && <div className="text-sm text-red-600 mt-2">{errMsg}</div>}
    </div>
  );
}
