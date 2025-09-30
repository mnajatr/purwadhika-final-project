"use client";

import React from "react";
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

interface OrderItem {
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
}

interface Address {
  recipientName: string;
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  phoneNumber?: string;
}

interface Store {
  id: number;
  name: string;
  city?: string;
  province?: string;
}

interface OrderOverviewProps {
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
    store?: Store;
  };
  items: OrderItem[];
  address: Address | null;
  apiBase: string;
  onRefresh: () => void;
  isLoading?: boolean;
  CancelButton?: React.ComponentType<{ orderId: number; userId?: number }>;
}

export default function OrderOverview({
  order,
  items,
  address,
  apiBase,
  onRefresh,
  isLoading = false,
  CancelButton,
}: OrderOverviewProps) {
  const [countdown, setCountdown] = React.useState<string | null>(null);

  // Payment countdown timer
  React.useEffect(() => {
    if (order.status !== "PENDING_PAYMENT" || !order.createdAt) {
      setCountdown(null);
      return;
    }
    const start = new Date(order.createdAt).getTime();
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
  }, [order.status, order.createdAt]);

  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.qty, 0);
  };

  // Header utility functions from OrderHeader
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PENDING_PAYMENT":
        return <Clock className="w-4 h-4" />;
      default:
        return null;
    }
  };

  const formatDateShort = (dateString?: string) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(date);
    } catch {
      return null;
    }
  };

  const handleShare = async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Order #${order.id}`,
          text: `Check out my order #${order.id}`,
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

  const getStatusHeadline = () => {
    const s = (order?.status || "").toUpperCase();
    const pm = (order?.paymentMethod || "").toUpperCase();

    switch (s) {
      case "PENDING_PAYMENT":
        if (pm === "MANUAL_TRANSFER")
          return "Please upload your payment proof to complete the order";
        return "Please complete your payment to proceed";
      case "PAYMENT_REVIEW":
        return "Your payment is under review";
      case "PAID":
      case "PROCESSING":
        return "Your order is being prepared";
      case "SHIPPED":
        return "Be patient, package on deliver!";
      case "COMPLETED":
      case "CONFIRMED":
        return "Order confirmed — package delivered";
      case "CANCELLED":
      case "EXPIRED":
        return "Order cancelled";
      default:
        return "Order status";
    }
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      {/* Main Content */}
      <div className="max-w-6xl mx-auto space-y-4 p-4">
        {/* Top Timeline Section */}
        <div className="bg-card/80 backdrop-blur-sm rounded-2xl p-8 shadow-sm border border-border/60">
          {/* Header Section — moved inside the top card (not sticky) */}
          <div className="mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Link href="/orders">
                  <Button variant="ghost" size="sm" className="p-2">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                </Link>

                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-2xl font-semibold text-foreground">
                      Order #{order.id}
                    </h1>
                    <Button
                      aria-label="Copy Order ID"
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() =>
                        navigator.clipboard
                          .writeText(String(order.id))
                          .then(() => toast.success("Order ID copied"))
                      }
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Badge
                      className={`px-2.5 py-1 font-medium border ${getStatusColor(
                        order.status
                      )}`}
                    >
                      <div className="flex items-center gap-1">
                        {getStatusIcon(order.status)}
                        <span className="text-xs sm:text-[0.8rem]">
                          {order.status.replace("_", " ")}
                        </span>
                      </div>
                    </Badge>
                  </div>
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
                    className={`w-4 h-4 mr-1 ${
                      isLoading ? "animate-spin" : ""
                    }`}
                  />
                  Refresh
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="More actions"
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
                        navigator.clipboard
                          .writeText(String(order.id))
                          .then(() => toast.success("Order ID copied"))
                      }
                    >
                      Copy Order ID
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </div>

          {/* Payment Countdown Banner */}
          {order.status === "PENDING_PAYMENT" && countdown && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6">
              <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
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
            </div>
          )}

          <div className="flex gap-8 mb-6">
            {/* Left side - Main content with header and progress (contained card) */}
            <div className="flex-1">
              <div className="bg-muted/50 rounded-xl p-6 border border-border/30">
                {/* Header with Package Icon and Title inside sub-card */}
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center border border-border/60 shadow-sm">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-medium text-foreground">
                      {getStatusHeadline()}
                    </h2>
                  </div>
                </div>

                {/* Chips + dashed route + progress bar (all inside this sub-card) */}
                <div>
                  <div className="flex items-center gap-4 mb-4">
                    {/* Start chip */}
                    <div className="px-3 py-2 bg-card rounded-full border border-border/60 flex items-center gap-2 shadow-sm">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {order.store?.name || "Store"},{" "}
                        {order.store?.city || "City"}
                      </span>
                    </div>

                    {/* dashed route */}
                    <div className="flex-1 flex items-center justify-center">
                      <div className="flex items-center gap-1">
                        <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                        <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                        <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                        <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                        <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                      </div>
                    </div>

                    {/* End chip */}
                    <div className="px-3 py-2 bg-card rounded-full border border-border/60 flex items-center gap-2 shadow-sm">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm text-foreground">
                        {address?.city || "Delivery City"},{" "}
                        {address?.province || "Province"}
                      </span>
                    </div>
                  </div>

                  {/* Order Status Progress Bar */}
                  <div className="mt-4">
                    {(() => {
                      const steps = [
                        {
                          key: "PENDING_PAYMENT",
                          label: "Pending Payment",
                          short: "Pending",
                        },
                        {
                          key: "PAYMENT_REVIEW",
                          label: "Payment Review",
                          short: "Review",
                        },
                        { key: "PAID", label: "Paid", short: "Paid" },
                        {
                          key: "PROCESSING",
                          label: "Processing",
                          short: "Processing",
                        },
                        { key: "SHIPPED", label: "Shipped", short: "Shipped" },
                        {
                          key: "CONFIRMED",
                          label: "Confirmed",
                          short: "Confirmed",
                        },
                      ];

                      const getCurrentStepIndex = () => {
                        if (
                          order.status === "CANCELLED" ||
                          order.status === "EXPIRED"
                        )
                          return -1;
                        return steps.findIndex(
                          (step) => step.key === order.status
                        );
                      };

                      const currentStepIndex = getCurrentStepIndex();
                      const progressPercentage =
                        currentStepIndex >= 0
                          ? ((currentStepIndex + 1) / steps.length) * 100
                          : 0;

                      if (
                        order.status === "CANCELLED" ||
                        order.status === "EXPIRED"
                      ) {
                        return (
                          <div className="flex items-center justify-center py-2">
                            <span className="text-sm text-destructive font-medium">
                              Order {order.status.toLowerCase()}
                            </span>
                          </div>
                        );
                      }

                      return (
                        <div>
                          {/* Progress bar */}
                          <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                            <div
                              className="h-2 bg-primary rounded-full transition-all duration-500"
                              style={{ width: `${progressPercentage}%` }}
                            />
                          </div>

                          {/* Step indicators */}
                          <div className="flex justify-between items-center">
                            {steps.map((step, index) => {
                              const isCompleted = index < currentStepIndex;
                              const isCurrent = index === currentStepIndex;

                              return (
                                <div
                                  key={step.key}
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
                                    {step.short}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Two status cards */}
            <div className="flex gap-6">
              {/* Order Created Card (swapped) */}
              <div className="bg-muted/30 rounded-2xl p-6 min-w-[140px] border border-border/30">
                <div className="flex items-center justify-center mb-4">
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

              {/* Estimated Arrival Card (swapped) */}
              <div className="bg-muted/30 rounded-2xl p-6 min-w-[140px] border border-border/30">
                <div className="flex items-center justify-center mb-4">
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
          <div className="grid grid-cols-2 gap-8">
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
                  <p className="text-sm font-medium text-foreground mb-1">
                    Recipient
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address?.recipientName || "Customer"}
                  </p>
                  {address?.phoneNumber && (
                    <p className="text-sm text-muted-foreground">
                      {address.phoneNumber}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Delivery address
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {address
                      ? `${address.addressLine}, ${address.city}, ${address.province} ${address.postalCode}`
                      : "Delivery address not available"}
                  </p>
                </div>

                <div>
                  <p className="text-sm font-medium text-foreground mb-1">
                    Tracking No.
                  </p>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-mono text-foreground">
                      TRK{order.id.toString().padStart(8, "0")}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0 hover:bg-muted"
                      onClick={() =>
                        copyToClipboard(
                          `TRK${order.id.toString().padStart(8, "0")}`,
                          "Tracking number"
                        )
                      }
                    >
                      <Copy className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-border/60">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Items{" "}
            <span className="font-normal text-muted-foreground">
              {getTotalItems()}
            </span>
          </h3>

          <div className="grid grid-cols-2 gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-muted/30 rounded-xl p-4 border border-border/30"
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    {item.product?.images?.[0]?.url ? (
                      <div className="w-20 h-20 bg-card rounded-lg overflow-hidden border border-border/60 shadow-sm">
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
                      <div className="w-20 h-20 bg-card rounded-lg flex items-center justify-center border border-border/60 shadow-sm">
                        <Package className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-sm mb-2 line-clamp-2">
                      {item.product?.name || `Product #${item.productId}`}
                    </h4>
                    <p className="text-sm font-semibold text-foreground mb-1">
                      {formatCurrency(item.product?.price || 0)}{" "}
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
        <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 shadow-sm border border-border/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Order Summary
            </h3>
            <Badge
              className={`px-3 py-1 ${
                order.payment?.status === "PAID" ||
                order.status === "PAID" ||
                order.status === "PROCESSING" ||
                order.status === "SHIPPED" ||
                order.status === "CONFIRMED" ||
                order.status === "COMPLETED"
                  ? "bg-emerald-100/80 text-emerald-700 border-emerald-200"
                  : order.status === "PENDING_PAYMENT"
                  ? "bg-amber-100/80 text-amber-700 border-amber-200"
                  : "bg-muted text-muted-foreground border-border/60"
              }`}
            >
              {order.payment?.status === "PAID" ||
              order.status === "PAID" ||
              order.status === "PROCESSING" ||
              order.status === "SHIPPED" ||
              order.status === "CONFIRMED" ||
              order.status === "COMPLETED"
                ? "Payment Success"
                : order.status === "PENDING_PAYMENT"
                ? "Payment Pending"
                : "Payment Review"}
            </Badge>
          </div>

          <p className="text-sm text-muted-foreground mb-6">
            Here&apos;s your summary for the stuff you bought.
          </p>

          <div className="space-y-3 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-muted-foreground">
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

          {/* Action Buttons - Only show for GATEWAY payments */}
          {order.status === "PENDING_PAYMENT" && order.paymentMethod === "GATEWAY" && (
            <div className="flex gap-3">
              {/* Payment Now Button - using primary gradient */}
              <PayNowButton
                orderId={order.id}
                orderTotal={Number(order.grandTotal)}
                onPaymentSuccess={onRefresh}
                onPaymentPending={onRefresh}
                onPaymentError={(error) =>
                  console.error("Payment error:", error)
                }
                className="flex-1 bg-primary-gradient hover:opacity-95"
              />

              {/* Cancel Order Button - using destructive color */}
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

          {/* Payment Actions */}
          <div className="mt-4 space-y-3">
            {order.status === "PENDING_PAYMENT" &&
              order.paymentMethod === "MANUAL_TRANSFER" && (
                <div className="space-y-3">
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
                    <div className="flex items-center gap-2 text-destructive">
                      <AlertCircle className="w-4 h-4" />
                      <p className="text-sm">Upload payment proof to proceed</p>
                    </div>
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
    </div>
  );
}
