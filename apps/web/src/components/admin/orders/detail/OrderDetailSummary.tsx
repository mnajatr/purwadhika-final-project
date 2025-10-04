import { format } from "date-fns";
import { Receipt, User, Store, CreditCard, Calendar, Clock } from "lucide-react";

interface OrderDetailSummaryProps {
  userId: number;
  storeId: number;
  paymentMethod: string;
  createdAt: string;
  updatedAt: string;
}

export default function OrderDetailSummary({
  userId,
  storeId,
  paymentMethod,
  createdAt,
  updatedAt,
}: OrderDetailSummaryProps) {
  return (
    <div className="bg-card border border-border rounded-xl shadow-sm p-6">
      <div className="flex items-center gap-2 mb-6">
        <Receipt className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          Order Summary
        </h2>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <User className="w-4 h-4" />
            <span>Customer</span>
          </div>
          <p className="font-medium text-foreground">User #{userId}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Store className="w-4 h-4" />
            <span>Store</span>
          </div>
          <p className="font-medium text-foreground">Store #{storeId}</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <CreditCard className="w-4 h-4" />
            <span>Payment Method</span>
          </div>
          <p className="font-medium text-foreground uppercase">
            {paymentMethod}
          </p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Calendar className="w-4 h-4" />
            <span>Order Date</span>
          </div>
          <p className="font-medium text-foreground">
            {format(new Date(createdAt), "MMM dd, yyyy 'at' HH:mm")}
          </p>
        </div>

        <div className="space-y-1 col-span-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Clock className="w-4 h-4" />
            <span>Last Updated</span>
          </div>
          <p className="font-medium text-foreground">
            {format(new Date(updatedAt), "MMM dd, yyyy 'at' HH:mm")}
          </p>
        </div>
      </div>
    </div>
  );
}
