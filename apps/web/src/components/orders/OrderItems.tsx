"use client";

import React from "react";
import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Package, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";

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

interface OrderItemsProps {
  items: OrderItem[];
  className?: string;
}

export default function OrderItems({
  items,
  className,
}: OrderItemsProps) {
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.qty, 0);
  };

  const getTotalAmount = () => {
    return items.reduce((total, item) => total + Number(item.totalAmount), 0);
  };

  if (items.length === 0) {
    return (
      <Card
        className={cn(
          "rounded-2xl border border-border/60 bg-card/80 shadow-sm",
          className
        )}
      >
        <CardContent className="flex flex-col items-center justify-center py-8">
          <Package className="w-12 h-12 text-muted-foreground/50 mb-4" />
          <p className="text-muted-foreground">No items in this order</p>
        </CardContent>
      </Card>
    );
  }

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
            <ShoppingBag className="w-5 h-5 text-primary" />
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                Order Items
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {getTotalItems()} item{getTotalItems() !== 1 ? "s" : ""} in this
                order
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="bg-primary/10 text-primary">
            {items.length} product{items.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="p-0">
        <div className="divide-y">
          {items.map((item) => (
            <div
              key={item.id}
              className="p-6 transition-colors hover:bg-primary/5"
            >
              <div className="flex space-x-4">
                {/* Product Image */}
                <div className="flex-shrink-0">
                  {item.product?.images?.[0]?.url ? (
                    <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-border/60 bg-muted">
                      <Image
                        src={item.product.images[0].url}
                        alt={item.product.name || `Product #${item.productId}`}
                        fill
                        className="object-cover"
                        sizes="64px"
                      />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/40">
                      <Package className="w-8 h-8 text-muted-foreground/60" />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="truncate font-medium text-foreground">
                        {item.product?.name || `Product #${item.productId}`}
                      </h4>

                      <div className="mt-1 flex items-center space-x-4 text-sm text-muted-foreground">
                        <span>Qty: {item.qty}</span>
                        {item.product?.price && (
                          <span>
                            Unit Price: {formatCurrency(item.product.price)}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-right ml-4">
                      <div className="text-lg font-semibold text-foreground">
                        {formatCurrency(item.totalAmount)}
                      </div>
                      {item.product?.price && (
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(item.product.price)} × {item.qty}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="border-t border-border/60 bg-muted/30 p-6">
          <div className="space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground">Total Items</span>
              <span className="font-medium">{getTotalItems()} items</span>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-foreground">
                Subtotal
              </span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(getTotalAmount())}
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
