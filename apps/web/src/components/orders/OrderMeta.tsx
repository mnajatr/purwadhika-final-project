"use client";

import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Timer } from "lucide-react";

interface OrderMetaProps {
  orderId: number; // not displayed (avoid duplication)
  status: string;
  paymentMethod?: string; // not displayed (avoid duplication)
  createdAt?: string; // ISO string, used for countdown only
}

// (Keep minimal helpers to avoid linting for unused code)

export default function OrderMeta({ status, createdAt }: OrderMetaProps) {
  const [countdown, setCountdown] = React.useState<string | null>(null);

  // Show a 24h countdown for pending payments if createdAt exists
  React.useEffect(() => {
    if (status !== "PENDING_PAYMENT" || !createdAt) {
      setCountdown(null);
      return;
    }
    const start = new Date(createdAt).getTime();
    const due = start + 60 * 60 * 1000; // 1 hour

    const update = () => {
      const now = Date.now();
      const diff = due - now;
      if (diff <= 0) {
        setCountdown("Expired");
        return;
      }
      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);
      setCountdown(
        `${hours.toString().padStart(2, "0")}:${minutes
          .toString()
          .padStart(2, "0")}:${seconds.toString().padStart(2, "0")}`
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [status, createdAt]);

  // Only a countdown banner; keep everything else in header/payment card to avoid duplicates.

  if (!(status === "PENDING_PAYMENT" && countdown)) return null;

  return (
    <Card className="rounded-2xl border border-amber-200 bg-amber-50/70 shadow-sm">
      <CardContent className="p-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-amber-800">
            <Timer className="h-4 w-4" />
            <span className="text-sm font-medium">Complete your payment</span>
          </div>
          <div className="text-base font-semibold text-amber-800 tracking-wide">
            {countdown}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
