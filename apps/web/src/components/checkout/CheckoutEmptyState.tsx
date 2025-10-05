"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Package } from "lucide-react";

export function CheckoutEmptyState() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <div className="text-center space-y-4 max-w-md">
        <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
          <Package className="w-8 h-8 text-muted-foreground" />
        </div>
        <div className="space-y-2">
          <h2 className="text-xl font-semibold text-foreground">
            Your cart is empty
          </h2>
          <p className="text-muted-foreground">
            Please add items to your cart before proceeding to checkout.
          </p>
        </div>
        <Button onClick={() => window.history.back()} className="mt-4">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Continue Shopping
        </Button>
      </div>
    </div>
  );
}
