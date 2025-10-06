import { format } from "date-fns";
import {
  Receipt,
  User,
  Store,
  CreditCard,
  Calendar,
  Clock,
} from "lucide-react";

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
    <div className="bg-card border border-border rounded-2xl shadow-sm p-6 hover:shadow-md transition-shadow">
      <div className="flex items-center gap-2 mb-6 pb-4 border-b border-border">
        <div className="p-2 bg-primary/10 rounded-lg">
          <Receipt className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground">Order Summary</h2>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <User className="w-4 h-4" />
            <span>Customer</span>
          </div>
          <p className="font-semibold text-foreground text-lg">
            User #{userId}
          </p>
        </div>

        <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <Store className="w-4 h-4" />
            <span>Store</span>
          </div>
          <p className="font-semibold text-foreground text-lg">
            Store #{storeId}
          </p>
        </div>

        <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <CreditCard className="w-4 h-4" />
            <span>Payment Method</span>
          </div>
          <p className="font-semibold text-foreground text-lg uppercase">
            {paymentMethod}
          </p>
        </div>

        <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/50">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <Calendar className="w-4 h-4" />
            <span>Order Date</span>
          </div>
          <p className="font-semibold text-foreground">
            {format(new Date(createdAt), "MMM dd, yyyy")}
          </p>
          <p className="text-sm text-muted-foreground">
            {format(new Date(createdAt), "HH:mm")}
          </p>
        </div>

        <div className="space-y-2 p-4 rounded-xl bg-muted/30 border border-border/50 sm:col-span-2">
          <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
            <Clock className="w-4 h-4" />
            <span>Last Updated</span>
          </div>
          <p className="font-semibold text-foreground">
            {format(new Date(updatedAt), "MMM dd, yyyy 'at' HH:mm")}
          </p>
        </div>
      </div>
    </div>
  );
}
