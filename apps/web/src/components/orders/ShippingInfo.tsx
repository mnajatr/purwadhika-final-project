"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { MapPin, User, Phone, Copy, Truck, Package, Clock } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface Address {
  recipientName: string;
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  phoneNumber?: string;
}

interface ShippingInfoProps {
  address: Address | null;
  orderStatus: string;
  className?: string;
}

const statusMeta: Record<
  string,
  {
    label: string;
    icon: React.ReactNode;
    badgeClass: string;
    iconClass: string;
  }
> = {
  SHIPPED: {
    label: "On the way",
    icon: <Truck className="w-5 h-5" />,
    badgeClass: "bg-primary/10 text-primary",
    iconClass: "text-primary",
  },
  COMPLETED: {
    label: "Delivered",
    icon: <Package className="w-5 h-5" />,
    badgeClass: "bg-emerald-100/80 text-emerald-700",
    iconClass: "text-emerald-600",
  },
  PROCESSING: {
    label: "Preparing for shipment",
    icon: <Clock className="w-5 h-5" />,
    badgeClass: "bg-amber-100/80 text-amber-700",
    iconClass: "text-amber-600",
  },
  PAID: {
    label: "Preparing for shipment",
    icon: <Clock className="w-5 h-5" />,
    badgeClass: "bg-amber-100/80 text-amber-700",
    iconClass: "text-amber-600",
  },
};

export default function ShippingInfo({
  address,
  orderStatus,
  className,
}: ShippingInfoProps) {
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const meta =
    statusMeta[orderStatus] || {
      label: "Shipping address",
      icon: <MapPin className="w-5 h-5" />,
      badgeClass: "bg-muted text-muted-foreground",
      iconClass: "text-muted-foreground",
    };

  if (!address) {
    return (
      <Card
        className={cn(
          "rounded-2xl border border-border/60 bg-card/80 shadow-sm",
          className
        )}
      >
        <CardContent className="flex flex-col items-center justify-center py-8">
          <MapPin className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No shipping address recorded</p>
        </CardContent>
      </Card>
    );
  }

  const fullAddress = `${address.addressLine}, ${address.city}, ${address.province} ${address.postalCode}`;

  return (
    <Card
      className={cn(
        "rounded-2xl border border-border/60 bg-card/80 shadow-sm",
        className
      )}
    >
      <CardHeader className="border-b bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <span className={cn("flex items-center", meta.iconClass)}>
              {meta.icon}
            </span>
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                Shipping Information
              </CardTitle>
              <p
                className={cn(
                  "mt-1 inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                  meta.badgeClass
                )}
              >
                {meta.label}
              </p>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Recipient Information */}
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <User className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-foreground">
                    {address.recipientName}
                  </p>
                  <p className="text-sm text-muted-foreground">Recipient</p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    copyToClipboard(address.recipientName, "Recipient name")
                  }
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Phone Number */}
          {address.phoneNumber && (
            <div className="flex items-start space-x-3">
              <Phone className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">
                      {address.phoneNumber}
                    </p>
                    <p className="text-sm text-muted-foreground">Phone number</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      copyToClipboard(address.phoneNumber!, "Phone number")
                    }
                  >
                    <Copy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Address */}
          <div className="flex items-start space-x-3">
            <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium text-foreground leading-relaxed">
                    {address.addressLine}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {address.city}, {address.province} {address.postalCode}
                  </p>
                  <p className="text-xs text-muted-foreground/70 mt-1">
                    Delivery address
                  </p>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => copyToClipboard(fullAddress, "Full address")}
                >
                  <Copy className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Status Details */}
        {(orderStatus === "SHIPPED" || orderStatus === "COMPLETED") && (
          <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
            <div className="flex items-center space-x-2">
              <Truck className="w-5 h-5 text-primary" />
              <div>
                <p className="font-medium text-foreground">
                  {orderStatus === "COMPLETED"
                    ? "Package Delivered"
                    : "Package is on the way"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {orderStatus === "COMPLETED"
                    ? "Your order has been successfully delivered to the recipient."
                    : "Your package is being delivered to the specified address."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="flex flex-wrap gap-2 pt-4 border-t border-border/60">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                fullAddress
              )}`;
              window.open(mapsUrl, "_blank");
            }}
          >
            <MapPin className="w-4 h-4 mr-1" />
            View on Maps
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={() => copyToClipboard(fullAddress, "Full address")}
          >
            <Copy className="w-4 h-4 mr-1" />
            Copy Address
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
