"use client";

import { Package, MapPin, X } from "lucide-react";
import { FaTruckFast } from "react-icons/fa6";

type OrderProgressProps = {
  status: string;
  storeName?: string;
  storeCity?: string;
  addressCity?: string;
  addressProvince?: string;
  headline: string;
};

export default function OrderProgress({
  status,
  storeName,
  storeCity,
  addressCity,
  addressProvince,
  headline,
}: OrderProgressProps) {
  const steps = [
    "PENDING_PAYMENT",
    "PAYMENT_REVIEW",
    "PAID",
    "PROCESSING",
    "SHIPPED",
    "CONFIRMED",
  ];
  const currentStepIndex = steps.indexOf(status);
  const progressPercentage =
    currentStepIndex >= 0 ? ((currentStepIndex + 1) / steps.length) * 100 : 0;
  const isCancelled = ["CANCELLED", "EXPIRED"].includes(status);

  return (
    <div className="flex-1 bg-gradient-to-br from-muted/40 to-muted/20 rounded-xl p-4 sm:p-6 border border-border/40 shadow-sm">
      <div className="flex items-center gap-3 sm:gap-4 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-lg flex items-center justify-center border border-primary/20 shadow-sm">
          <Package className="w-5 h-5 text-primary" />
        </div>
        <h2 className="text-lg font-medium text-foreground">{headline}</h2>
      </div>

      {/* Route chips */}
      <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
        <div className="px-3 py-2 bg-card/90 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-border/50 shadow-sm gap-2 w-full sm:w-auto sm:justify-start hover:shadow-md transition-shadow">
          <div className="p-1 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full">
            <FaTruckFast className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-foreground">
            {storeName || "Store"}, {storeCity || "City"}
          </span>
        </div>
        <div className="hidden sm:flex flex-1 items-center justify-center px-3">
          <div className="flex items-center gap-2">
            {isCancelled ? (
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-100/80 text-rose-700 border border-rose-200 shadow-sm">
                <X className="w-4 h-4" />
              </div>
            ) : (
              Array.from({ length: 6 }).map((_, i) => (
                <span
                  key={i}
                  className="w-1.5 h-1.5 bg-gradient-to-r from-primary to-primary/60 rounded-full animate-pulse"
                  style={{ animationDelay: `${i * 0.1}s` }}
                ></span>
              ))
            )}
          </div>
        </div>
        <div className="px-3 py-2 bg-card/90 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-border/50 shadow-sm gap-2 w-full sm:w-auto sm:justify-start hover:shadow-md transition-shadow">
          <div className="p-1 bg-gradient-to-br from-primary/20 to-primary/10 rounded-full">
            <MapPin className="w-3.5 h-3.5 text-primary" />
          </div>
          <span className="text-xs sm:text-sm font-medium text-foreground">
            {addressCity || "Delivery City"}, {addressProvince || "Province"}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-4">
        {isCancelled ? (
          <div className="flex items-center justify-center py-3 bg-gradient-to-r from-destructive/10 to-destructive/5 rounded-lg border border-destructive/20 shadow-sm">
            <span className="text-xs sm:text-sm text-destructive font-semibold">
              Order {status.toLowerCase()}
            </span>
          </div>
        ) : (
          <>
            <div className="h-3 bg-gradient-to-r from-muted/80 via-muted/60 to-muted/80 rounded-full overflow-hidden mb-4 shadow-inner border border-border/30">
              <div
                className="h-3 bg-gradient-to-r from-primary via-primary/90 to-primary/80 rounded-full transition-all duration-700 ease-out shadow-lg relative overflow-hidden"
                style={{ width: `${progressPercentage}%` }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
              </div>
            </div>
            <div className="flex justify-between items-center">
              {steps.map((step, i) => {
                const isCompleted = i < currentStepIndex;
                const isCurrent = i === currentStepIndex;
                return (
                  <div
                    key={step}
                    className="flex flex-col items-center gap-1.5"
                  >
                    <div
                      className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                        isCompleted || isCurrent
                          ? "bg-gradient-to-br from-primary to-primary/80 border-primary scale-110 shadow-md shadow-primary/30"
                          : "bg-muted border-border/60"
                      }`}
                    />
                    <span
                      className={`text-[0.65rem] sm:text-xs font-medium ${
                        isCompleted || isCurrent
                          ? "text-primary font-semibold"
                          : "text-muted-foreground"
                      }`}
                    >
                      {step.replace("_", " ").split(" ")[0]}
                    </span>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
