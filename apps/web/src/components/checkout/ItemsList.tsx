"use client";

import React from "react";
import type { Cart } from "@/types/cart.types";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  cart: Cart;
  selectedIds?: number[] | null;
  userId?: number;
}

export default function ItemsList({ cart, selectedIds }: Props) {
  const items =
    selectedIds && selectedIds.length > 0
      ? cart.items.filter((it) => selectedIds.includes(it.id))
      : cart.items;

  return (
    <Card className="bg-card rounded-2xl border border-border shadow-sm backdrop-blur-sm overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center relative">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-7 h-7 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-2.5 5M7 13l2.5 5m6-5v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6m8 0V9a2 2 0 00-2-2H9a2 2 0 00-2 2v4.01"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-foreground">
                Order Items
              </h3>
              <p className="text-sm text-muted-foreground">
                {items.length} {items.length === 1 ? "item" : "items"} for
                checkout
              </p>
            </div>
          </div>

          <Badge
            variant="secondary"
            className="bg-white/20 text-primary-foreground border-0"
          >
            {items.length}
          </Badge>
        </div>
      </CardHeader>

      {/* full-width gradient separator between header and content */}
      <div className="px-4">
        <div
          aria-hidden
          className="w-full rounded-full h-1"
          style={{
            background:
              "linear-gradient(90deg, rgb(223, 239, 181), rgb(247, 237, 184), rgb(253, 231, 188))",
          }}
        />
      </div>

      <CardContent className="p-6">
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item.id}
              className={`p-3 sm:p-4 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors ${
                index !== items.length - 1 ? "mb-4" : ""
              }`}
            >
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                {/* Product Image */}
                <div className="w-16 h-16 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-8 h-8 text-primary/60"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                    />
                  </svg>
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-foreground mb-1 truncate">
                    {item.product?.name || "Unknown Product"}
                  </h4>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Qty:
                      </span>
                      <span className="font-medium text-foreground">
                        {item.qty}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        Price:
                      </span>
                      <span className="font-semibold text-primary">
                        Rp{" "}
                        {Number(item.product?.price || 0).toLocaleString(
                          "id-ID"
                        )}
                      </span>
                    </div>
                  </div>

                  {/* Stock Status - Show general availability */}
                  <div className="mt-2">
                    <Badge
                      variant="outline"
                      className="text-xs border-green-300 text-green-600"
                    >
                      Ready for Checkout
                    </Badge>
                  </div>
                </div>

                {/* Total Price */}
                <div className="text-left sm:text-right mt-3 sm:mt-0 sm:ml-auto">
                  <div className="text-lg font-bold text-foreground">
                    Rp{" "}
                    {(
                      Number(item.product?.price || 0) * item.qty
                    ).toLocaleString("id-ID")}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {item.qty} × Rp{" "}
                    {Number(item.product?.price || 0).toLocaleString("id-ID")}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
