"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  CreditCard,
  Upload,
  Clock,
  AlertCircle,
  CheckCircle,
  Copy,
  ExternalLink,
  FileText,
  Shield,
  Info,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface PaymentDetailsProps {
  order: {
    id: number;
    status: string;
    paymentMethod: string;
    grandTotal: string | number;
    payment?: {
      status: string;
      amount: string | number;
      proofUrl?: string;
    };
  };
  children?: React.ReactNode;
}

export default function PaymentDetails({
  order,
  children,
}: PaymentDetailsProps) {
  const formatCurrency = (amount: string | number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(amount));
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard!`);
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "paid":
      case "settlement":
        return "bg-emerald-100/80 text-emerald-700 border-emerald-200";
      case "pending":
      case "pending_payment":
        return "bg-amber-100/80 text-amber-700 border-amber-200";
      case "failed":
      case "expired":
        return "bg-rose-100/80 text-rose-700 border-rose-200";
      default:
        return "bg-muted text-muted-foreground border-border/60";
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "GATEWAY":
        return <CreditCard className="w-5 h-5" />;
      case "MANUAL_TRANSFER":
        return <Upload className="w-5 h-5" />;
      default:
        return <CreditCard className="w-5 h-5" />;
    }
  };

  return (
    <Card className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-sm">
      <CardHeader className="border-b bg-primary/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            {getPaymentMethodIcon(order.paymentMethod)}
            <div>
              <CardTitle className="text-lg font-semibold text-foreground">
                Payment Details
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                {order.paymentMethod === "GATEWAY"
                  ? "Online Payment"
                  : "Manual Transfer"}
              </p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-primary">
              {formatCurrency(order.grandTotal)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-6">
        {/* Payment Status */}
        <div className="flex items-center justify-between rounded-xl border border-border/60 bg-muted/40 p-4">
          <div className="flex items-center space-x-3">
            {order.payment?.status === "PAID" ||
            order.payment?.status === "settlement" ? (
              <CheckCircle className="w-5 h-5 text-emerald-600" />
            ) : order.status === "PENDING_PAYMENT" ? (
              <Clock className="w-5 h-5 text-amber-600" />
            ) : (
              <AlertCircle className="w-5 h-5 text-rose-600" />
            )}
            <div>
              <p className="font-medium text-foreground">Payment Status</p>
              <p className="text-sm text-muted-foreground">
                Current payment state
              </p>
            </div>
          </div>
          <Badge
            className={getPaymentStatusColor(
              order.payment?.status || order.status
            )}
          >
            {order.payment?.status || order.status}
          </Badge>
        </div>

        {/* Manual Transfer Instructions */}
        {order.paymentMethod === "MANUAL_TRANSFER" &&
          order.status === "PENDING_PAYMENT" && (
            <div className="rounded-xl border border-primary/20 bg-primary/10 p-4">
              <div className="flex items-start space-x-3">
                <Info className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
                <div className="space-y-3">
                  <div>
                    <h4 className="font-medium text-foreground">
                      Transfer Instructions
                    </h4>
                    <p className="text-sm text-muted-foreground">
                      Please transfer the exact amount to one of the following
                      accounts:
                    </p>
                  </div>

                  {/* Bank Account Details */}
                  <div className="space-y-2">
                    <div className="rounded-xl border border-border/60 bg-card p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-foreground">
                            BCA - Bank Central Asia
                          </p>
                          <p className="text-sm text-muted-foreground">1234567890</p>
                          <p className="text-sm text-muted-foreground">
                            PT. Your Company
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            copyToClipboard("1234567890", "Account number")
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-border/60 bg-card p-3">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="font-medium text-foreground">Mandiri</p>
                          <p className="text-sm text-muted-foreground">0987654321</p>
                          <p className="text-sm text-muted-foreground">
                            PT. Your Company
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            copyToClipboard("0987654321", "Account number")
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1 text-xs text-primary">
                    <p>
                      • Transfer exact amount:{" "}
                      {formatCurrency(order.grandTotal)}
                    </p>
                    <p>• Upload payment proof after transfer</p>
                    <p>• Payment will be verified within 1-2 business days</p>
                  </div>
                </div>
              </div>
            </div>
          )}

        {/* Payment Proof */}
        {order.payment?.proofUrl && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">
                    Payment Proof Uploaded
                  </p>
                  <p className="text-sm text-green-700">
                    Verification in progress
                  </p>
                </div>
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(order.payment?.proofUrl, "_blank")}
              >
                <ExternalLink className="w-4 h-4 mr-1" />
                View
              </Button>
            </div>
          </div>
        )}

        {/* Payment Summary */}
        <div className="space-y-3">
          <Separator />

          <div className="flex justify-between items-center">
            <span className="text-sm text-muted-foreground">
              Payment Method
            </span>
            <span className="font-medium">
              {order.paymentMethod === "GATEWAY"
                ? "Online Payment"
                : "Manual Transfer"}
            </span>
          </div>

          {order.payment && (
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Amount Paid</span>
              <span className="font-medium">
                {formatCurrency(order.payment.amount)}
              </span>
            </div>
          )}

          <Separator />

          <div className="flex justify-between items-center text-lg font-bold">
            <span>Total Amount</span>
            <span className="text-primary">
              {formatCurrency(order.grandTotal)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        {children && <div className="pt-4 border-t">{children}</div>}

        {/* Security Notice */}
        <div className="flex items-center space-x-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
          <Shield className="w-4 h-4" />
          <p>Your payment information is encrypted and secure</p>
        </div>
      </CardContent>
    </Card>
  );
}
