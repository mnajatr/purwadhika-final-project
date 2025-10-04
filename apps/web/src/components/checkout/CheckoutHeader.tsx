"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldCheck } from "lucide-react";

type CheckoutHeaderProps = {
  selectedAddress: boolean;
  shippingMethod: boolean;
  paymentMethod: boolean;
};

export function CheckoutHeader({
  selectedAddress,
  shippingMethod,
  paymentMethod,
}: CheckoutHeaderProps) {
  const getMessage = () => {
    if (!selectedAddress) return "Please select a delivery address to continue";
    if (!shippingMethod) return "Choose your preferred shipping method";
    if (!paymentMethod) return "Select a payment method to complete your order";
    return "Review your order and place when ready";
  };

  return (
    <div className="flex items-center justify-between mb-8">
      <div className="flex items-center gap-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => window.history.back()}
          className="h-10 w-10 p-0 rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Checkout
          </h1>
          <p className="text-muted-foreground mt-1">{getMessage()}</p>
        </div>
      </div>
      <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-2xl">
        <ShieldCheck className="w-5 h-5 text-green-500" />
        <span className="text-sm font-medium text-foreground">
          Secure Checkout
        </span>
      </div>
    </div>
  );
}
