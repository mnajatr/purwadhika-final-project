"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MapPin,
  Copy,
  Package,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Share2,
  Calendar,
  Receipt,
  Clock,
  MoreHorizontal,
  Timer,
} from "lucide-react";
import { toast } from "sonner";
import { PayNowButton } from "@/components/payment";
import PaymentUpload from "./PaymentUpload";
import ConfirmButton from "./ConfirmButton";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Types
type OrderOverviewProps = {
  order: {
    id: number;
    status: string;
    paymentMethod: string;
    grandTotal: string | number;
    userId?: number;
    createdAt?: string;
    updatedAt?: string;
    shippedAt?: string;
    confirmedAt?: string;
    payment?: {
      status: string;
      amount: string | number;
      proofUrl?: string;
    };
    store?: {
      id: number;
      name: string;
      city?: string;
      province?: string;
    };
  };
  items: Array<{
    id: number;
    productId: number;
    qty: number;
    totalAmount: string | number;
    product?: {
      id: number;
      name: string;
      images?: Array<{ url: string }>;
      price?: string | number;
    };
  }>;
  address: {
    recipientName: string;
    addressLine: string;
    city: string;
    province: string;
    postalCode: string;
    phoneNumber?: string;
  } | null;
  apiBase: string;
  onRefresh: () => void;
  isLoading?: boolean;
  CancelButton?: React.ComponentType<{ orderId: number; userId?: number }>;
};

