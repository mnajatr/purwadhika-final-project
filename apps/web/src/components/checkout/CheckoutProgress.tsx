"use client";

import { Card, CardContent } from "@/components/ui/card";
import { FaCheckCircle, FaLock } from "react-icons/fa";

type CheckoutProgressProps = {
  selectedAddress: boolean;
  shippingMethod: boolean;
  paymentMethod: boolean;
};

export function CheckoutProgress({
  selectedAddress,
  shippingMethod,
  paymentMethod,
}: CheckoutProgressProps) {
  const getProgressWidth = () => {
    if (selectedAddress && shippingMethod && paymentMethod) return "100%";
    if (shippingMethod) return "66%";
    if (selectedAddress) return "33%";
    return "0%";
  };

  return (
    <div className="lg:hidden mb-8">
      <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between relative">
            {/* Progress line */}
            <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-border -translate-y-1/2">
              <div
                className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                style={{ width: getProgressWidth() }}
              />
            </div>

            {/* Step indicators */}
            <div className="flex items-center justify-between w-full relative z-10">
              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    selectedAddress
                      ? "bg-primary text-white"
                      : "bg-background border-2 border-border"
                  }`}
                >
                  {selectedAddress ? (
                    <FaCheckCircle className="w-5 h-5" />
                  ) : (
                    "1"
                  )}
                </div>
                <span className="text-xs font-medium text-center">Address</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    shippingMethod
                      ? "bg-primary text-white"
                      : "bg-background border-2 border-border"
                  }`}
                >
                  {shippingMethod ? <FaCheckCircle className="w-5 h-5" /> : "2"}
                </div>
                <span className="text-xs font-medium text-center">Ship</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    paymentMethod
                      ? "bg-primary text-white"
                      : "bg-background border-2 border-border"
                  }`}
                >
                  {paymentMethod ? <FaCheckCircle className="w-5 h-5" /> : "3"}
                </div>
                <span className="text-xs font-medium text-center">Pay</span>
              </div>

              <div className="flex flex-col items-center gap-2">
                <div
                  className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                    selectedAddress && shippingMethod && paymentMethod
                      ? "bg-gradient-to-r from-primary to-secondary text-white animate-pulse"
                      : "bg-background border-2 border-border"
                  }`}
                >
                  <FaLock className="w-5 h-5" />
                </div>
                <span className="text-xs font-medium text-center">Order</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
