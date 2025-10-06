"use client";

import React from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MdDiscount } from "react-icons/md";
import { Tag } from "lucide-react";
import { useDiscountsByProductIds } from "@/hooks/useDiscount";
import { DiscountResponse } from "@/types/discount.types";
import type { CartResponse as Cart } from "@repo/schemas";

interface ApplyDiscountProps {
  cart: Cart;
  handleUpdateCart: (itemId: number, newQty: number) => Promise<void>;
  onApplyDiscount?: (discounts: DiscountResponse[]) => void;
  isLoading?: boolean;
  className?: string;
  disabled?: boolean;
}

export default function ApplyDiscount({
  handleUpdateCart,
  cart,
  onApplyDiscount,
  isLoading = false,
  className = "",
  disabled = false,
}: ApplyDiscountProps) {
  const [selectedDiscountIds, setSelectedDiscountIds] = React.useState<
    number[]
  >([]);
  const [appliedDiscountIds, setAppliedDiscountIds] = React.useState<number[]>(
    []
  );

  // Get product IDs safely, defaulting to empty array if cart or items don't exist

  const productIds = cart?.items?.map((it) => it.productId) || [];
  const { data: discounts = [] } = useDiscountsByProductIds(productIds);
  console.log("Cart items:", cart?.items);
  console.log("Product IDs:", productIds);
  console.log("Discounts from API:", discounts);

  // Add defensive check for cart and cart.items
  if (!cart || !cart.items) {
    return (
      <Card
        className={`bg-card rounded-2xl border border-border shadow-sm backdrop-blur-sm overflow-hidden ${className}`}
      >
        <CardHeader className="p-4">
          <CardTitle className="flex items-center gap-3 text-lg">
            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shadow-md">
              <MdDiscount className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="font-semibold text-foreground">Promo Code</div>
              <div className="text-sm font-normal text-muted-foreground">
                Loading discounts...
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="text-sm text-muted-foreground">
            Loading cart data...
          </div>
        </CardContent>
      </Card>
    );
  }

  const handleApply = async () => {
    let updated: number[];

    const allAlreadyApplied = selectedDiscountIds.every((id) =>
      appliedDiscountIds.includes(id)
    );

    // Build list of operations to perform so we can run them sequentially and
    // revert on failure.
    type Op = { itemId: number; from: number; to: number };
    const ops: Op[] = [];

    if (allAlreadyApplied) {
      // UNAPPLY locally
      updated = appliedDiscountIds.filter(
        (id) => !selectedDiscountIds.includes(id)
      );
      const removedDiscounts = discounts.filter((d) =>
        selectedDiscountIds.includes(d.id)
      );

      for (const removed of removedDiscounts) {
        if (removed.type === "BUYXGETX") {
          const productId = removed.product?.id ?? 0;
          const cartItem = cart.items.find((it) => it.productId === productId);
          if (!cartItem) continue;
          const oldQty = cartItem.qty;
          ops.push({ itemId: cartItem.id, from: oldQty, to: Math.max(0, oldQty - 1) });
        }
      }
    } else {
      // APPLY
      updated = Array.from(
        new Set([...appliedDiscountIds, ...selectedDiscountIds])
      );

      const addedDiscounts = discounts.filter((d) =>
        selectedDiscountIds.includes(d.id)
      );

      for (const added of addedDiscounts) {
        if (added.type === "BUYXGETX") {
          const productId = added.product?.id ?? 0;
          const cartItem = cart.items.find((it) => it.productId === productId);
          if (!cartItem) continue;
          const oldQty = cartItem.qty;
          ops.push({ itemId: cartItem.id, from: oldQty, to: oldQty + 1 });
        }
      }
    }

    // Execute ops sequentially and keep track of succeeded ones to allow revert
    const succeeded: Op[] = [];

    try {
      for (const op of ops) {
        try {
          await handleUpdateCart(op.itemId, op.to);
          succeeded.push(op);
        } catch (err: unknown) {
          // Map and show friendly message, then throw to outer catch to revert
          const msg = err instanceof Error ? err.message : "Update failed";
          toast.error(msg.includes("stock") ?
            "Not enough stock to apply selected discount(s)." : msg);
          throw err;
        }
      }

      // If all ops succeeded, commit the applied discount ids locally
      setAppliedDiscountIds(updated);

      if (onApplyDiscount) {
        const selected: DiscountResponse[] = discounts.filter((d) =>
          updated.includes(d.id)
        );
        onApplyDiscount(selected);
      }

      setSelectedDiscountIds([]);
    } catch (err) {
      // Revert any successful changes (best effort). Don't surface further errors
      if (succeeded.length > 0) {
        for (const s of succeeded.reverse()) {
          try {
            // revert to original qty
            await handleUpdateCart(s.itemId, s.from);
          } catch (revertErr) {
            if (process.env.NODE_ENV === "development") {
              console.warn("Failed to revert cart change:", revertErr);
            }
          }
        }
      }

      // ensure UI state does not reflect a partially-applied discount
      // do not modify appliedDiscountIds here since the server is the source of truth;
      // but clear the current selection so user can try again
      setSelectedDiscountIds([]);
      if (process.env.NODE_ENV === "development") console.warn("Apply discount failed:", err);
    }
  };

  return (
    <Card
      className={`bg-card rounded-2xl border border-border shadow-sm backdrop-blur-sm overflow-hidden ${className}`}
    >
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shadow-md">
            <MdDiscount className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-foreground">Promo Code</div>
            <div className="text-sm font-normal text-muted-foreground">
              Get instant discounts
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-3">
          <Label
            htmlFor="promo"
            className="text-sm font-medium text-foreground"
          >
            Select discounts
          </Label>

          <select
            id="promo"
            multiple
            className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm
             shadow-sm focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary
             disabled:cursor-not-allowed disabled:opacity-50"
            value={selectedDiscountIds.map(String)}
            onChange={(e) => {
              const selected = Array.from(e.target.selectedOptions, (opt) =>
                Number(opt.value)
              );
              setSelectedDiscountIds(selected);
            }}
            disabled={isLoading || disabled}
          >
            {discounts.length === 0 ? (
              <option disabled>No discounts available</option>
            ) : (
              discounts.map((d) => {
                const isApply = appliedDiscountIds.includes(d.id);
                return (
                  <option key={d.id} value={d.id} className="py-1">
                    {isApply ? "✅ " : ""}
                    {d.product?.name ?? "Unknown Product"} – {d.name} –{" "}
                    {d.value}
                  </option>
                );
              })
            )}
          </select>

          <Button
            variant="outline"
            className="px-6 border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
            onClick={handleApply}
            disabled={isLoading || disabled || selectedDiscountIds.length === 0}
          >
            Apply
          </Button>

          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {appliedDiscountIds.length > 0
              ? `Applied ${appliedDiscountIds.length} discounts`
              : "Selected discounts will be applied automatically"}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
