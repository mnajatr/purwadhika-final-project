"use client";

import React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle } from "lucide-react";
import { PayNowButton } from "@/components/payment";
import PaymentUpload from "./PaymentUpload";
import ConfirmButton from "./ConfirmButton";

type OrderSummaryProps = {
  order: {
    id: number;
    status: string;
    paymentMethod: string;
    grandTotal: string | number;
    userId?: number;
    payment?: {
      status: string;
      amount: string | number;
      proofUrl?: string;
    };
  };
  items: Array<{
    id: number;
    productId: number;
    totalAmount: string | number;
    product?: {
      name: string;
    };
  }>;
  onRefresh: () => void;
  formatCurrency: (amount: string | number) => string;
  CancelButton?: React.ComponentType<{ orderId: number; userId?: number }>;
};

export default function OrderSummary({
  order,
  items,
  onRefresh,
  formatCurrency,
  CancelButton,
}: OrderSummaryProps) {
  const getPaymentBadgeStyle = () => {
    if (
      order.payment?.status === "PAID" ||
      ["PAID", "PROCESSING", "SHIPPED", "CONFIRMED", "COMPLETED"].includes(
        order.status
      )
    ) {
      return "bg-emerald-100/80 text-emerald-700 border-emerald-200";
    }
    if (order.payment?.status === "REJECTED") {
      return "bg-red-100/80 text-red-700 border-red-200";
    }
    if (order.status === "PENDING_PAYMENT") {
      return "bg-amber-100/80 text-amber-700 border-amber-200";
    }
    if (order.status === "CANCELLED" || order.status === "EXPIRED") {
      return "bg-rose-100/80 text-rose-700 border-rose-200";
    }
    return "bg-muted text-muted-foreground border-border/60";
  };

  const getPaymentBadgeLabel = () => {
    if (
      order.payment?.status === "PAID" ||
      ["PAID", "PROCESSING", "SHIPPED", "CONFIRMED", "COMPLETED"].includes(
        order.status
      )
    ) {
      return "Payment Success";
    }
    if (order.payment?.status === "REJECTED") {
      return "Payment Rejected";
    }
    if (order.status === "PENDING_PAYMENT") {
      return "Payment Pending";
    }
    if (order.status === "CANCELLED" || order.status === "EXPIRED") {
      return "Cancelled";
    }
    return "Payment Review";
  };

  const renderCancelButton = () =>
    CancelButton ? (
      <CancelButton orderId={order.id} userId={order.userId} />
    ) : (
      <Button
        variant="destructive"
        className="px-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
        disabled={order.status !== "PENDING_PAYMENT"}
      >
        Cancel Order
      </Button>
    );

  return (
    <div className="bg-card/80 rounded-xl p-6 shadow-sm border border-border/60">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">Order Summary</h3>
        <Badge className={`px-3 py-1 ${getPaymentBadgeStyle()}`}>
          {getPaymentBadgeLabel()}
        </Badge>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Here&apos;s your summary for the product you bought.
      </p>
      <div className="space-y-3 mb-6">
        {items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-foreground font-medium">
              {item.product?.name || `Product #${item.productId}`}
            </span>
            <span className="text-foreground font-medium">
              {formatCurrency(item.totalAmount)}
            </span>
          </div>
        ))}
      </div>
      <div className="border-t border-border pt-4 mb-6">
        <div className="flex justify-between items-center">
          <span className="text-lg font-semibold text-foreground">Total</span>
          <span className="text-lg font-bold text-primary">
            {formatCurrency(order.grandTotal)}
          </span>
        </div>
      </div>

      {/* Payment Actions */}
      {order.status === "PENDING_PAYMENT" &&
        order.paymentMethod === "GATEWAY" && (
          <div className="flex gap-3">
            <PayNowButton
              orderId={order.id}
              orderTotal={Number(order.grandTotal)}
              onPaymentSuccess={onRefresh}
              onPaymentPending={onRefresh}
              onPaymentError={() => {}}
              className="flex-1 bg-primary-gradient hover:opacity-95"
            />
            {renderCancelButton()}
          </div>
        )}

      {order.status === "PENDING_PAYMENT" &&
        order.paymentMethod === "MANUAL_TRANSFER" && (
          <div className="space-y-3 mt-4">
            {order.payment?.status === "REJECTED" ? (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm font-medium">
                  Your payment proof was rejected. Please upload a new payment
                  proof.
                </p>
              </div>
            ) : (
              <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
                <AlertCircle className="w-4 h-4" />
                <p className="text-sm">Upload payment proof to proceed</p>
              </div>
            )}
            <PaymentUpload
              orderId={order.id}
              onUploadSuccess={onRefresh}
              cancelButton={renderCancelButton()}
            />
          </div>
        )}

      {order.status === "SHIPPED" && (
        <ConfirmButton orderId={order.id} userId={order.userId} />
      )}
    </div>
  );
}
