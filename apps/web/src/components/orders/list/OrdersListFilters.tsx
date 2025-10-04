"use client";

import * as React from "react";
import { motion } from "framer-motion";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Search, Calendar, X } from "lucide-react";

interface OrdersListFiltersProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  dateRange: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange: (range: {
    from: Date | undefined;
    to: Date | undefined;
  }) => void;
  status: string | null;
  onStatusChange: (status: string | null) => void;
}

const STATUSES = [
  { key: null, label: "All Orders" },
  { key: "PENDING_PAYMENT", label: "Pending Payment" },
  { key: "PAYMENT_REVIEW", label: "Payment Review" },
  { key: "PROCESSING", label: "Processing" },
  { key: "SHIPPED", label: "Shipped" },
  { key: "CONFIRMED", label: "Confirmed" },
  { key: "CANCELLED", label: "Cancelled" },
];

export default function OrdersListFilters({
  searchInput,
  onSearchChange,
  dateRange,
  onDateRangeChange,
  status,
  onStatusChange,
}: OrdersListFiltersProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by Order ID or Product Name..."
            value={searchInput}
            onChange={(e) => onSearchChange(e.target.value)}
            className="h-11 w-full rounded-xl border border-border/60 bg-card/80 backdrop-blur-sm pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`h-11 sm:w-72 rounded-xl border-border/60 bg-card/80 backdrop-blur-sm justify-start text-left font-normal hover:bg-card/90 transition-all ${
                !dateRange.from && "text-muted-foreground"
              }`}
            >
              <Calendar className="mr-2 h-4 w-4 flex-shrink-0" />
              <span className="truncate">
                {dateRange.from ? (
                  dateRange.to ? (
                    dateRange.from.getTime() === dateRange.to.getTime() ? (
                      format(dateRange.from, "PPP")
                    ) : (
                      <>
                        {format(dateRange.from, "MMM dd")} -{" "}
                        {format(dateRange.to, "MMM dd, yyyy")}
                      </>
                    )
                  ) : (
                    format(dateRange.from, "PPP")
                  )
                ) : (
                  "Pick date range"
                )}
              </span>
              {(dateRange.from || dateRange.to) && (
                <X
                  className="ml-auto h-4 w-4 flex-shrink-0 opacity-50 hover:opacity-100"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDateRangeChange({ from: undefined, to: undefined });
                  }}
                />
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 rounded-2xl border-border/60 shadow-lg"
            align="start"
          >
            <div className="p-4 space-y-3">
              <CalendarComponent
                mode="range"
                selected={{
                  from: dateRange.from,
                  to: dateRange.to,
                }}
                onSelect={(range: { from?: Date; to?: Date } | undefined) => {
                  onDateRangeChange({
                    from: range?.from,
                    to: range?.to,
                  });
                }}
                initialFocus
                className="rounded-lg"
                numberOfMonths={1}
              />
              {(dateRange.from || dateRange.to) && (
                <div className="flex gap-2 pt-3 border-t border-border/40">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      onDateRangeChange({ from: undefined, to: undefined });
                    }}
                    className="flex-1 rounded-lg"
                  >
                    Clear
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => {
                      const today = new Date();
                      onDateRangeChange({ from: today, to: today });
                    }}
                    className="flex-1 rounded-lg bg-primary-gradient hover:opacity-90"
                  >
                    Today
                  </Button>
                </div>
              )}
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        {STATUSES.map((s) => {
          const active = status === s.key;
          return (
            <motion.button
              key={s.key || "all"}
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
              animate={{
                backgroundColor: active
                  ? "rgb(152, 224, 121)"
                  : "rgb(229, 246, 220)",
                color: active ? "rgb(255, 255, 255)" : "rgb(74, 122, 50)",
              }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25,
              }}
              onClick={() => onStatusChange(s.key)}
              className={`relative overflow-hidden whitespace-nowrap rounded-full px-6 py-2.5 text-sm font-medium shadow-sm ${
                active ? "shadow-lg shadow-[#98E079]/40" : ""
              }`}
            >
              {active && (
                <motion.div
                  layoutId="activeStatus"
                  className="absolute inset-0 bg-gradient-to-r from-[#98E079] to-[#BBEB88]"
                  initial={false}
                  transition={{
                    type: "spring",
                    stiffness: 300,
                    damping: 30,
                  }}
                />
              )}
              <span className="relative z-10">{s.label}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
