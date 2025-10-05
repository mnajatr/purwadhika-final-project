"use client";

import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, ShieldCheck } from "lucide-react";
import { MdPayment } from "react-icons/md";
import { FaTruck, FaWallet, FaLock, FaCheckCircle } from "react-icons/fa";
import { TbCreditCard } from "react-icons/tb";

const PAYMENT_METHODS = [
  {
    id: "Manual",
    title: "Manual Transfer",
    subtitle: "Bank transfer verification",
    icon: FaTruck,
    color: "from-primary/20 to-primary/40",
    iconColor: "text-primary",
  },
  {
    id: "Gateway",
    title: "Payment Gateway",
    subtitle: "Instant online payments",
    icon: TbCreditCard,
    color: "from-primary/20 to-primary/40",
    iconColor: "text-primary",
  },
] as const;

type PaymentMethodCardProps = {
  paymentMethod: string | null;
  shippingMethod: boolean;
  onPaymentMethodChange: (method: string) => void;
};

export function PaymentMethodCard({
  paymentMethod,
  shippingMethod,
  onPaymentMethodChange,
}: PaymentMethodCardProps) {
  return (
    <div
      className={`flex items-center gap-6 transition-all duration-300 rounded-xl ${
        !paymentMethod && shippingMethod
          ? "bg-green-50/50 dark:bg-green-900/10"
          : ""
      }`}
      data-field="payment"
    >
      <div className="hidden lg:flex flex-col items-center w-14">
        <div
          className={`z-10 flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300 ${
            paymentMethod
              ? "bg-primary text-white shadow-lg scale-110"
              : shippingMethod
              ? "bg-green-100 border-2 border-green-300 text-green-600"
              : "bg-muted border-2 border-border"
          }`}
        >
          {paymentMethod ? (
            <FaCheckCircle className="w-5 h-5" />
          ) : (
            <FaWallet className="w-5 h-5" />
          )}
        </div>
      </div>
      <div className="flex-1">
        <Card className="bg-card rounded-2xl border border-border shadow-sm backdrop-blur-sm overflow-hidden">
          <CardHeader className="p-4">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center relative">
                  <MdPayment className="w-7 h-7 text-primary" />
                  {paymentMethod && (
                    <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                      <Check className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    Payment Method
                    {paymentMethod && (
                      <Badge variant="secondary" className="text-xs">
                        Selected
                      </Badge>
                    )}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    Select your preferred payment option
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1">
                <ShieldCheck className="w-5 h-5 text-green-500" />
                <span className="text-xs text-green-600 font-medium">
                  Secure
                </span>
              </div>
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

          <CardContent className="p-6 space-y-4">
            {PAYMENT_METHODS.map((method) => {
              const active = paymentMethod === method.id;
              const Icon = method.icon;
              return (
                <button
                  key={method.id}
                  onClick={() => onPaymentMethodChange(method.id)}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 text-left group hover:scale-[1.02] ${
                    active
                      ? "border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20"
                      : "border-border bg-card hover:border-primary/30 hover:shadow-md"
                  }`}
                >
                  <div
                    className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                      method.color
                    } flex items-center justify-center shadow-lg transition-all duration-300 ${
                      active ? "scale-110 shadow-xl" : "group-hover:scale-105"
                    }`}
                  >
                    <div className={method.iconColor}>
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-foreground text-lg">
                        {method.title}
                      </div>
                      {active && (
                        <Badge className="bg-primary text-primary-foreground">
                          Active
                        </Badge>
                      )}
                    </div>
                    <div className="text-sm text-muted-foreground mt-1">
                      {method.subtitle}
                    </div>
                  </div>

                  <div className="flex items-center">
                    {active ? (
                      <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
                        <Check className="w-4 h-4 text-white" />
                      </div>
                    ) : (
                      <div className="w-5 h-5 rounded-full border-2 border-border group-hover:border-primary/50 transition-colors duration-300" />
                    )}
                  </div>
                </button>
              );
            })}

            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl mt-4">
              <FaLock className="w-4 h-4 text-muted-foreground" />
              <div className="text-sm text-muted-foreground">
                <span className="font-medium">SSL encrypted.</span> Your payment
                information is secure and protected.
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
