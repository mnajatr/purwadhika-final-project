"use client";

import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Check, Clock, Package } from "lucide-react";
import { MdLocalShipping } from "react-icons/md";
import { TbTruckDelivery, TbDiscount } from "react-icons/tb";
import { FaShippingFast, FaCheckCircle } from "react-icons/fa";

const SHIPPING_CARRIERS = [
  {
    id: "JNE",
    name: "JNE Express",
    eta: "2-3 days",
    price: "Rp 12.000",
    gradient: "from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900",
    textColor: "text-red-600 dark:text-red-400",
  },
  {
    id: "J&T",
    name: "J&T Express",
    eta: "1-2 days",
    price: "Rp 15.000",
    gradient:
      "from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900",
    textColor: "text-green-600 dark:text-green-400",
  },
  {
    id: "Ninja Xpress",
    name: "Ninja Xpress",
    eta: "1-3 days",
    price: "Rp 18.000",
    gradient:
      "from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900",
    textColor: "text-purple-600 dark:text-purple-400",
  },
] as const;

const SHIPPING_OPTIONS = [
  { id: "Reguler", icon: TbTruckDelivery, color: "text-blue-500" },
  { id: "Hemat Kargo", icon: TbDiscount, color: "text-green-500" },
] as const;

type ShippingMethodCardProps = {
  shippingMethod: string | null;
  shippingOption: string | null;
  selectedAddress: boolean;
  onShippingMethodChange: (method: string) => void;
  onShippingOptionChange: (option: string) => void;
};

