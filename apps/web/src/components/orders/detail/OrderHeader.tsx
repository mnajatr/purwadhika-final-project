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
    <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-4 sm:p-6 shadow-lg border border-border/40">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
          <Link href="/orders">
            <Button
              variant="ghost"
              size="sm"
              className="p-2 rounded-lg hover:bg-muted/80 transition-all hover:scale-105"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1 sm:flex-none flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Order #{orderId}
            </h1>
            <Button
              aria-label="Copy Order ID"
              variant="ghost"
              size="icon"
              className="h-7 w-7 rounded-lg hover:bg-muted/80 transition-all"
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
              <span className="text-xs sm:text-[0.8rem] ml-1">
                {status.replace("_", " ")}
              </span>
            </Badge>
          </div>
        </div>
        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <Button
            variant="outline"
            size="sm"
            onClick={onRefresh}
            disabled={isLoading}
            className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all font-medium shadow-sm hover:shadow-md text-xs sm:text-sm px-2 sm:px-3"
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
                className="bg-gradient-to-r from-primary/10 to-primary/5 border-primary/30 text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all shadow-sm hover:shadow-md"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={onDownloadReceipt}>
                <Receipt className="mr-2 h-4 w-4" />
                Download receipt
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onShare}>
                <Share2 className="mr-2 h-4 w-4" />
                Share link
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                onClick={() => onCopy(String(orderId), "Order ID")}
              >
                <Copy className="mr-2 h-4 w-4" />
                Copy Order ID
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Payment Countdown Banner */}
      {status === "PENDING_PAYMENT" && countdown && (
        <div className="mt-4 bg-gradient-to-r from-destructive/10 to-destructive/5 border border-destructive/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 shadow-sm">
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
