"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  AlertTriangle,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { PayNowButton } from "@/components/payment";
import PaymentUpload from "./PaymentUpload";

interface OrderActionsProps {
  order: {
    id: number;
    status: string;
    paymentMethod: string;
    grandTotal: string | number;
    userId?: number;
  };
  apiBase: string;
  onRefresh: () => void;
  CancelButton?: React.ComponentType<{ orderId: number; userId?: number }>;
  ConfirmButton?: React.ComponentType<{ orderId: number; userId?: number }>;
}

export default function OrderActions({
  order,
  apiBase,
  onRefresh,
  CancelButton,
  ConfirmButton,
}: OrderActionsProps) {

  return (
    <Card className="rounded-2xl border border-border/60 bg-card/80 shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-6">
          <div>
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Order Actions
            </h3>
            <p className="text-sm text-muted-foreground">
              Available actions for your order
            </p>
          </div>

          {/* Manual Payment Upload */}
          {order.status === "PENDING_PAYMENT" &&
            order.paymentMethod === "MANUAL_TRANSFER" && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-700">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <p>Please upload your payment proof to complete the order</p>
                </div>
                <PaymentUpload
                  orderId={order.id}
                  apiBase={apiBase}
                  onUploadSuccess={onRefresh}
                />
              </div>
            )}

          <Separator />

          {/* Action Buttons */}
          <div className="space-y-4">
            {/* Payment Gateway Button */}
            {order.status === "PENDING_PAYMENT" &&
              order.paymentMethod === "GATEWAY" && (
                <div className="space-y-3">
                  <PayNowButton
                    orderId={order.id}
                    orderTotal={Number(order.grandTotal)}
                    onPaymentSuccess={onRefresh}
                    onPaymentPending={onRefresh}
                    onPaymentError={(error) =>
                      console.error("Payment error:", error)
                    }
                  />
                  <p className="text-center text-xs text-muted-foreground">
                    Secure payment powered by Midtrans
                  </p>
                </div>
              )}

            {/* Confirm Delivery Button */}
            {order.status === "SHIPPED" && ConfirmButton && (
              <div className="space-y-3">
                <ConfirmButton orderId={order.id} userId={order.userId} />
                <p className="text-xs text-muted-foreground text-center">
                  Only confirm delivery after you receive your order
                </p>
              </div>
            )}

            {/* Cancel Order Button */}
            {order.status === "PENDING_PAYMENT" && CancelButton && (
              <div className="space-y-3">
                <CancelButton orderId={order.id} userId={order.userId} />
                <p className="text-center text-xs text-muted-foreground">
                  You can cancel your order before payment
                </p>
              </div>
            )}

            {/* Secondary Actions */}
            <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("/support", "_blank")}
              >
                <HelpCircle className="w-4 h-4 mr-1" />
                Need Help?
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("/faq", "_blank")}
              >
                <MessageSquare className="w-4 h-4 mr-1" />
                FAQ
              </Button>
            </div>
          </div>

          {/* Order Status Info */}
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <div className="flex items-start space-x-3">
              <div className="mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-primary"></div>
              <div className="text-sm">
                <p className="mb-1 font-medium text-foreground">
                  What happens next?
                </p>
                {order.status === "PENDING_PAYMENT" &&
                  order.paymentMethod === "MANUAL_TRANSFER" && (
                    <p className="text-muted-foreground">
                      Upload your payment proof and we&apos;ll verify it within
                      1-2 business days.
                    </p>
                  )}
                {order.status === "PENDING_PAYMENT" &&
                  order.paymentMethod === "GATEWAY" && (
                    <p className="text-muted-foreground">
                      Complete your payment and we&apos;ll immediately process
                      your order.
                    </p>
                  )}
                {order.status === "PAID" && (
                  <p className="text-muted-foreground">
                    Your order is being prepared and will be shipped soon.
                  </p>
                )}
                {order.status === "PROCESSING" && (
                  <p className="text-muted-foreground">
                    Your order is being processed and packed for shipment.
                  </p>
                )}
                {order.status === "SHIPPED" && (
                  <p className="text-muted-foreground">
                    Your order is on the way. Confirm delivery once you receive
                    it.
                  </p>
                )}
                {order.status === "COMPLETED" && (
                  <p className="text-muted-foreground">
                    Thank you for your order! Please rate your experience.
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
