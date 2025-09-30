"use client";

import React from "react";
import {
  CheckCircle,
  Clock,
  Package,
  Truck,
  ShoppingBag,
  XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface OrderProgressProps {
  status: string;
  className?: string;
}

export default function OrderProgress({
  status,
  className,
}: OrderProgressProps) {
  const steps = [
    { key: "PENDING_PAYMENT", label: "Payment Pending", icon: Clock },
    { key: "PAID", label: "Payment Confirmed", icon: CheckCircle },
    { key: "PROCESSING", label: "Processing", icon: Package },
    { key: "SHIPPED", label: "Shipped", icon: Truck },
    { key: "COMPLETED", label: "Delivered", icon: ShoppingBag },
  ];

  const getCurrentStepIndex = () => {
    if (status === "CANCELLED" || status === "EXPIRED") return -1;
    return steps.findIndex((step) => step.key === status);
  };

  const currentStepIndex = getCurrentStepIndex();
  const isCancelled = status === "CANCELLED" || status === "EXPIRED";

  if (isCancelled) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm",
          className
        )}
      >
        <div className="flex items-center justify-center text-rose-600">
          <XCircle className="w-5 h-5 mr-2" />
          <span className="font-medium">Order {status.toLowerCase()}</span>
        </div>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "rounded-2xl border border-border/60 bg-card/80 p-5 shadow-sm",
        className
      )}
    >
      <div className="flex items-center">
        {steps.map((step, index) => {
          const isCompleted = index < currentStepIndex;
          const isCurrent = index === currentStepIndex;
          const Icon = step.icon;

          return (
            <div key={step.key} className="flex flex-1 items-center">
              {index > 0 && (
                <div
                  className={cn("h-1 flex-1 rounded-full transition-all", {
                    "bg-primary": index <= currentStepIndex,
                    "bg-border": index > currentStepIndex,
                  })}
                />
              )}

              <div className="flex flex-col items-center gap-2">
                <div
                  className={cn(
                    "flex h-10 w-10 items-center justify-center rounded-full border-2 transition-all duration-300",
                    {
                      "border-primary/20 bg-primary/10 text-primary":
                        isCompleted,
                      "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/40":
                        isCurrent,
                      "border-border bg-muted text-muted-foreground":
                        !isCompleted && !isCurrent,
                    }
                  )}
                >
                  <Icon className="w-5 h-5" />
                </div>
                <span
                  className={cn("text-xs font-medium", {
                    "text-primary/80": isCompleted && !isCurrent,
                    "text-primary": isCurrent,
                    "text-muted-foreground": !isCompleted && !isCurrent,
                  })}
                >
                  {step.label}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
