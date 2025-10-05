import React from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Package, Eye, MoreHorizontal } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import type { OrderListItem } from "@repo/schemas";

interface OrderCardProps {
  order: OrderListItem;
  index: number;
  statusConfig: Record<
    string,
    { color: string; icon: React.ReactNode; label: string }
  >;
  formatCurrency: (amount: number) => string;
  formatDate: (dateString: string) => string;
}

export default function OrderCard({
  order,
  index,
  statusConfig,
  formatCurrency,
  formatDate,
}: OrderCardProps) {
  const router = useRouter();

  const orderStatus = statusConfig[order.status] || {
    color: "bg-muted text-muted-foreground border-muted",
    icon: <Package className="h-3.5 w-3.5" />,
    label: order.status,
  };

  const totalItems =
    order.items?.reduce((sum: number, it) => sum + (it?.qty ?? 1), 0) ?? 0;

  return (
    <motion.div
      key={order.id}
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.05,
        ease: [0.25, 0.46, 0.45, 0.94],
      }}
      whileHover={{
        y: -4,
        transition: { duration: 0.2 },
      }}
      className="group relative overflow-hidden rounded-xl border border-border/50 bg-gradient-to-br from-card/90 to-card/60 backdrop-blur-sm p-3 cursor-pointer"
      onClick={(e) => {
        const target = e.target as HTMLElement | null;
        if (!target) return;
        if (target.closest("button, a, input, textarea, select")) return;
        if (target.closest(".radix-portal")) return;
        router.push(`/orders/${order.id}`);
      }}
    >
      <div className="flex items-center justify-between mb-3 pl-3 pr-3">
        <h3 className="text-base lg:text-md font-semibold text-muted-foreground leading-tight">
          ID {order.id}
        </h3>

        <div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0 rounded-md bg-muted/8 hover:bg-muted/16"
              >
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem asChild>
                <Link href={`/orders/${order.id}`} className="cursor-pointer">
                  <Eye className="mr-2 h-4 w-4" />
                  View Details
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={(e) => {
                  e.stopPropagation();
                  navigator.clipboard.writeText(String(order.id));
                  toast.success("Order ID copied to clipboard");
                }}
                className="cursor-pointer"
              >
                <Package className="mr-2 h-4 w-4" />
                Copy Order ID
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="rounded-lg border border-border/40 bg-[#FFFFF5]/60 backdrop-blur-sm p-3 group-hover:border-primary/20 transition-colors duration-300">
        <div className="flex flex-row flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex-shrink-0 rounded-lg overflow-hidden shadow-sm shadow-primary/20 group-hover:scale-105 transition-transform duration-300 relative h-20 w-20">
              {(() => {
                const firstItem = order.items?.[0];
                const firstProduct = firstItem?.product;
                let finalImageUrl = "";

                if (
                  Array.isArray(firstProduct?.images) &&
                  firstProduct.images.length > 0
                ) {
                  const firstImageObj = firstProduct.images[0];
                  if (
                    firstImageObj &&
                    typeof firstImageObj.imageUrl === "string" &&
                    firstImageObj.imageUrl.trim()
                  ) {
                    finalImageUrl = firstImageObj.imageUrl.trim();
                  }
                }

                const productName = firstProduct?.name || "Product";

                if (finalImageUrl) {
                  return (
                    <Image
                      src={finalImageUrl}
                      alt={productName}
                      fill
                      className="object-cover"
                      sizes="96px"
                      onError={() => {}}
                    />
                  );
                } else {
                  return (
                    <div className="h-full w-full p-4 bg-primary-gradient flex items-center justify-center">
                      <Package className="h-12 w-12 text-primary-foreground" />
                    </div>
                  );
                }
              })()}
            </div>

            <div className="flex-1 min-w-0">
              <div className="mb-2">
                <h4 className="text-base font-bold mb-1 group-hover:text-primary transition-colors line-clamp-1">
                  {order.items?.[0]?.product?.name || "Product Name"}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {formatDate(
                    order.createdAt
                      ? typeof order.createdAt === "string"
                        ? order.createdAt
                        : order.createdAt.toISOString()
                      : new Date().toISOString()
                  )}
                </p>
              </div>
            </div>
          </div>

          <div className="flex flex-col items-end gap-3 flex-shrink-0 min-w-[120px] sm:min-w-[140px] lg:min-w-[180px]">
            <Badge
              className={`flex items-center gap-1.5 px-3 py-1.5 border font-medium ${orderStatus.color}`}
            >
              {orderStatus.icon}
              {orderStatus.label}
            </Badge>
          </div>
        </div>
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border/40">
          <p className="text-sm font-medium text-foreground">
            {totalItems > 0
              ? `${totalItems} ${totalItems === 1 ? "item" : "items"}`
              : "0 items"}
          </p>
          <p className="text-lg font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            {formatCurrency(Number(order.grandTotal || 0))}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
