"use client";

import React from "react";
import Image from "next/image";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  MapPin,
  User,
  Phone,
  Copy,
  Package,
  ShoppingBag,
  CreditCard,
  Upload,
  AlertCircle,
  Info,
  Shield,
  FileText,
  ExternalLink,
  HelpCircle,
  MessageSquare,
} from "lucide-react";
import { toast } from "sonner";
import { PayNowButton } from "@/components/payment";
import PaymentUpload from "./PaymentUpload";
import ConfirmButton from "./ConfirmButton";

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

interface Address {
  recipientName: string;
  addressLine: string;
  city: string;
  province: string;
  postalCode: string;
  phoneNumber?: string;
}

interface OrderOverviewProps {
  order: {
    id: number;
    status: string;
    paymentMethod: string;
    grandTotal: string | number;
    userId?: number;
    payment?: {
      status: string;
      amount: string | number;
      proofUrl?: string;
    };
  };
  items: OrderItem[];
  address: Address | null;
  apiBase: string;
  onRefresh: () => void;
  CancelButton?: React.ComponentType<{ orderId: number; userId?: number }>;
}

export default function OrderOverview({
  order,
  items,
  address,
  apiBase,
  onRefresh,
  CancelButton,
}: OrderOverviewProps) {
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

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.qty, 0);
  };

  const getTotalAmount = () => {
    return items.reduce((total, item) => total + Number(item.totalAmount), 0);
  };

  const fullAddress = address
    ? `${address.addressLine}, ${address.city}, ${address.province} ${address.postalCode}`
    : "";

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-12">
      {/* Left Column - Order Details & Items */}
      <div className="lg:col-span-8">
        <Card className="rounded-2xl border border-border/60 bg-card/80 shadow-sm">
          <CardContent className="p-0">
            {/* Shipping Section */}
            {address && (
              <div className="border-b border-border/60 p-6">
                <div className="mb-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">
                        Shipping Information
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Delivery address
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
                          fullAddress
                        )}`;
                        window.open(mapsUrl, "_blank");
                      }}
                    >
                      <MapPin className="w-4 h-4 mr-1" />
                      Maps
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() =>
                        copyToClipboard(fullAddress, "Full address")
                      }
                    >
                      <Copy className="w-4 h-4 mr-1" />
                      Copy
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Recipient */}
                  <div className="flex items-start space-x-3">
                    <User className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">
                            {address.recipientName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Recipient
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            copyToClipboard(
                              address.recipientName,
                              "Recipient name"
                            )
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Phone */}
                  {address.phoneNumber && (
                    <div className="flex items-start space-x-3">
                      <Phone className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">
                              {address.phoneNumber}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              Phone number
                            </p>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() =>
                              copyToClipboard(
                                address.phoneNumber!,
                                "Phone number"
                              )
                            }
                          >
                            <Copy className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Address */}
                  <div className="flex items-start space-x-3">
                    <MapPin className="w-5 h-5 text-muted-foreground mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-medium text-foreground leading-relaxed">
                            {address.addressLine}
                          </p>
                          <p className="text-sm text-muted-foreground mt-1">
                            {address.city}, {address.province}{" "}
                            {address.postalCode}
                          </p>
                          <p className="text-xs text-muted-foreground/70 mt-1">
                            Full delivery address
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() =>
                            copyToClipboard(fullAddress, "Full address")
                          }
                        >
                          <Copy className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Items Section */}
            <div className="p-6">
              <div className="mb-4 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <ShoppingBag className="w-5 h-5 text-primary" />
                  <h3 className="text-lg font-semibold">Order Items</h3>
                </div>
                <Badge
                  variant="secondary"
                  className="bg-primary/10 text-primary"
                >
                  {getTotalItems()} item{getTotalItems() !== 1 ? "s" : ""}
                </Badge>
              </div>

              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 rounded-xl border border-border/60 bg-muted/20 p-4"
                  >
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      {item.product?.images?.[0]?.url ? (
                        <div className="relative h-16 w-16 overflow-hidden rounded-lg border border-border/60 bg-muted">
                          <Image
                            src={item.product.images[0].url}
                            alt={
                              item.product.name || `Product #${item.productId}`
                            }
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
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <div>
                          <h4 className="font-medium text-foreground">
                            {item.product?.name || `Product #${item.productId}`}
                          </h4>
                          <div className="mt-1 flex items-center gap-4 text-sm text-muted-foreground">
                            <span>Qty: {item.qty}</span>
                            {item.product?.price && (
                              <span>
                                Unit: {formatCurrency(item.product.price)}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-foreground">
                            {formatCurrency(item.totalAmount)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Items Summary */}
              <div className="mt-6 rounded-xl border border-border/60 bg-muted/30 p-4">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-foreground">
                    Subtotal
                  </span>
                  <span className="font-bold text-primary">
                    {formatCurrency(getTotalAmount())}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Right Column - Payment & Actions */}
      <div className="lg:col-span-4">
        <Card className="rounded-2xl border border-border/60 bg-card/80 shadow-sm">
          <CardContent className="p-6 space-y-6">
            {/* Payment Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {getPaymentMethodIcon(order.paymentMethod)}
                <div>
                  <h3 className="font-semibold">Payment</h3>
                  <p className="text-sm text-muted-foreground">
                    {order.paymentMethod === "GATEWAY"
                      ? "Online Payment"
                      : "Manual Transfer"}
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

            {/* Total */}
            <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Grand Total
                </span>
                <span className="text-2xl font-bold text-primary">
                  {formatCurrency(order.grandTotal)}
                </span>
              </div>
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
                          Transfer to one of our accounts:
                        </p>
                      </div>

                      <div className="space-y-2">
                        <div className="rounded-lg border border-border/60 bg-card p-3">
                          <div className="flex justify-between items-center">
                            <div>
                              <p className="font-medium text-foreground">BCA</p>
                              <p className="text-sm text-muted-foreground">
                                1234567890
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
                    onClick={() =>
                      window.open(order.payment?.proofUrl, "_blank")
                    }
                  >
                    <ExternalLink className="w-4 h-4 mr-1" />
                    View
                  </Button>
                </div>
              </div>
            )}

            <Separator />

            {/* Actions */}
            <div className="space-y-4">
              {/* Payment Gateway Button */}
              {order.status === "PENDING_PAYMENT" &&
                order.paymentMethod === "GATEWAY" && (
                  <div className="space-y-3">
                    <PayNowButton
                      orderId={order.id}
                      orderTotal={Number(order.grandTotal)}
                      onPaymentSuccess={onRefresh}
                      onPaymentPending={onRefresh}
                      onPaymentError={(error) =>
                        console.error("Payment error:", error)
                      }
                    />
                    <p className="text-center text-xs text-muted-foreground">
                      Secure payment powered by Midtrans
                    </p>
                  </div>
                )}

              {/* Manual Payment Upload */}
              {order.status === "PENDING_PAYMENT" &&
                order.paymentMethod === "MANUAL_TRANSFER" && (
                  <div className="space-y-3">
                    <div className="flex items-center space-x-2 rounded-xl border border-amber-200 bg-amber-50/80 p-3 text-sm text-amber-700">
                      <AlertCircle className="w-4 h-4 flex-shrink-0" />
                      <p>Upload your payment proof to complete the order</p>
                    </div>
                    <PaymentUpload
                      orderId={order.id}
                      apiBase={apiBase}
                      onUploadSuccess={onRefresh}
                    />
                  </div>
                )}

              {/* Confirm Delivery Button */}
              {order.status === "SHIPPED" && (
                <div className="space-y-3">
                  <ConfirmButton orderId={order.id} userId={order.userId} />
                  <p className="text-xs text-muted-foreground text-center">
                    Only confirm delivery after you receive your order
                  </p>
                </div>
              )}

              {/* Cancel Order Button */}
              {order.status === "PENDING_PAYMENT" && CancelButton && (
                <div className="space-y-3">
                  <CancelButton orderId={order.id} userId={order.userId} />
                  <p className="text-center text-xs text-muted-foreground">
                    You can cancel your order before payment
                  </p>
                </div>
              )}

              {/* Secondary Actions */}
              <div className="flex flex-wrap gap-2 border-t border-border/60 pt-4">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("/support", "_blank")}
                >
                  <HelpCircle className="w-4 h-4 mr-1" />
                  Help
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => window.open("/faq", "_blank")}
                >
                  <MessageSquare className="w-4 h-4 mr-1" />
                  FAQ
                </Button>
              </div>
            </div>

            {/* Security Notice */}
            <div className="flex items-center space-x-2 rounded-xl bg-muted/40 p-3 text-xs text-muted-foreground">
              <Shield className="w-4 h-4" />
              <p>Your information is encrypted and secure</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