export default function OrderOverview({
  order,
  items,
  address,
  apiBase,
  onRefresh,
  isLoading = false,
  CancelButton,
}: OrderOverviewProps) {
  // Payment countdown timer
  const [countdown, setCountdown] = useState<string | null>(null);
  useEffect(() => {
    if (order.status !== "PENDING_PAYMENT" || !order.createdAt)
      return setCountdown(null);
    const start = new Date(order.createdAt).getTime();
    const due = start + 60 * 60 * 1000;
    const update = () => {
      const diff = due - Date.now();
      if (diff <= 0) return setCountdown("Expired");
      const h = Math.floor(diff / 3600000),
        m = Math.floor((diff % 3600000) / 60000),
        s = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
          .toString()
          .padStart(2, "0")}`
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [order.status, order.createdAt]);

  // Helpers
  const formatCurrency = (amount: string | number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(amount));
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };
  const getTotalItems = () =>
    items.reduce((total, item) => total + item.qty, 0);
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "CONFIRMED":
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
  const getStatusIcon = (status: string) =>
    status === "PENDING_PAYMENT" ? <Clock className="w-4 h-4" /> : null;
  const formatDateShort = (dateString?: string) =>
    dateString
      ? new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(dateString))
      : null;
  const handleShare = async () => {
    try {
      if (navigator.share)
        await navigator.share({
          title: `Order #${order.id}`,
          text: `Check out my order #${order.id}`,
          url: window.location.href,
        });
      else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Order link copied!");
      }
    } catch {
      toast.error("Failed to share order");
    }
  };
  const handleDownloadReceipt = () =>
    toast.info("Receipt download coming soon!");
  const getStatusHeadline = () => {
    const s = order.status.toUpperCase(),
      pm = (order.paymentMethod || "").toUpperCase();
    if (s === "PENDING_PAYMENT")
      return pm === "MANUAL_TRANSFER"
        ? "Please upload your payment proof to complete the order"
        : "Please complete your payment to proceed";
    if (s === "PAYMENT_REVIEW") return "Your payment is under review";
    if (s === "PAID" || s === "PROCESSING")
      return "Your order is being prepared";
    if (s === "SHIPPED") return "Be patient, package on deliver!";
    if (s === "COMPLETED" || s === "CONFIRMED")
      return "Order confirmed — package delivered";
    if (s === "CANCELLED" || s === "EXPIRED") return "Order cancelled";
    return "Order status";
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto space-y-4 p-2 sm:p-4">
        {/* Header */}
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
                  Order #{order.id}
                </h1>
                <Button
                  aria-label="Copy Order ID"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => copyToClipboard(String(order.id), "Order ID")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Badge
                  className={`px-2.5 py-1 font-medium border ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusIcon(order.status)}
                  <span className="text-xs sm:text-[0.8rem]">
                    {order.status.replace("_", " ")}
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
                  <DropdownMenuItem onClick={handleDownloadReceipt}>
                    <Receipt className="mr-2 h-4 w-4" />
                    Download receipt
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share link
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      copyToClipboard(String(order.id), "Order ID")
                    }
                  >
                    Copy Order ID
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Payment Countdown Banner */}
          {order.status === "PENDING_PAYMENT" && countdown && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-destructive">
                <Timer className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Complete your payment
                </span>
              </div>
              <div className="text-base font-semibold text-destructive tracking-wide">
                {countdown}
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mb-6">
            {/* Main content */}
            <div className="flex-1 bg-muted/50 rounded-xl p-4 sm:p-6 border border-border/30">
              <div className="flex items-center gap-3 sm:gap-4 mb-6">
                <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center border border-border/60 shadow-sm">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-medium text-foreground">
                  {getStatusHeadline()}
                </h2>
              </div>
              {/* Chips + dashed route + progress bar */}
              <div>
                <div className="flex flex-col sm:flex-row items-center gap-3 sm:gap-4 mb-4">
                  <div className="px-3 py-2 bg-card rounded-full border border-border/60 flex items-center gap-2 shadow-sm w-full sm:w-auto justify-center sm:justify-start">
                    <Package className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {order.store?.name || "Store"},{" "}
                      {order.store?.city || "City"}
                    </span>
                  </div>
                  <div className="hidden sm:flex flex-1 items-center justify-center">
                    <div className="flex items-center gap-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <span
                          key={i}
                          className="w-1 h-1 bg-muted-foreground rounded-full"
                        ></span>
                      ))}
                    </div>
                  </div>
                  <div className="px-3 py-2 bg-card rounded-full border border-border/60 flex items-center gap-2 shadow-sm w-full sm:w-auto justify-center sm:justify-start">
                    <MapPin className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm text-foreground">
                      {address?.city || "Delivery City"},{" "}
                      {address?.province || "Province"}
                    </span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="mt-4">
                  {(() => {
                    const steps = [
                      "PENDING_PAYMENT",
                      "PAYMENT_REVIEW",
                      "PAID",
                      "PROCESSING",
                      "SHIPPED",
                      "CONFIRMED",
                    ];
                    const currentStepIndex = steps.indexOf(order.status);
                    const progressPercentage =
                      currentStepIndex >= 0
                        ? ((currentStepIndex + 1) / steps.length) * 100
                        : 0;
                    if (["CANCELLED", "EXPIRED"].includes(order.status))
                      return (
                        <div className="flex items-center justify-center py-2">
                          <span className="text-sm text-destructive font-medium">
                            Order {order.status.toLowerCase()}
                          </span>
                        </div>
                      );
                    return (
                      <>
                        <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                          <div
                            className="h-2 bg-primary rounded-full transition-all duration-500"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          {steps.map((step, i) => {
                            const isCompleted = i < currentStepIndex,
                              isCurrent = i === currentStepIndex;
                            return (
                              <div
                                key={step}
                                className="flex flex-col items-center"
                              >
                                <div
                                  className={`w-3 h-3 rounded-full border-2 transition-all ${
                                    isCompleted || isCurrent
                                      ? "bg-primary border-primary"
                                      : "bg-muted border-border"
                                  }`}
                                />
                                <span
                                  className={`text-xs mt-1 ${
                                    isCompleted || isCurrent
                                      ? "text-primary font-medium"
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
                    );
                  })()}
                </div>
              </div>
            </div>
            {/* Status cards */}
            <div className="flex gap-3 sm:gap-4 lg:gap-6">
              {/* Order Created Card */}
              <div className="bg-muted/30 rounded-2xl p-3 sm:p-4 lg:p-6 min-w-[120px] lg:min-w-[140px] border border-border/30 flex-1 lg:flex-none">
                <div className="flex items-start justify-start mb-20">
                  <div className="w-10 h-10 bg-card rounded-2xl flex items-center justify-center border border-border/60 shadow-sm">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Order created
                  </p>
                  <p className="font-semibold text-foreground">
                    {order.createdAt ? formatDateShort(order.createdAt) : "-"}
                  </p>
                </div>
              </div>
              {/* Estimated Arrival Card */}
              <div className="bg-muted/30 rounded-2xl p-3 sm:p-4 lg:p-6 min-w-[120px] lg:min-w-[140px] border border-border/30 flex-1 lg:flex-none">
                <div className="flex items-start justify-start mb-20">
                  <div className="w-10 h-10 bg-card rounded-2xl flex items-center justify-center border border-border/60 shadow-sm">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Estimated Arrival
                  </p>
                  <p className="font-semibold text-foreground">
                    {order.createdAt
                      ? formatDateShort(
                          new Date(
                            new Date(order.createdAt).getTime() +
                              7 * 24 * 60 * 60 * 1000
                          ).toISOString()
                        )
                      : "Calculating..."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Timeline Column (card) */}
            <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/60 p-4 shadow-sm">
              <h4 className="text-sm font-medium text-foreground mb-4">
                Timeline
              </h4>
              <div className="space-y-4">
                {order.status === "SHIPPED" ||
                order.status === "CONFIRMED" ||
                order.status === "COMPLETED" ? (
                  <div className="flex gap-3">
                    <div className="text-sm">
                      <p className="font-medium text-foreground">
                        {order.shippedAt
                          ? formatDateShort(order.shippedAt)
                          : order.updatedAt
                          ? formatDateShort(order.updatedAt)
                          : formatDateShort(new Date().toISOString())}
                        {order.status === "SHIPPED" && !order.confirmedAt
                          ? " (Now)"
                          : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.shippedAt
                          ? new Date(order.shippedAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour12: false,
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : order.updatedAt
                          ? new Date(order.updatedAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour12: false,
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : new Date().toLocaleTimeString("en-US", {
                              hour12: false,
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {order.status === "COMPLETED" ||
                        order.status === "CONFIRMED"
                          ? "Package delivered"
                          : "Package is on delivery"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {address?.addressLine}, {address?.city},{" "}
                        {address?.province}
                      </p>
                    </div>
                  </div>
                ) : null}

                {order.status === "PROCESSING" ||
                order.status === "SHIPPED" ||
                order.status === "CONFIRMED" ||
                order.status === "COMPLETED" ? (
                  <div className="flex gap-3">
                    <div className="text-sm">
                      <p className="font-medium text-foreground">
                        {order.updatedAt && order.status !== "PROCESSING"
                          ? formatDateShort(order.updatedAt)
                          : order.createdAt
                          ? formatDateShort(
                              new Date(
                                new Date(order.createdAt).getTime() +
                                  ((order.id % 5) + 2) * 60 * 60 * 1000
                              ).toISOString()
                            )
                          : "Processing"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.updatedAt && order.status !== "PROCESSING"
                          ? new Date(order.updatedAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour12: false,
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : order.createdAt
                          ? new Date(
                              new Date(order.createdAt).getTime() +
                                ((order.id % 5) + 2) * 60 * 60 * 1000
                            ).toLocaleTimeString("en-US", {
                              hour12: false,
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "06:00"}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Order is being prepared
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {order.store?.name || "Online Store"},{" "}
                        {order.store?.city || "Store City"}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <div className="text-sm">
                    <p className="font-medium text-foreground">
                      {order.createdAt
                        ? formatDateShort(order.createdAt)
                        : "Order Date"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleTimeString(
                            "en-US",
                            {
                              hour12: false,
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "00:00"}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Order placed
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
                        <span className="text-primary-foreground text-xs font-bold">
                          ✓
                        </span>
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        Online Store
                      </span>
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipment Info Column (card) */}
            <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/60 p-4 shadow-sm">
              <h4 className="text-sm font-medium text-foreground mb-4">
                Shipment
              </h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                    <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
                      <span className="text-primary-foreground text-xs">S</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {order.store?.name || "Store"} Delivery
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.store?.name || "Online Store"},{" "}
                      {order.store?.city || "Store City"},{" "}
                      {order.store?.province || "Store Province"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Recipient
                  </p>
                  <p className="text-sm text-foreground font-medium">
                    {address?.recipientName || "Customer"}
                  </p>
                  {address?.phoneNumber && (
                    <p className="text-sm text-muted-foreground">
                      {address.phoneNumber}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Delivery address
                  </p>
                  <p className="text-sm text-foreground font-medium">
                    {address
                      ? `${address.addressLine}, ${address.city}, ${address.province} ${address.postalCode}`
                      : "Delivery address not available"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Tracking No.
                  </p>
                  <div className="flex items-center">
                    <div className="flex items-center justify-between w-full max-w-sm rounded-xl border border-border/60 bg-card/90 px-4 py-2">
                      <p className="text-sm font-mono text-foreground truncate">
                        TRK{order.id.toString().padStart(8, "0")}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-muted"
                        onClick={() =>
                          copyToClipboard(
                            `TRK${order.id.toString().padStart(8, "0")}`,
                            "Tracking number"
                          )
                        }
                        aria-label="Copy tracking number"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-card/80 rounded-xl p-6 shadow-sm border border-border/60">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Items{" "}
            <span className="font-normal text-muted-foreground">
              {getTotalItems()}
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-muted/30 rounded-xl p-4 border border-border/30"
              >
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    {item.product?.images?.[0]?.url ? (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-card rounded-lg overflow-hidden border border-border/60 shadow-sm">
                        <Image
                          src={item.product.images[0].url}
                          alt={
                            item.product.name || `Product #${item.productId}`
                          }
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-card rounded-lg flex items-center justify-center border border-border/60 shadow-sm">
                        <Package className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-sm mb-2 line-clamp-2">
                      {item.product?.name || `Product #${item.productId}`}
                    </h4>
                    <p className="text-sm font-semibold text-foreground mb-1">
                      {formatCurrency(item.product?.price || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Quantity: {item.qty}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-card/80 rounded-xl p-6 shadow-sm border border-border/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Order Summary
            </h3>
            <Badge
              className={`px-3 py-1 ${
                order.payment?.status === "PAID" ||
                [
                  "PAID",
                  "PROCESSING",
                  "SHIPPED",
                  "CONFIRMED",
                  "COMPLETED",
                ].includes(order.status)
                  ? "bg-emerald-100/80 text-emerald-700 border-emerald-200"
                  : order.status === "PENDING_PAYMENT"
                  ? "bg-amber-100/80 text-amber-700 border-amber-200"
                  : "bg-muted text-muted-foreground border-border/60"
              }`}
            >
              {order.payment?.status === "PAID" ||
              [
                "PAID",
                "PROCESSING",
                "SHIPPED",
                "CONFIRMED",
                "COMPLETED",
              ].includes(order.status)
                ? "Payment Success"
                : order.status === "PENDING_PAYMENT"
                ? "Payment Pending"
                : "Payment Review"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Here&apos;s your summary for the product you bought.
          </p>
          <div className="space-y-3 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-foreground font-medium">
                  {item.product?.name || `Product #${item.productId}`}
                </span>
                <span className="text-foreground font-medium">
                  {formatCurrency(item.totalAmount)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-foreground">
                Total
              </span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(order.grandTotal)}
              </span>
            </div>
          </div>
          {/* Payment Actions */}
          {order.status === "PENDING_PAYMENT" &&
            order.paymentMethod === "GATEWAY" && (
              <div className="flex gap-3">
                <PayNowButton
                  orderId={order.id}
                  orderTotal={Number(order.grandTotal)}
                  onPaymentSuccess={onRefresh}
                  onPaymentPending={onRefresh}
                  onPaymentError={() => {}}
                  className="flex-1 bg-primary-gradient hover:opacity-95"
                />
                {CancelButton ? (
                  <CancelButton orderId={order.id} userId={order.userId} />
                ) : (
                  <Button
                    variant="destructive"
                    className="px-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    disabled={order.status !== "PENDING_PAYMENT"}
                  >
                    Cancel Order
                  </Button>
                )}
              </div>
            )}
          {order.status === "PENDING_PAYMENT" &&
            order.paymentMethod === "MANUAL_TRANSFER" && (
              <div className="space-y-3 mt-4">
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
                  <AlertCircle className="w-4 h-4" />
                  <p className="text-sm">Upload payment proof to proceed</p>
                </div>
                <PaymentUpload
                  orderId={order.id}
                  apiBase={apiBase}
                  onUploadSuccess={onRefresh}
                  cancelButton={
                    CancelButton ? (
                      <CancelButton orderId={order.id} userId={order.userId} />
                    ) : (
                      <Button
                        variant="destructive"
                        className="px-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        disabled={order.status !== "PENDING_PAYMENT"}
                      >
                        Cancel Order
                      </Button>
                    )
                  }
                />
              </div>
            )}
          {order.status === "SHIPPED" && (
            <ConfirmButton orderId={order.id} userId={order.userId} />
          )}
        </div>
      </div>
    </div>
  );
}
