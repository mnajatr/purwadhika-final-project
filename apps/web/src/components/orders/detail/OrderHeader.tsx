"use client";

import React from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Copy,
  ArrowLeft,
  RefreshCw,
  Share2,
  Receipt,
  MoreHorizontal,
  Timer,
  Clock,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type OrderHeaderProps = {
  orderId: number;
  status: string;
  countdown: string | null;
  isLoading?: boolean;
  onRefresh: () => void;
  onCopy: (text: string, label: string) => void;
  onShare: () => void;
  onDownloadReceipt: () => void;
  getStatusColor: (status: string) => string;
};

export default function OrderHeader({
  orderId,
  status,
  countdown,
  isLoading,
  onRefresh,
  onCopy,
  onShare,
  onDownloadReceipt,
  getStatusColor,
}: OrderHeaderProps) {
  const getStatusIcon = (status: string) =>
    status === "PENDING_PAYMENT" ? <Clock className="w-4 h-4" /> : null;

  return (
    <div className="bg-card/80 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm border border-border/60 mb-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Link href="/orders">
            <Button variant="ghost" size="sm" className="p-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 sm:flex-none flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
              Order #{orderId}
            </h1>
            <Button
              aria-label="Copy Order ID"
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onCopy(String(orderId), "Order ID")}
            >
              <Copy className="h-4 w-4" />
            </Button>
            <Badge
              className={`px-2.5 py-1 font-medium border ${getStatusColor(
                status
              )}`}
            >
              {getStatusIcon(status)}
              <span className="text-xs sm:text-[0.8rem]">
                {status.replace("_", " ")}
              </span>
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="bg-card border border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary/90 transition-colors text-xs sm:text-sm px-2 sm:px-3"
          >
            <RefreshCw
              className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 ${
                isLoading ? "animate-spin" : ""
              }`}
            />
            <span className="hidden sm:inline">Refresh</span>
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="More actions"
                className="bg-card border border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary/90 transition-colors"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={onDownloadReceipt}>
                <Receipt className="mr-2 h-4 w-4" />
                Download receipt
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onCopy(String(orderId), "Order ID")}>
                Copy Order ID
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Payment Countdown Banner */}
      {status === "PENDING_PAYMENT" && countdown && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2 text-destructive">
            <Timer className="h-4 w-4" />
            <span className="text-sm font-medium">Complete your payment</span>
          </div>
          <div className="text-base font-semibold text-destructive tracking-wide">
            {countdown}
          </div>
        </div>
      )}
    </div>
  );
}
