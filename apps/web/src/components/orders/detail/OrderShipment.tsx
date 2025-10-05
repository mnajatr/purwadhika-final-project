"use client";

import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";

type OrderShipmentProps = {
  orderId: number;
  storeName?: string;
  storeCity?: string;
  storeProvince?: string;
  recipientName?: string;
  phoneNumber?: string;
  addressLine?: string;
  addressCity?: string;
  addressProvince?: string;
  postalCode?: string;
  onCopy: (text: string, label: string) => void;
};

export default function OrderShipment({
  orderId,
  storeName,
  storeCity,
  storeProvince,
  recipientName,
  phoneNumber,
  addressLine,
  addressCity,
  addressProvince,
  postalCode,
  onCopy,
}: OrderShipmentProps) {
  const trackingNumber = `TRK${orderId.toString().padStart(8, "0")}`;

  return (
    <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/60 p-4 shadow-sm">
      <h4 className="text-sm font-medium text-foreground mb-4">Shipment</h4>
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
            <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
              <span className="text-primary-foreground text-xs">S</span>
            </div>
          </div>
          <div>
            <p className="font-medium text-foreground">
              {storeName || "Store"} Delivery
            </p>
            <p className="text-sm text-muted-foreground">
              {storeName || "Online Store"}, {storeCity || "Store City"},{" "}
              {storeProvince || "Store Province"}
            </p>
          </div>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">Recipient</p>
          <p className="text-sm text-foreground font-medium">
            {recipientName || "Customer"}
          </p>
          {phoneNumber && (
            <p className="text-sm text-muted-foreground">{phoneNumber}</p>
          )}
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">Delivery address</p>
          <p className="text-sm text-foreground font-medium">
            {addressLine && addressCity
              ? `${addressLine}, ${addressCity}, ${addressProvince} ${postalCode}`
              : "Delivery address not available"}
          </p>
        </div>

        <div>
          <p className="text-sm text-muted-foreground mb-1">Tracking No.</p>
          <div className="flex items-center">
            <div className="flex items-center justify-between w-full max-w-sm rounded-xl border border-border/60 bg-card/90 px-4 py-2">
              <p className="text-sm font-mono text-foreground truncate">
                {trackingNumber}
              </p>
              <Button
                size="sm"
                variant="ghost"
                className="h-7 w-7 p-0 hover:bg-muted"
                onClick={() => onCopy(trackingNumber, "Tracking number")}
                aria-label="Copy tracking number"
              >
                <Copy className="w-3 h-3" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
