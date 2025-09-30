"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCw } from "lucide-react";

import OrderOverview from "@/components/orders/OrderOverview";
import { useGetOrder, useCancelOrder } from "@/hooks/useOrder";
import { AutoPaymentPopup } from "@/components/payment";

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

  // Loading state with enhanced skeleton
  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent">
        {/* Header skeleton */}
        <div className="border-b border-border/60 bg-card/70 backdrop-blur">
          <div className="mx-auto max-w-5xl px-6 py-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-8 w-8 rounded-lg" />
                <div>
                  <Skeleton className="mb-2 h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="flex space-x-2">
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-20" />
                <Skeleton className="h-8 w-16" />
              </div>
            </div>
            <Skeleton className="h-8 w-32" />
          </div>
        </div>

        {/* Content skeleton */}
        <div className="mx-auto max-w-5xl space-y-6 px-6 py-10">
          <Skeleton className="h-20 w-full rounded-2xl" />

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
            <div className="space-y-6 lg:col-span-2">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-80 w-full rounded-2xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-96 w-full rounded-2xl" />
              <Skeleton className="h-64 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    const message = error?.message ?? "Failed to load order";
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent px-4">
        <div className="mx-auto max-w-md">
          <div className="rounded-3xl border border-border/60 bg-card/90 p-8 text-center shadow-xl backdrop-blur">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-rose-500" />
            <h2 className="mb-2 text-xl font-semibold text-rose-600">
              {message}
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              Try refreshing the page or go back to your orders.
            </p>
            <div className="flex justify-center gap-3">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="min-w-[110px]"
              >
                <RefreshCw className="mr-1 h-4 w-4" />
                Retry
              </Button>
              <Button className="min-w-[110px]" onClick={() => router.back()}>
                Back
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-transparent px-4">
        <div className="mx-auto max-w-md">
          <div className="rounded-3xl border border-border/60 bg-card/90 p-8 text-center shadow-xl backdrop-blur">
            <AlertCircle className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h2 className="mb-2 text-xl font-semibold text-foreground">
              Order not found
            </h2>
            <p className="mb-6 text-sm text-muted-foreground">
              The requested order could not be located.
            </p>
            <Button
              onClick={() => router.push("/orders")}
              className="min-w-[140px]"
            >
              Back to Orders
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Auto Payment Popup */}
      {order.status === "PENDING_PAYMENT" &&
        order.paymentMethod === "GATEWAY" && (
          <AutoPaymentPopup
            orderId={order.id}
            orderTotal={Number(order.grandTotal ?? 0)}
            onPaymentSuccess={() => refetch()}
            onPaymentPending={() => refetch()}
            onPaymentError={(error) => console.log("Payment error:", error)}
          />
        )}

      {/* Order Overview - Full Page Design */}
      <OrderOverview
        order={{
          id: order.id,
          status: order.status,
          createdAt: order.createdAt
            ? new Date(order.createdAt).toISOString()
            : undefined,
          updatedAt: order.updatedAt
            ? new Date(order.updatedAt).toISOString()
            : undefined,
          paymentMethod: order.paymentMethod || "UNKNOWN",
          grandTotal: order.grandTotal || 0,
          userId: (order as { userId?: number }).userId,
          payment: order.payment
            ? {
                status: order.payment.status || "PENDING",
                amount: order.payment.amount || 0,
                proofUrl: (order.payment as { proofUrl?: string }).proofUrl,
              }
            : undefined,
          store: order.store
            ? {
                id: order.store.id,
                name: order.store.name,
                city: order.store.locations?.[0]?.city,
                province: order.store.locations?.[0]?.province,
              }
            : undefined,
        }}
        items={order.items.map((item) => ({
          id: item.id,
          productId: item.productId,
          qty: item.qty,
          totalAmount: item.totalAmount || 0,
          product: item.product
            ? {
                id: item.product.id,
                name: item.product.name || `Product #${item.productId}`,
                price: item.product.price || 0,
                images: (item.product as { images?: string[] }).images?.map(
                  (url) => ({ url })
                ),
              }
            : undefined,
        }))}
        address={order.address || null}
        apiBase={apiBase}
        onRefresh={refetch}
        CancelButton={CancelButton}
      />
    </>
  );
}
