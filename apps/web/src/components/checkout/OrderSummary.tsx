"use client";

import React from "react";
// Button removed (idempotency UI removed)
import { RippleButton } from "@/components/ui/ripple-button";
import {
  Card,
  CardHeader,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import type { CartResponse as Cart } from "@repo/schemas";
import { validateCartForCheckout } from "@/utils/cartStockUtils";

export interface Props {
  cart: Cart;
  items: Array<{ productId: number; qty: number }>;
  // idempotency removed after testing
  onPlaceOrder: () => void;
  isProcessing: boolean;
  customer?: { fullName?: string; phone?: string; email?: string };
  address?: {
    addressLine?: string;
    city?: string;
    postalCode?: string | number;
  };
  shippingMethod?: string | null;
  shippingOption?: string | null;
  appliedDiscounts?: Array<{
    type: "PERCENTAGE" | "NOMINAL" | "BUYXGETX";
    value: string;
    amount?: number | null;
    buyQty?: number | null;
    getQty?: number | null;
    minPurchase?: number | null;
    maxDiscount?: number | null;
    product: { id: number; name: string } | null;
  }>;
}
function calculateDiscount(
  items: Array<{ productId: number; qty: number }>,
  cart: Cart,
  discounts: Props["appliedDiscounts"] = []
) {
  let totalDiscount = 0;

  for (const discount of discounts) {
    const item = items.find((it) => it.productId === discount.product?.id);
    const productPriceRaw =
      cart.items.find((ci) => ci.productId === discount.product?.id)?.product
        ?.price ?? 0;
    const productPrice = Number(productPriceRaw);

    if (!item) continue;

    switch (discount.type) {
      case "PERCENTAGE": {
        if (discount.minPurchase && item.qty < discount.minPurchase) {
          totalDiscount += 0;
          break;
        }
        const amt = discount.amount ?? 0;

        // Handle null/undefined amounts
        if (amt === 0) {
          break;
        }

        // support two formats:
        // - fraction (e.g. 0.02 means 2%)
        // - whole percent (e.g. 2 means 2%)
        let raw = 0;
        if (amt <= 1) {
          raw = productPrice * item.qty * amt; // fraction format
        } else {
          raw = (productPrice * item.qty * amt) / 100; // whole percent format
        }
        // round to nearest integer currency unit before capping
        const rounded = Math.round(raw);
        const capped = discount.maxDiscount
          ? Math.min(rounded, discount.maxDiscount)
          : rounded;
        totalDiscount += capped;
        break;
      }

      case "NOMINAL": {
        if (discount.minPurchase && item.qty < discount.minPurchase) {
          totalDiscount += 0;
          break;
        }
        const amt = discount.amount ?? 0;

        if (amt === 0) {
          break;
        }

        const discountz = amt * item.qty;
        const roundedNominal = Math.round(discountz);
        const cappedNominal = discount.maxDiscount
          ? Math.min(roundedNominal, discount.maxDiscount)
          : roundedNominal;
        totalDiscount += cappedNominal;
        break;
      }

      case "BUYXGETX": {
        if (!item) break;
        const buyQty = discount.buyQty ?? 0;
        const getQty = discount.getQty ?? 0;
        const totalQty = item.qty;

        if (buyQty <= 0) break;

        const freeItems = Math.floor(totalQty / (buyQty + getQty)) * getQty;
        const payableQty = totalQty - freeItems;

        totalDiscount += (totalQty - payableQty) * productPrice;
        break;
      }
    }
  }

  return totalDiscount;
}

export default function OrderSummary({
  cart,
  items,
  onPlaceOrder,
  appliedDiscounts = [],
  isProcessing,
  customer,
  address,
  shippingMethod,
  shippingOption,
}: Props) {
  const subtotal = items.reduce((s, it) => {
    const p =
      cart.items.find((ci) => ci.productId === it.productId)?.product?.price ??
      0;
    return s + Number(p) * it.qty;
  }, 0);

  const discountAmount = calculateDiscount(items, cart, appliedDiscounts);
  const total = Math.max(0, subtotal - discountAmount);
  // Compute shipping fee based on selected carrier and option
  function getShippingRate(method?: string | null, option?: string | null) {
    if (!method) return 0;
    const base: Record<string, number> = {
      JNE: 12000,
      "J&T": 15000,
      "Ninja Xpress": 18000,
      Ninja: 18000,
    };
    const baseRate = base[method] ?? 0;
    // Option adjustments: "Hemat Kargo" gives a discount; "Reguler" uses base
    if (!option) return baseRate;
    if (option === "Hemat Kargo") return Math.round(baseRate * 0.8);
    return baseRate;
  }

  const shippingFee = getShippingRate(shippingMethod, shippingOption);
  const totalWithShipping = total + shippingFee;
  // Check if cart has any out of stock items
  // Validate stock only for the items currently selected for checkout
  const selectedCartItems = (cart.items || []).filter((ci) =>
    items.some((it) => it.productId === ci.productId)
  );
  const { outOfStockItems } = validateCartForCheckout(selectedCartItems);

  const hasOutOfStockItems = outOfStockItems.length > 0;

  return (
    <div className="lg:sticky lg:top-6">
      {/* Elevated card with stronger visual treatment to make it stand out */}
      <Card className="relative bg-card rounded-2xl border border-border shadow-2xl ring-2 ring-primary/15 backdrop-blur-sm overflow-hidden transform-gpu transition-transform duration-200 hover:scale-[1.01]">
        {/* left accent bar */}
        <div
          className="absolute left-0 top-0 h-full w-1 rounded-tr-2xl rounded-br-2xl bg-gradient-to-b from-primary to-transparent"
          aria-hidden
        />
        <CardHeader className="p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent">
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
                  d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-bold text-foreground">
                Order Summary
              </h3>
              <p className="text-sm text-muted-foreground">
                Review your order details
              </p>
            </div>
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

        <CardContent className="pl-6 pr-6 pb-6">
          {/* Order Items Count */}
          <div className="flex items-center justify-between py-2"></div>

          {/* Price Breakdown */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-foreground">Subtotal</span>
              <span className="font-medium text-foreground">
                Rp {subtotal.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground">Discount</span>
              <span className="font-medium text-muted-foreground">
                -Rp {discountAmount.toLocaleString("id-ID")}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-foreground">Shipping</span>
              <div className="flex flex-col items-end">
                {shippingMethod ? (
                  <>
                    <span className="font-medium text-foreground">
                      Rp {shippingFee.toLocaleString("id-ID")}
                    </span>
                    {shippingOption ? (
                      <span className="text-xs text-muted-foreground block">
                        {shippingMethod} • {shippingOption}
                      </span>
                    ) : null}
                  </>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    Not selected
                  </span>
                )}
              </div>
            </div>

            <hr className="border-border" />

            <div className="flex justify-between items-center pb-4">
              <span className="text-lg font-semibold text-foreground">
                Total
              </span>
              <span className="text-2xl font-bold text-primary">
                Rp {totalWithShipping.toLocaleString("id-ID")}
              </span>
            </div>
          </div>

          {/* Shipping Information */}
          {(customer || address) && (
            <div className="bg-muted/30 rounded-xl p-4 space-y-3">
              <h4 className="font-semibold text-foreground flex items-center gap-2">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-4 h-4 text-primary"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                Delivery Address
              </h4>

              <div className="space-y-2 text-sm">
                {customer?.fullName && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Name:</span>
                    <span className="font-medium text-foreground">
                      {customer.fullName}
                    </span>
                  </div>
                )}
                {address?.addressLine && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Address:</span>
                    <span className="font-medium text-foreground text-right max-w-[200px]">
                      {address.addressLine}
                    </span>
                  </div>
                )}
                {address?.city && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">City:</span>
                    <span className="font-medium text-foreground">
                      {address.city}
                    </span>
                  </div>
                )}
                {customer?.phone && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Phone:</span>
                    <span className="font-medium text-foreground">
                      {customer.phone}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* idempotency UI removed after testing */}
        </CardContent>

        <CardFooter className="p-6 pt-0">
          <div className="w-full space-y-4">
            {/* Out of stock warning */}
            {hasOutOfStockItems && (
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <div className="flex items-center gap-2">
                  <svg
                    className="h-5 w-5 text-red-500 flex-shrink-0"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <div>
                    <div className="text-sm text-red-700 font-medium">
                      Cannot place order
                    </div>
                    <div className="text-xs text-red-600">
                      Remove out of stock items to continue
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Place Order Button (RippleButton) */}
            <RippleButton
              onClick={onPlaceOrder}
              size="lg"
              disabled={isProcessing}
              className={`w-full py-4 rounded-2xl font-semibold text-lg transition-all duration-200 ${
                isProcessing
                  ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                  : hasOutOfStockItems
                  ? "bg-red-500 text-white hover:bg-red-600 shadow-lg hover:shadow-xl"
                  : "bg-primary-gradient text-primary-foreground hover:opacity-95 shadow-lg hover:shadow-xl"
              }`}
              rippleClassName={
                isProcessing ? "bg-input" : "bg-primary-foreground/30"
              }
            >
              {isProcessing ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
                  Processing...
                </div>
              ) : hasOutOfStockItems ? (
                "Remove Out of Stock Items"
              ) : (
                <div className="flex items-center gap-2">
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  </svg>
                  Place Order
                </div>
              )}
            </RippleButton>

            {/* Security note */}
            <div className="text-center text-xs text-muted-foreground space-y-1">
              <p className="flex items-center justify-center gap-1">
                <svg
                  className="w-3 h-3"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                  />
                </svg>
                Secure checkout
              </p>
              <p>Your payment information is protected</p>
            </div>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
}
