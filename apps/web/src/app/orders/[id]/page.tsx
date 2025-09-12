"use client";

import React from "react";
// ...existing imports
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";
import PaymentUpload from "@/components/orders/PaymentUpload";
import { useGetOrder, OrderDetail, useCancelOrder } from "@/hooks/useOrder";

function CancelButton({
  orderId,
  userId,
}: {
  orderId: number;
  userId?: number;
}) {
  const cancel = useCancelOrder();
  const [loading, setLoading] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState<string | null>(null);

  const handle = async () => {
    setErrMsg(null);
    setLoading(true);
    try {
      await cancel.mutateAsync({ orderId, userId });
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={handle} disabled={loading} variant="destructive">
        {loading ? "Cancelling..." : "Cancel Order"}
      </Button>
      {errMsg && <div className="text-sm text-red-600 mt-2">{errMsg}</div>}
    </div>
  );
}

interface OrderPageProps {
  params: { id: string };
}

export default function OrderPage({ params }: OrderPageProps) {
  // `params` may be a thenable in some Next.js contexts. If so, unwrap it with React.use()
  // small typed helper to call React.use when available without using `any`
  type ReactUse = { use?: <T>(p: Promise<T>) => T };
  const reactWithUse = React as unknown as ReactUse;

  function isThenable(p: unknown): p is Promise<unknown> {
    if (!p || (typeof p !== "object" && typeof p !== "function")) return false;
    const thenProp = (p as { then?: unknown }).then;
    return typeof thenProp === "function";
  }

  const resolvedParams =
    isThenable(params) && typeof reactWithUse.use === "function"
      ? reactWithUse.use(params as unknown as Promise<Record<string, unknown>>)
      : params;
  const id = Number((resolvedParams as { id?: string })?.id ?? NaN);
  const router = useRouter();
  const {
    data: order,
    isLoading,
    error,
    refetch,
  } = useGetOrder(Number.isNaN(id) ? undefined : id);

  // derive API base same as original server-side implementation
  const rawApi =
    process.env.NEXT_PUBLIC_API_URL ??
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`
      : undefined);

  const apiBase = rawApi
    ? (() => {
        const cleaned = rawApi.replace(/\/$/, "");
        return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;
      })()
    : "http://localhost:8000/api";

  const statusColor: Record<string, string> = {
    PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
    COMPLETED: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-red-100 text-red-800",
    EXPIRED: "bg-gray-200 text-gray-600",
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="text-center">
          <div className="text-xl font-semibold">Loading order…</div>
          <p className="text-sm text-muted-foreground">
            Please wait while we fetch your order details.
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const message = error?.message ?? "Failed to load order";
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="text-center">
          <div className="text-xl font-semibold text-red-600">{message}</div>
          <p className="text-sm text-muted-foreground">
            Try again or go back to your orders.
          </p>
          <div className="mt-4">
            <Button onClick={() => router.back()} variant="outline">
              Back
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="max-w-5xl mx-auto p-6">
        <div className="text-center">
          <div className="text-xl">Order not found</div>
          <p className="text-sm text-muted-foreground">
            The requested order could not be located.
          </p>
          <div className="mt-4">
            <Link href="/orders">
              <Button variant="outline">Back to orders</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Order #{order.id}</h1>
        <div className="flex items-center space-x-2">
          <Button variant="ghost" size="sm" onClick={() => refetch()}>
            Refresh
          </Button>
          <Link href="/orders">
            <Button variant="outline" size="sm">
              <ArrowLeft className="w-4 h-4 mr-1" />
              Back
            </Button>
          </Link>
        </div>
      </div>

      {/* Order summary */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Status</CardTitle>
            <Badge
              className={`mt-2 ${statusColor[order.status] ?? "bg-gray-200"}`}
            >
              {order.status}
            </Badge>
          </div>
          <div className="text-right">
            <CardTitle>Total</CardTitle>
            <div className="text-2xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-rose-500">
              {new Intl.NumberFormat("id-ID", {
                style: "currency",
                currency: "IDR",
                maximumFractionDigits: 0,
              }).format(Number(order.grandTotal ?? 0))}
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Shipping Information */}
      <Card>
        <CardHeader>
          <CardTitle>Shipping Information</CardTitle>
        </CardHeader>
        <CardContent>
          {order.address ? (
            <div className="grid grid-cols-2 gap-y-2 text-sm">
              <span className="text-muted-foreground">Recipient</span>
              <span className="font-medium">{order.address.recipientName}</span>

              <span className="text-muted-foreground">Address</span>
              <span className="font-medium">{order.address.addressLine}</span>

              <span className="text-muted-foreground">City</span>
              <span className="font-medium">
                {order.address.city}, {order.address.province}
              </span>

              <span className="text-muted-foreground">Postal Code</span>
              <span className="font-medium">{order.address.postalCode}</span>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              No shipping address recorded
            </p>
          )}
        </CardContent>
      </Card>

      {/* Content */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Items */}
        <Card>
          <CardHeader>
            <CardTitle>Items</CardTitle>
          </CardHeader>
          <CardContent>
            {order.items.length > 0 ? (
              <ul className="space-y-4">
                {(order.items as OrderDetail["items"]).map((it) => (
                  <li
                    key={it.id}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <div>
                      <div className="font-medium">
                        {it.product?.name
                          ? it.product.name
                          : `Product #${it.productId}`}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Quantity: {it.qty}
                      </div>
                    </div>
                    <div className="font-semibold">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        maximumFractionDigits: 0,
                      }).format(Number(it.totalAmount ?? 0))}
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">
                No items in this order
              </p>
            )}
          </CardContent>
        </Card>

        {/* Payment */}
        <Card>
          <CardHeader>
            <CardTitle>Payment</CardTitle>
          </CardHeader>
          <CardContent>
            {order.payment ? (
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span>Status</span>
                  <Badge>{order.payment.status}</Badge>
                </div>
                <Separator />
                <div className="flex justify-between">
                  <span>Amount</span>
                  <span className="font-medium">
                    {new Intl.NumberFormat("id-ID", {
                      style: "currency",
                      currency: "IDR",
                      maximumFractionDigits: 0,
                    }).format(Number(order.payment.amount ?? 0))}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No payment recorded
              </p>
            )}

            {/* If pending payment with manual transfer, show upload UI */}
            {order.status === "PENDING_PAYMENT" &&
              (order.payment?.status === undefined ||
                order.payment?.status === "PENDING") &&
              order.paymentMethod === "MANUAL_TRANSFER" && (
                <div className="mt-4 space-y-3">
                  <PaymentUpload orderId={order.id} apiBase={apiBase} />
                  <CancelButton
                    orderId={order.id}
                    userId={(order as { userId?: number }).userId}
                  />
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