export function ShippingMethodCard({
  shippingMethod,
  shippingOption,
  selectedAddress,
  onShippingMethodChange,
  onShippingOptionChange,
}: ShippingMethodCardProps) {
  const [shippingMenuOpen, setShippingMenuOpen] = React.useState(false);
  const [shippingOptionOpen, setShippingOptionOpen] = React.useState(false);
  const [shippingMenuWidth, setShippingMenuWidth] = React.useState<
    number | null
  >(null);
  const cardRef = React.useRef<HTMLDivElement | null>(null);

  const updateShippingMenuWidth = React.useCallback(() => {
    const el = cardRef.current;
    if (!el) return setShippingMenuWidth(null);
    const rect = el.getBoundingClientRect();
    setShippingMenuWidth(Math.round(rect.width));
  }, []);

  React.useEffect(() => {
    if (!shippingMenuOpen) return;
    updateShippingMenuWidth();
    const onResize = () => updateShippingMenuWidth();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [shippingMenuOpen, updateShippingMenuWidth]);

  const handleCarrierSelect = (carrierId: string) => {
    onShippingMethodChange(carrierId);
    setShippingMenuOpen(false);
    setShippingOptionOpen(true);
  };

  return (
    <div
      className={`flex items-center gap-6 transition-all duration-300 rounded-xl ${
        !shippingMethod && selectedAddress
          ? "bg-orange-50/50 dark:bg-orange-900/10"
          : ""
      }`}
      data-field="shipping"
    >
      <div className="hidden lg:flex flex-col items-center w-14">
        <div
          className={`z-10 flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300 ${
            shippingMethod
              ? "bg-primary text-white shadow-lg scale-110"
              : selectedAddress
              ? "bg-orange-100 border-2 border-orange-300 text-orange-600"
              : "bg-muted border-2 border-border"
          }`}
        >
          {shippingMethod ? (
            <FaCheckCircle className="w-5 h-5" />
          ) : (
            <FaShippingFast className="w-5 h-5" />
          )}
        </div>
      </div>
      <div className="flex-1">
        <Card className="bg-card rounded-2xl border border-border shadow-sm backdrop-blur-sm overflow-hidden">
          <div ref={cardRef} className="w-full relative z-10">
            <CardHeader className="p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center relative">
                    <MdLocalShipping className="w-7 h-7 text-primary" />
                    {shippingMethod && (
                      <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      Shipping Method
                      {shippingMethod && (
                        <Badge variant="secondary" className="text-xs">
                          Selected
                        </Badge>
                      )}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Choose your preferred delivery option
                    </p>
                  </div>
                </div>

                {/* removed header button - trigger moved to CardContent to align with shipping option button */}
              </div>
            </CardHeader>

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

            <CardContent className="p-6 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                  <TbTruckDelivery className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-lg">
                    {shippingMethod ?? "Select shipping carrier"}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {shippingMethod
                      ? "Fast and reliable delivery service"
                      : "Choose from available carriers"}
                  </div>
                </div>
              </div>

              <DropdownMenu
                open={shippingMenuOpen}
                onOpenChange={(open) => {
                  if (open) updateShippingMenuWidth();
                  setShippingMenuOpen(open);
                }}
              >
                <DropdownMenuTrigger asChild>
                  <div className="flex items-center gap-4">
                    {/* visible trigger button aligned to the right of the carrier area */}
                    <Button
                      variant={shippingMethod ? "default" : "outline"}
                      size="sm"
                      className="min-w-[80px]"
                    >
                      {shippingMethod ? "Change" : "Select"}
                    </Button>
                  </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent
                  align="start"
                  sideOffset={8}
                  className="p-4 min-w-[400px] shadow-2xl border-2"
                  style={{
                    width: shippingMenuWidth
                      ? `${shippingMenuWidth}px`
                      : undefined,
                  }}
                >
                  <div className="mb-3">
                    <h4 className="font-semibold text-foreground mb-1">
                      Available Carriers
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      Choose your preferred shipping option
                    </p>
                  </div>

                  {SHIPPING_CARRIERS.map((carrier) => (
                    <DropdownMenuItem
                      key={carrier.id}
                      onSelect={() => handleCarrierSelect(carrier.id)}
                      className="p-4 hover:bg-primary/5 rounded-xl"
                    >
                      <div className="flex items-center justify-between w-full">
                        <div className="flex items-center gap-4">
                          <div
                            className={`w-12 h-12 rounded-xl bg-gradient-to-br ${carrier.gradient} flex items-center justify-center text-sm font-bold ${carrier.textColor} shadow-md`}
                          >
                            {carrier.id === "Ninja Xpress" ? "NX" : carrier.id}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground">
                              {carrier.name}
                            </div>
                            <div className="text-sm text-muted-foreground flex items-center gap-2">
                              <Clock className="w-3 h-3" />
                              ETA: {carrier.eta}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          <span className="font-semibold text-foreground">
                            {carrier.price}
                          </span>
                          {shippingMethod === carrier.id && (
                            <Check className="w-5 h-5 text-primary" />
                          )}
                        </div>
                      </div>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </CardContent>
          </div>

          {shippingMethod && (
            <CardContent className="p-6 pt-0 border-t border-border/50">
              <div className="flex items-center justify-between bg-gradient-to-r from-muted/50 to-transparent p-4 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <div className="font-semibold text-foreground">
                      {shippingOption ?? "Select shipping option"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Choose delivery speed and pricing
                    </div>
                  </div>
                </div>

                <DropdownMenu
                  open={shippingOptionOpen}
                  onOpenChange={setShippingOptionOpen}
                >
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="min-w-[80px]"
                    >
                      {shippingOption ? "Change" : "Select"}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent
                    align="start"
                    sideOffset={4}
                    className="p-3 min-w-[200px]"
                  >
                    {SHIPPING_OPTIONS.map((option) => (
                      <DropdownMenuItem
                        key={option.id}
                        onSelect={() => {
                          onShippingOptionChange(option.id);
                          setShippingOptionOpen(false);
                        }}
                        className="p-3 rounded-lg hover:bg-primary/5"
                      >
                        <div className="flex items-center gap-2">
                          <option.icon className={`w-4 h-4 ${option.color}`} />
                          <span className="font-medium">{option.id}</span>
                        </div>
                      </DropdownMenuItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  );
}
