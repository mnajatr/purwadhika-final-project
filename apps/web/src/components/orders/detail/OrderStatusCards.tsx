"use client";

import { Calendar } from "lucide-react";
import { FaTruckFast } from "react-icons/fa6";

type OrderStatusCardsProps = {
  createdAt?: string;
  formatDateShort: (dateString?: string) => string | null;
};

export default function OrderStatusCards({
  createdAt,
  formatDateShort,
}: OrderStatusCardsProps) {
  return (
    <div className="flex gap-3 sm:gap-4 lg:gap-6">
      {/* Order Created Card */}
      <div className="bg-muted/30 rounded-2xl p-3 sm:p-4 lg:p-6 min-w-[120px] lg:min-w-[140px] border border-border/30 flex-1 lg:flex-none">
        <div className="flex items-start justify-start mb-20">
          <div className="w-10 h-10 bg-card rounded-2xl flex items-center justify-center border border-border/60 shadow-sm">
            <Calendar className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Order created</p>
          <p className="font-semibold text-foreground">
            {createdAt ? formatDateShort(createdAt) : "-"}
          </p>
        </div>
      </div>

      {/* Estimated Arrival Card */}
      <div className="bg-muted/30 rounded-2xl p-3 sm:p-4 lg:p-6 min-w-[120px] lg:min-w-[140px] border border-border/30 flex-1 lg:flex-none">
        <div className="flex items-start justify-start mb-20">
          <div className="w-10 h-10 bg-card rounded-2xl flex items-center justify-center border border-border/60 shadow-sm">
            <FaTruckFast className="w-5 h-5 text-primary" />
          </div>
        </div>
        <div className="text-center">
          <p className="text-sm text-muted-foreground mb-1">Estimated Arrival</p>
          <p className="font-semibold text-foreground">
            {createdAt
              ? formatDateShort(
                  new Date(
                    new Date(createdAt).getTime() + 7 * 24 * 60 * 60 * 1000
                  ).toISOString()
                )
              : "Calculating..."}
          </p>
        </div>
      </div>
    </div>
  );
}
