import { format } from "date-fns";
import Image from "next/image";
import { CreditCard, FileText, ZoomIn } from "lucide-react";
import type { AdminOrderDetailPayment } from "@repo/schemas";

interface OrderDetailPaymentProps {
  payment: AdminOrderDetailPayment;
  onImageClick: () => void;
}

export default function OrderDetailPayment({
  payment,
  onImageClick,
}: OrderDetailPaymentProps) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <CreditCard className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          Payment Details
        </h2>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-muted-foreground">Payment ID</span>
          <span className="font-medium text-foreground">#{payment.id}</span>
        </div>

        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-muted-foreground">Status</span>
          <span className="px-2 py-1 bg-primary/10 text-primary text-xs font-medium rounded">
            {payment.status}
          </span>
        </div>

        <div className="flex justify-between items-center py-2">
          <span className="text-sm text-muted-foreground">Amount</span>
          <span className="font-semibold text-foreground">
            Rp {payment.amount.toLocaleString()}
          </span>
        </div>

        <div className="border-t border-border pt-4">
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Created</span>
              <span className="text-foreground">
                {format(new Date(payment.createdAt), "MMM dd, yyyy 'at' HH:mm")}
              </span>
            </div>
            {payment.reviewedAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Reviewed</span>
                <span className="text-foreground">
                  {format(
                    new Date(payment.reviewedAt),
                    "MMM dd, yyyy 'at' HH:mm"
                  )}
                </span>
              </div>
            )}
            {payment.paidAt && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Paid</span>
                <span className="text-foreground">
                  {format(new Date(payment.paidAt), "MMM dd, yyyy 'at' HH:mm")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {payment.proofImageUrl && (
        <div className="mt-6">
          <h3 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Payment Proof
          </h3>
          <div
            className="border border-border rounded-lg overflow-hidden bg-muted/20 cursor-pointer hover:border-primary transition-colors group relative"
            onClick={onImageClick}
          >
            <Image
              src={payment.proofImageUrl}
              alt="Payment Proof"
              width={400}
              height={256}
              className="w-full max-h-64 object-contain"
            />
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
              <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
