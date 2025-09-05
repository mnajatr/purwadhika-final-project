"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import type { Cart } from "@/types/cart.types";

interface Props {
  cart: Cart;
  items: Array<{ productId: number; qty: number }>;
  idempotencyKey: string | null;
  setIdempotencyKey: (k: string | null) => void;
  onPlaceOrder: () => void;
  isProcessing: boolean;
}

export default function OrderSummary({
  cart,
  items,
  idempotencyKey,
  setIdempotencyKey,
  onPlaceOrder,
  isProcessing,
}: Props) {
  const subtotal = items.reduce((s, it) => {
    const p =
      cart.items.find((ci) => ci.productId === it.productId)?.product?.price ??
      0;
    return s + Number(p) * it.qty;
  }, 0);

  return (
    <Card className="relative lg:sticky lg:top-6 shadow-lg border border-gray-100 overflow-hidden rounded-lg">
      <CardHeader className="p-0">
        <div className="absolute top-0 left-0 right-0 rounded-t-lg bg-gradient-to-r from-indigo-600 to-rose-500 text-white p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-6 h-6 text-white"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M3 3h18v4H3zM6 11h12l-1.5 9H7.5L6 11z"
              />
            </svg>
            <div>
              <CardTitle className="text-white">Order Summary</CardTitle>
              <CardDescription className="text-indigo-100 text-sm">
                Secure and fast — finalizes stock at checkout
              </CardDescription>
            </div>
          </div>
          <Badge className="bg-white text-indigo-700">Secure</Badge>
        </div>
      </CardHeader>
      <CardContent className="pt-16">
        <div className="text-sm text-muted-foreground mb-3">
          {items.length} item(s)
        </div>

        <div className="flex justify-between mb-2">
          <span>Subtotal</span>
          <span className="font-medium">Rp {subtotal.toLocaleString()}</span>
        </div>

        <div className="flex justify-between mb-2">
          <span>Shipping</span>
          <span className="font-medium">Rp 0</span>
        </div>

        <div className="flex justify-between border-t pt-3 mt-3 items-end">
          <span className="font-semibold text-slate-700">Total</span>
          <span className="text-2xl md:text-3xl bg-clip-text text-transparent font-extrabold bg-gradient-to-r from-indigo-600 to-rose-500">
            Rp {subtotal.toLocaleString()}
          </span>
        </div>

        <div className="mt-4">
          <div className="mb-2 text-sm">Idempotency Key</div>
          <div className="flex items-center gap-2 mb-3">
            <input
              className="flex-1 input input-bordered text-sm"
              readOnly
              value={idempotencyKey ?? "(generated on submit)"}
              aria-label="idempotency-key"
            />
            <Button
              size="sm"
              onClick={() => {
                const k = String(Math.random()).slice(2, 14);
                setIdempotencyKey(k);
                try {
                  sessionStorage.setItem("checkout:idempotencyKey", k);
                } catch {}
              }}
            >
              Generate
            </Button>
          </div>
        </div>

        <div className="mt-6 border-t pt-4 text-sm">
          <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="w-5 h-5 text-blue-600"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v9a2 2 0 002 2z"
              />
            </svg>
            Shipping Information
          </h4>
          <div className="grid grid-cols-2 gap-2 text-sm mb-3">
            <div>Name</div>
            <div className="font-medium">Zahra Ayu</div>

            <div>Address</div>
            <div className="font-medium">cengkareng</div>

            <div>City</div>
            <div className="font-medium">Jakarta Barat</div>

            <div>Postal Code</div>
            <div className="font-medium">11220</div>
          </div>

          <div className="border-t pt-4 mt-3">
            <h4 className="font-semibold text-lg mb-3 flex items-center gap-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5 text-blue-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.637 6.879 1.804M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              Customer Information
            </h4>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Phone</div>
              <div className="font-medium">082320488430</div>

              <div>Email</div>
              <div className="font-medium">bobajones012@gmail.com</div>
            </div>
          </div>
        </div>
      </CardContent>
      <CardFooter className="flex-col gap-2">
        <div className="w-full">
          <div className="mb-1 text-sm text-muted-foreground">
            Payment:{" "}
            <span className="font-medium text-slate-800">Bank Transfer</span>
          </div>
          <Button
            onClick={onPlaceOrder}
            size="lg"
            className="w-full"
            disabled={isProcessing}
          >
            {isProcessing ? "Processing..." : "Place Order"}
          </Button>
          <div className="mt-2 text-xs text-muted-foreground">
            Secure checkout • No extra charges • Idempotency prevents duplicates
          </div>
        </div>
      </CardFooter>
    </Card>
  );
}
