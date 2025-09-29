"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  RefreshCw,
  Share2,
  Calendar,
  Receipt,
  Clock,
} from "lucide-react";
import { toast } from "sonner";

interface OrderHeaderProps {
  orderId: number;
  status: string;
  createdAt?: string;
  onRefresh: () => void;
  isLoading?: boolean;
}

export default function OrderHeader({
  orderId,
  status,
  createdAt,
  onRefresh,
  isLoading = false,
}: OrderHeaderProps) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return "bg-emerald-100/80 text-emerald-700 border-emerald-200";
      case "PAID":
      case "PROCESSING":
        return "bg-primary/10 text-primary border-primary/20";
      case "SHIPPED":
        return "bg-indigo-100/80 text-indigo-700 border-indigo-200";
      case "PENDING_PAYMENT":
        return "bg-amber-100/80 text-amber-700 border-amber-200";
      case "CANCELLED":
      case "EXPIRED":
        return "bg-rose-100/80 text-rose-700 border-rose-200";
      default:
        return "bg-muted text-muted-foreground border-border/60";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return null;

    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }).format(date);
    } catch {
      return null;
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Order #${orderId}`,
          text: `Check out my order #${orderId}`,
          url: window.location.href,
        });
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Order link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
      toast.error("Failed to share order");
    }
  };

  const handleDownloadReceipt = () => {
    // This would typically generate and download a PDF receipt
    toast.info("Receipt download feature coming soon!");
  };

  return (
    <div className="sticky top-0 z-30 border-b border-border/60 bg-card/80 backdrop-blur supports-[backdrop-filter]:bg-card/70">
      <div className="max-w-5xl mx-auto px-6 py-4">
        {/* Main Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-4">
            <Link href="/orders">
              <Button variant="ghost" size="sm" className="p-2">
                <ArrowLeft className="w-4 h-4" />
              </Button>
            </Link>

            <div>
              <h1 className="text-2xl font-semibold text-foreground">
                Order #{orderId}
              </h1>
              {createdAt && (
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <Calendar className="w-4 h-4 mr-1" />
                  {formatDate(createdAt)}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw
                className={`w-4 h-4 mr-1 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>

            <Button variant="outline" size="sm" onClick={handleDownloadReceipt}>
              <Receipt className="w-4 h-4 mr-1" />
              Receipt
            </Button>

            <Button variant="outline" size="sm" onClick={handleShare}>
              <Share2 className="w-4 h-4 mr-1" />
              Share
            </Button>
          </div>
        </div>

        {/* Status Badge */}
        <div className="flex items-center space-x-3">
          <Badge
            className={`px-3 py-1.5 font-medium border ${getStatusColor(
              status
            )}`}
          >
            <div className="flex items-center space-x-1">
              {getStatusIcon(status)}
              <span>{status.replace("_", " ")}</span>
            </div>
          </Badge>

          {/* Additional Status Context */}
          {status === "PENDING_PAYMENT" && (
            <span className="text-sm text-amber-700 bg-amber-100/80 px-2 py-1 rounded-full">
              Payment required
            </span>
          )}

          {status === "SHIPPED" && (
            <span className="text-sm text-indigo-700 bg-indigo-100/80 px-2 py-1 rounded-full">
              On the way
            </span>
          )}

          {status === "COMPLETED" && (
            <span className="text-sm text-emerald-700 bg-emerald-100/80 px-2 py-1 rounded-full">
              Delivered successfully
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
