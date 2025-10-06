"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";

import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { AlertCircle, RefreshCw, XCircle } from "lucide-react";

import OrderOverview from "@/components/orders/detail/OrderOverview";
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
  const [open, setOpen] = React.useState(false);

  const handleCancel = async () => {
    setErrMsg(null);
    setLoading(true);
    try {
      await cancel.mutateAsync({ orderId, userId });
      setOpen(false);
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="destructive">
            <XCircle className="mr-2 h-4 w-4" />
            Cancel Order
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel This Order?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to cancel this order? This action cannot be
              undone. Your items will be returned to stock and any used vouchers
              will be restored.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>
              No, Keep Order
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleCancel();
              }}
              disabled={loading}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {loading ? "Cancelling..." : "Yes, Cancel Order"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
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

  // No longer need apiBase since we're using apiClient in child components
  // (commented out in case needed for other purposes in the future)
  // const rawApi =
  //   process.env.NEXT_PUBLIC_API_URL ??
  //   (process.env.VERCEL_URL
  //     ? `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`
  //     : undefined);

  // const apiBase = rawApi
  //   ? (() => {
  //       const cleaned = rawApi.replace(/\/$/, "");
  //       return cleaned.endsWith("/api") ? cleaned : `${cleaned}/api`;
  //     })()
  //   : "http://localhost:8000/api";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/10">
        <div className="border-b border-border/40 bg-card/50 backdrop-blur-sm">
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-xl" />
                <div className="space-y-2">
                  <Skeleton className="h-8 w-48" />
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-10 w-24" />
                <Skeleton className="h-10 w-10" />
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto max-w-6xl px-4 sm:px-6 py-8 space-y-6">
          <Skeleton className="h-32 w-full rounded-2xl" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <Skeleton className="h-80 w-full rounded-2xl" />
              <Skeleton className="h-96 w-full rounded-2xl" />
            </div>
            <div className="space-y-6">
              <Skeleton className="h-64 w-full rounded-2xl" />
              <Skeleton className="h-80 w-full rounded-2xl" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    const message = error?.message ?? "Failed to load order";
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/10 px-4">
        <div className="mx-auto max-w-md w-full">
          <div className="rounded-3xl border border-border/40 bg-card/95 backdrop-blur-sm p-10 text-center shadow-2xl">
            <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-rose-100/80 dark:bg-rose-900/20">
              <AlertCircle className="h-10 w-10 text-rose-600 dark:text-rose-400" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-foreground">
              Oops! Something went wrong
            </h2>
            <p className="mb-8 text-sm text-muted-foreground leading-relaxed">
              {message}. Try refreshing the page or go back to your orders.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-3">
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                className="min-w-[130px] border-border/60 hover:bg-muted/50"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
              <Button
                className="min-w-[130px] bg-primary-gradient hover:opacity-90"
                onClick={() => router.back()}
              >
                Back to Orders
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-background via-background to-muted/10 px-4">
        <div className="mx-auto max-w-md w-full">
          <div className="rounded-3xl border border-border/40 bg-card/95 backdrop-blur-sm p-10 text-center shadow-2xl">
            <div className="mb-6 inline-flex items-center justify-center w-20 h-20 rounded-full bg-muted/50">
              <AlertCircle className="h-10 w-10 text-muted-foreground" />
            </div>
            <h2 className="mb-3 text-2xl font-bold text-foreground">
              Order Not Found
            </h2>
            <p className="mb-8 text-sm text-muted-foreground leading-relaxed">
              We couldn&apos;t find the order you&apos;re looking for. It may
              have been removed or the link is incorrect.
            </p>
            <Button
              onClick={() => router.push("/orders")}
              className="min-w-[160px] bg-primary-gradient hover:opacity-90"
            >
              View All Orders
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
            onPaymentError={() => {}}
          />
        )}

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
                images: (
                  item.product as { images?: Array<{ imageUrl: string }> }
                ).images?.map((img) => ({ url: img.imageUrl })),
              }
            : undefined,
        }))}
        address={order.address || null}
        onRefresh={refetch}
        CancelButton={CancelButton}
      />
    </>
  );
}
