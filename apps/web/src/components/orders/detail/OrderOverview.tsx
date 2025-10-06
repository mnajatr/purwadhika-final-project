"use client";

import React, { useEffect, useState } from "react";
import { toast } from "sonner";
import OrderHeader from "./OrderHeader";
import OrderProgress from "./OrderProgress";
import OrderStatusCards from "./OrderStatusCards";
import OrderTimeline from "./OrderTimeline";
import OrderShipment from "./OrderShipment";
import OrderItems from "./OrderItems";
import OrderSummary from "./OrderSummary";
import { getOrderStatusBadgeColor } from "@/utils/orderStatus";

function formatCurrency(amount: string | number): string {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

function formatDateShort(dateString?: string): string | null {
  return dateString
    ? new Intl.DateTimeFormat("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      }).format(new Date(dateString))
    : null;
}

function getStatusHeadline(status: string, paymentMethod: string): string {
  const s = status.toUpperCase();
  const pm = (paymentMethod || "").toUpperCase();

  if (s === "PENDING_PAYMENT") {
    return pm === "MANUAL_TRANSFER"
      ? "Please upload your payment proof to complete the order"
      : "Please complete your payment to proceed";
  }
  if (s === "PAYMENT_REVIEW") return "Your payment is under review";
  if (s === "PAID" || s === "PROCESSING") return "Your order is being prepared";
  if (s === "SHIPPED") return "Be patient, package on deliver!";
  if (s === "COMPLETED" || s === "CONFIRMED")
    return "Order confirmed — package delivered";
  if (s === "CANCELLED" || s === "EXPIRED") return "Order cancelled";
  return "Order status";
}

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
  onRefresh: () => void;
  isLoading?: boolean;
  CancelButton?: React.ComponentType<{ orderId: number; userId?: number }>;
};

export default function OrderOverview({
  order,
  items,
  address,
  onRefresh,
  isLoading = false,
  CancelButton,
}: OrderOverviewProps) {
  const [countdown, setCountdown] = useState<string | null>(null);

  useEffect(() => {
    if (order.status !== "PENDING_PAYMENT" || !order.createdAt) {
      return setCountdown(null);
    }

    const start = new Date(order.createdAt).getTime();
    const due = start + 60 * 60 * 1000;

    const update = () => {
      const diff = due - Date.now();
      if (diff <= 0) return setCountdown("Expired");

      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);

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

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
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
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Order link copied!");
      }
    } catch {
      toast.error("Failed to share order");
    }
  };

  const handleDownloadReceipt = () =>
    toast.info("Receipt download coming soon!");

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
      <div className="max-w-6xl mx-auto space-y-4 p-2 sm:p-4">
        <OrderHeader
          orderId={order.id}
          status={order.status}
          countdown={countdown}
          isLoading={isLoading}
          onRefresh={onRefresh}
          onCopy={copyToClipboard}
          onShare={handleShare}
          onDownloadReceipt={handleDownloadReceipt}
          getStatusColor={getOrderStatusBadgeColor}
        />

        <div className="bg-card/95 backdrop-blur-sm rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg border border-border/40 mb-6">
          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mb-6">
            <OrderProgress
              status={order.status}
              storeName={order.store?.name}
              storeCity={order.store?.city}
              addressCity={address?.city}
              addressProvince={address?.province}
              headline={getStatusHeadline(order.status, order.paymentMethod)}
            />
            <OrderStatusCards
              createdAt={order.createdAt}
              formatDateShort={formatDateShort}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            <OrderTimeline
              status={order.status}
              orderId={order.id}
              createdAt={order.createdAt}
              updatedAt={order.updatedAt}
              shippedAt={order.shippedAt}
              confirmedAt={order.confirmedAt}
              storeName={order.store?.name}
              storeCity={order.store?.city}
              addressLine={address?.addressLine}
              addressCity={address?.city}
              addressProvince={address?.province}
              formatDateShort={formatDateShort}
            />
            <OrderShipment
              orderId={order.id}
              storeName={order.store?.name}
              storeCity={order.store?.city}
              storeProvince={order.store?.province}
              recipientName={address?.recipientName}
              phoneNumber={address?.phoneNumber}
              addressLine={address?.addressLine}
              addressCity={address?.city}
              addressProvince={address?.province}
              postalCode={address?.postalCode}
              onCopy={copyToClipboard}
            />
          </div>
        </div>

        <OrderItems items={items} formatCurrency={formatCurrency} />

        <OrderSummary
          order={order}
          items={items}
          onRefresh={onRefresh}
          formatCurrency={formatCurrency}
          CancelButton={CancelButton}
        />
      </div>
    </div>
  );
}
