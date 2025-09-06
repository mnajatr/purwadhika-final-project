"use client";

import React from "react";
import type { Cart } from "@/types/cart.types";
import CartItem from "@/components/cart/CartItem";
import { Card, CardContent, CardTitle, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface Props {
  cart: Cart;
  selectedIds?: number[] | null;
  userId: number;
}

export default function ItemsList({ cart, selectedIds, userId }: Props) {
  const items =
    selectedIds && selectedIds.length > 0
      ? cart.items.filter((it) => selectedIds.includes(it.id))
      : cart.items;
  return (
    <Card className="relative shadow-sm border-gray-100 overflow-hidden rounded-lg">
      <CardHeader className="p-0">
        <div className="absolute top-0 left-0 right-0 rounded-t-lg bg-gradient-to-r from-indigo-50 to-white p-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-indigo-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 3h18v4H3zM6 11h12l-1.5 9H7.5L6 11z"
              />
            </svg>
            <CardTitle className="text-sm">Cart Items</CardTitle>
            <Badge className="text-xs">{items.length}</Badge>
          </div>
          <div className="text-xs text-muted-foreground">Summary view</div>
        </div>
      </CardHeader>
      <CardContent className="pt-14">
        <div className="space-y-2 mt-0">
          {items.map((it) => (
            <div
              key={it.id}
              className="py-2 px-3 border rounded hover:shadow-sm transition-shadow"
            >
              <CartItem item={it} userId={userId} readOnly />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
