"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { MdDiscount } from "react-icons/md";
import { FaTag } from "react-icons/fa";
import { Tag } from "lucide-react";

interface ApplyDiscountProps {
  onApplyDiscount?: (code: string) => void;
  isLoading?: boolean;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
}

export default function ApplyDiscount({ 
  onApplyDiscount, 
  isLoading = false,
  className = "",
  placeholder = "SAVE10, WELCOME20...",
  disabled = false
}: ApplyDiscountProps) {
  const [discountCode, setDiscountCode] = React.useState("");

  const handleApply = () => {
    if (discountCode.trim() && onApplyDiscount) {
      onApplyDiscount(discountCode.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleApply();
    }
  };

  return (
    <Card className={`bg-card rounded-2xl border border-border shadow-sm backdrop-blur-sm overflow-hidden ${className}`}>
      <CardHeader className="p-4">
        <CardTitle className="flex items-center gap-3 text-lg">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shadow-md">
            <MdDiscount className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-foreground">
              Promo Code
            </div>
            <div className="text-sm font-normal text-muted-foreground">
              Get instant discounts
            </div>
          </div>
        </CardTitle>
      </CardHeader>

      {/* separator (match AddressCard) */}
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
        <div className="space-y-3">
          <Label
            htmlFor="promo"
            className="text-sm font-medium text-foreground"
          >
            Enter discount code
          </Label>
          <div className="flex gap-3">
            <div className="flex-1 relative">
              <Input
                id="promo"
                value={discountCode}
                onChange={(e) => setDiscountCode(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={placeholder}
                className="pl-10 pr-4 py-2 border-2 border-border hover:border-primary/50 focus:border-primary transition-colors"
                disabled={isLoading || disabled}
              />
              <FaTag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
            <Button
              variant="outline"
              onClick={handleApply}
              disabled={!discountCode.trim() || isLoading || disabled}
              className="px-6 border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors"
            >
              {isLoading ? "Applying..." : "Apply"}
            </Button>
          </div>
          <div className="text-xs text-muted-foreground flex items-center gap-1">
            <Tag className="w-3 h-3" />
            Valid codes will be applied automatically
          </div>
        </div>
      </CardContent>
    </Card>
  );
}