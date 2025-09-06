import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft } from "lucide-react";

interface OrderPageProps {
  params: { id: string };
}

type OrderType = {
  id: number;
  status: string;
  grandTotal?: number;
  items: Array<{
    id: number;
    productId: number;
    qty: number;
    totalAmount?: number;
  }>;
  payment?: { status?: string; amount?: number } | null;
  address?: {
    recipientName: string;
    addressLine: string;
    city: string;
    province: string;
    postalCode: string;
  } | null;
};

export default async function OrderPage({ params }: OrderPageProps) {
  const id = Number(params.id);

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

  const url = `${apiBase}/orders/${id}`;
  const res = await fetch(url, { cache: "no-store" });

  if (!res.ok) {
    notFound();
  }

  const data = await res.json();
  const order: OrderType | null = data?.data ?? null;

  if (!order) notFound();

  const statusColor: Record<string, string> = {
    PENDING_PAYMENT: "bg-yellow-100 text-yellow-800",
    PAID: "bg-green-100 text-green-800",
    COMPLETED: "bg-blue-100 text-blue-800",
    CANCELLED: "bg-red-100 text-red-800",
    EXPIRED: "bg-gray-200 text-gray-600",
  };

  return (
    <div className="max-w-5xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Order #{order.id}</h1>
        <Link href="/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 mr-1" />
            Back
          </Button>
        </Link>
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
              Rp {order.grandTotal?.toLocaleString()}
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
                {order.items.map((it) => (
                  <li
                    key={it.id}
                    className="flex justify-between items-center border-b pb-2"
                  >
                    <div>
                      <div className="font-medium">Product #{it.productId}</div>
                      <div className="text-sm text-muted-foreground">
                        Qty: {it.qty}
                      </div>
                    </div>
                    <div className="font-semibold">
                      Rp {it.totalAmount?.toLocaleString()}
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
                    Rp {order.payment.amount?.toLocaleString()}
                  </span>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">
                No payment recorded
              </p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
