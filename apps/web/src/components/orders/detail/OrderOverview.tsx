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
import {
  formatCurrency,
  formatDateShort,
  getStatusColor,
  getStatusHeadline,
} from "./orderUtils";

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

  // Handlers
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
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto space-y-4 p-2 sm:p-4">
        {/* Header */}
        <OrderHeader
          orderId={order.id}
          status={order.status}
          countdown={countdown}
          isLoading={isLoading}
          onRefresh={onRefresh}
          onCopy={copyToClipboard}
          onShare={handleShare}
          onDownloadReceipt={handleDownloadReceipt}
          getStatusColor={getStatusColor}
        />

        {/* Progress Section */}
        <div className="bg-card/80 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm border border-border/60 mb-6">
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

          {/* Timeline and Shipment Grid */}
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

        {/* Items Section */}
        <OrderItems items={items} formatCurrency={formatCurrency} />

        {/* Order Summary */}
        <OrderSummary
          order={order}
          items={items}
          apiBase={apiBase}
          onRefresh={onRefresh}
          formatCurrency={formatCurrency}
          CancelButton={CancelButton}
        />
      </div>
    </div>
  );
}
