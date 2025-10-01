"use client";

import React, { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  Copy,
  Package,
  AlertCircle,
  ArrowLeft,
  RefreshCw,
  Share2,
  Calendar,
  Receipt,
  Clock,
  MoreHorizontal,
  Timer,
  X,
  Upload,
  FileImage,
  CheckCircle,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { PayNowButton } from "@/components/payment";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useQueryClient } from "@tanstack/react-query";
import { useConfirmOrder } from "@/hooks/useOrder";
import type { OrderDetail } from "@/hooks/useOrder";

// ===== INTERNAL COMPONENTS =====

// ConfirmButton Component
function ConfirmButton({
  orderId,
  userId,
}: {
  orderId: number;
  userId?: number;
}) {
  const confirm = useConfirmOrder();
  const [loading, setLoading] = React.useState(false);
  const [errMsg, setErrMsg] = React.useState<string | null>(null);

  const handle = async () => {
    setErrMsg(null);
    setLoading(true);
    try {
      await confirm.mutateAsync({ orderId, userId });
    } catch (e) {
      setErrMsg(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <Button onClick={handle} disabled={loading}>
        {loading ? "Confirming..." : "Confirm Receipt"}
      </Button>
      {errMsg && <div className="text-sm text-red-600 mt-2">{errMsg}</div>}
    </div>
  );
}

// PaymentUpload Component
interface PaymentUploadProps {
  orderId: number;
  apiBase: string;
  onUploadSuccess?: () => void;
  cancelButton?: React.ReactNode;
}

function PaymentUpload({
  orderId,
  apiBase,
  onUploadSuccess,
  cancelButton,
}: PaymentUploadProps) {
  const qc = useQueryClient();
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<
    "idle" | "uploading" | "success" | "error"
  >("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const maxFileSize = 5 * 1024 * 1024; // 5MB
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

  const validateFile = (file: File): string | null => {
    if (!allowedTypes.includes(file.type)) {
      return "Please upload a valid image file (JPG, PNG, WebP)";
    }
    if (file.size > maxFileSize) {
      return "File size must be less than 5MB";
    }
    return null;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const validationError = validateFile(selectedFile);
    if (validationError) {
      setErrorMessage(validationError);
      setUploadStatus("error");
      return;
    }

    setFile(selectedFile);
    setErrorMessage(null);
    setUploadStatus("idle");

    // Create preview URL
    const url = URL.createObjectURL(selectedFile);
    setPreviewUrl(url);
  };

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage("Please select a payment proof image");
      setUploadStatus("error");
      return;
    }

    setLoading(true);
    setUploadStatus("uploading");
    setUploadProgress(0);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("proof", file);

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch(
        `${apiBase}/orders/${orderId}/payment-proof`,
        {
          method: "POST",
          body: formData,
        }
      );

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Upload failed: ${response.status} ${errorText}`);
      }

      const result = await response.json();
      const payload = result?.data ?? result;

      setUploadStatus("success");
      toast.success("Payment proof uploaded successfully!");

      // Update cached order data
      try {
        const returnedOrder = payload.order ?? payload;
        if (returnedOrder && typeof returnedOrder === "object") {
          qc.setQueryData<OrderDetail | undefined>(
            ["order", orderId],
            (prev) =>
              ({
                ...(prev ?? {}),
                ...returnedOrder,
                status:
                  returnedOrder.orderStatus ||
                  returnedOrder.status ||
                  prev?.status,
              } as OrderDetail)
          );
        } else {
          qc.invalidateQueries({ queryKey: ["order", orderId] });
        }
      } catch {
        qc.invalidateQueries({ queryKey: ["order", orderId] });
      }

      // Reset form after successful upload
      setTimeout(() => {
        handleClear();
        onUploadSuccess?.();
      }, 2000);
    } catch (error) {
      setUploadStatus("error");
      const message = error instanceof Error ? error.message : "Upload failed";
      setErrorMessage(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreviewUrl(null);
    setUploadProgress(0);
    setUploadStatus("idle");
    setErrorMessage(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  return (
    <Card className="w-full rounded-2xl border border-border/60 bg-card/80 shadow-sm">
      <CardContent className="p-6">
        <div className="space-y-6">
          {/* Header */}
          <div className="text-center">
            <h3 className="mb-2 text-lg font-semibold text-foreground">
              Upload Payment Proof
            </h3>
            <p className="text-sm text-muted-foreground">
              Upload a clear image of your payment receipt or transfer
              confirmation
            </p>
          </div>

          {/* File Upload Area */}
          <div className="space-y-4">
            {!file ? (
              <label className="flex h-32 w-full cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border/60 bg-muted/40 transition-colors hover:bg-muted/60">
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <Upload className="mb-4 h-8 w-8 text-muted-foreground" />
                  <p className="mb-2 text-sm text-muted-foreground">
                    <span className="font-semibold">Click to upload</span> or
                    drag and drop
                  </p>
                  <p className="text-xs text-muted-foreground">
                    PNG, JPG, WebP (MAX. 5MB)
                  </p>
                </div>
                <input
                  type="file"
                  className="hidden"
                  accept="image/*"
                  onChange={handleFileSelect}
                />
              </label>
            ) : (
              <div className="space-y-4">
                {/* File Preview */}
                <div className="flex items-center space-x-4 rounded-xl border border-border/60 bg-muted/30 p-4">
                  <div className="flex-shrink-0">
                    {previewUrl ? (
                      <div className="relative">
                        <Image
                          src={previewUrl}
                          alt="Payment proof preview"
                          width={64}
                          height={64}
                          className="h-16 w-16 rounded-lg object-cover"
                        />
                        <Button
                          size="sm"
                          variant="outline"
                          className="absolute -right-2 -top-2 h-6 w-6 p-0"
                          onClick={() => window.open(previewUrl, "_blank")}
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border/60 bg-muted/40">
                        <FileImage className="h-8 w-8 text-muted-foreground/60" />
                      </div>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">
                      {file.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(file.size)}
                    </p>
                  </div>

                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleClear}
                    disabled={loading}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                {/* Upload Progress */}
                {uploadStatus === "uploading" && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm text-muted-foreground">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <Progress value={uploadProgress} className="w-full" />
                  </div>
                )}

                {/* Success Message */}
                {uploadStatus === "success" && (
                  <div className="flex items-center space-x-2 rounded-xl border border-emerald-200 bg-emerald-50/80 p-3 text-emerald-700">
                    <CheckCircle className="h-5 w-5" />
                    <span className="text-sm font-medium text-emerald-900">
                      Payment proof uploaded successfully! Awaiting
                      verification.
                    </span>
                  </div>
                )}

                {/* Error Message */}
                {uploadStatus === "error" && errorMessage && (
                  <div className="flex items-center space-x-2 rounded-xl border border-rose-200 bg-rose-50/80 p-3 text-rose-700">
                    <AlertCircle className="h-5 w-5" />
                    <span className="text-sm font-medium">{errorMessage}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {file && uploadStatus !== "success" && (
              <Button
                onClick={handleUpload}
                disabled={loading || uploadStatus === "uploading"}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Upload className="mr-2 h-4 w-4 animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Upload Payment Proof
                  </>
                )}
              </Button>
            )}

            {file && (
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={loading}
              >
                Clear
              </Button>
            )}

            {!file && (
              <>
                <label className="flex-1">
                  <Button className="w-full" asChild>
                    <span>
                      <FileImage className="mr-2 h-4 w-4" />
                      Select Image
                    </span>
                  </Button>
                  <input
                    type="file"
                    className="hidden"
                    accept="image/*"
                    onChange={handleFileSelect}
                  />
                </label>
                {cancelButton && cancelButton}
              </>
            )}
          </div>

          {/* Guidelines */}
          <div className="space-y-1 border-t border-border/60 pt-4 text-xs text-muted-foreground">
            <p className="font-medium">Upload Guidelines:</p>
            <ul className="space-y-1 ml-4">
              <li>• Ensure the image is clear and readable</li>
              <li>• Include transaction details and amount</li>
              <li>• File size should be less than 5MB</li>
              <li>• Supported formats: JPG, PNG, WebP</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===== MAIN COMPONENT =====

// Types
type OrderOverviewProps = {
  order: {
    id: number;
    status: string;
    paymentMethod: string;
    grandTotal: string | number;
    userId?: number;
    createdAt?: string;
    updatedAt?: string;
    shippedAt?: string;
    confirmedAt?: string;
    payment?: {
      status: string;
      amount: string | number;
      proofUrl?: string;
    };
    store?: {
      id: number;
      name: string;
      city?: string;
      province?: string;
    };
  };
  items: Array<{
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
  }>;
  address: {
    recipientName: string;
    addressLine: string;
    city: string;
    province: string;
    postalCode: string;
    phoneNumber?: string;
  } | null;
  apiBase: string;
  onRefresh: () => void;
  isLoading?: boolean;
  CancelButton?: React.ComponentType<{ orderId: number; userId?: number }>;
};

export default function OrderOverview({
  order,
  items,
  address,
  apiBase,
  onRefresh,
  isLoading = false,
  CancelButton,
}: OrderOverviewProps) {
  // Payment countdown timer
  const [countdown, setCountdown] = useState<string | null>(null);
  useEffect(() => {
    if (order.status !== "PENDING_PAYMENT" || !order.createdAt)
      return setCountdown(null);
    const start = new Date(order.createdAt).getTime();
    const due = start + 60 * 60 * 1000;
    const update = () => {
      const diff = due - Date.now();
      if (diff <= 0) return setCountdown("Expired");
      const h = Math.floor(diff / 3600000),
        m = Math.floor((diff % 3600000) / 60000),
        s = Math.floor((diff % 60000) / 1000);
      setCountdown(
        `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s
          .toString()
          .padStart(2, "0")}`
      );
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, [order.status, order.createdAt]);

  // Helpers
  const formatCurrency = (amount: string | number) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(Number(amount));
  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied!`);
  };
  const getTotalItems = () =>
    items.reduce((total, item) => total + item.qty, 0);
  const getStatusColor = (status: string) => {
    switch (status) {
      case "COMPLETED":
      case "CONFIRMED":
        return "bg-emerald-100/80 text-emerald-700 border-emerald-200";
      case "PAID":
      case "PROCESSING":
        return "bg-primary/10 text-primary border-primary/20";
      case "SHIPPED":
        return "bg-indigo-100/80 text-indigo-700 border-indigo-200";
      case "PENDING_PAYMENT":
        return "bg-amber-100/80 text-amber-700 border-amber-200";
      case "CANCELLED":
      case "EXPIRED":
        return "bg-rose-100/80 text-rose-700 border-rose-200";
      default:
        return "bg-muted text-muted-foreground border-border/60";
    }
  };
  const getStatusIcon = (status: string) =>
    status === "PENDING_PAYMENT" ? <Clock className="w-4 h-4" /> : null;
  const formatDateShort = (dateString?: string) =>
    dateString
      ? new Intl.DateTimeFormat("en-GB", {
          day: "numeric",
          month: "long",
          year: "numeric",
        }).format(new Date(dateString))
      : null;
  const handleShare = async () => {
    try {
      if (navigator.share)
        await navigator.share({
          title: `Order #${order.id}`,
          text: `Check out my order #${order.id}`,
          url: window.location.href,
        });
      else {
        await navigator.clipboard.writeText(window.location.href);
        toast.success("Order link copied!");
      }
    } catch {
      toast.error("Failed to share order");
    }
  };
  const handleDownloadReceipt = () =>
    toast.info("Receipt download coming soon!");
  const getStatusHeadline = () => {
    const s = order.status.toUpperCase(),
      pm = (order.paymentMethod || "").toUpperCase();
    if (s === "PENDING_PAYMENT")
      return pm === "MANUAL_TRANSFER"
        ? "Please upload your payment proof to complete the order"
        : "Please complete your payment to proceed";
    if (s === "PAYMENT_REVIEW") return "Your payment is under review";
    if (s === "PAID" || s === "PROCESSING")
      return "Your order is being prepared";
    if (s === "SHIPPED") return "Be patient, package on deliver!";
    if (s === "COMPLETED" || s === "CONFIRMED")
      return "Order confirmed — package delivered";
    if (s === "CANCELLED" || s === "EXPIRED") return "Order cancelled";
    return "Order status";
  };

  return (
    <div className="min-h-screen" style={{ background: "var(--background)" }}>
      <div className="max-w-6xl mx-auto space-y-4 p-2 sm:p-4">
        {/* Header */}
        <div className="bg-card/80 rounded-2xl p-4 sm:p-6 lg:p-8 shadow-sm border border-border/60 mb-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-3 sm:gap-4 w-full sm:w-auto">
              <Link href="/orders">
                <Button variant="ghost" size="sm" className="p-2">
                  <ArrowLeft className="w-4 h-4" />
                </Button>
              </Link>
              <div className="flex-1 sm:flex-none flex flex-wrap items-center gap-2">
                <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                  Order #{order.id}
                </h1>
                <Button
                  aria-label="Copy Order ID"
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => copyToClipboard(String(order.id), "Order ID")}
                >
                  <Copy className="h-4 w-4" />
                </Button>
                <Badge
                  className={`px-2.5 py-1 font-medium border ${getStatusColor(
                    order.status
                  )}`}
                >
                  {getStatusIcon(order.status)}
                  <span className="text-xs sm:text-[0.8rem]">
                    {order.status.replace("_", " ")}
                  </span>
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                disabled={isLoading}
                className="bg-card border border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary/90 transition-colors text-xs sm:text-sm px-2 sm:px-3"
              >
                <RefreshCw
                  className={`w-3 h-3 sm:w-4 sm:h-4 mr-1 ${
                    isLoading ? "animate-spin" : ""
                  }`}
                />
                <span className="hidden sm:inline">Refresh</span>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="icon"
                    aria-label="More actions"
                    className="bg-card border border-primary text-primary hover:bg-primary hover:text-primary-foreground hover:border-primary/90 transition-colors"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleDownloadReceipt}>
                    <Receipt className="mr-2 h-4 w-4" />
                    Download receipt
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleShare}>
                    <Share2 className="mr-2 h-4 w-4" />
                    Share link
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() =>
                      copyToClipboard(String(order.id), "Order ID")
                    }
                  >
                    Copy Order ID
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Payment Countdown Banner */}
          {order.status === "PENDING_PAYMENT" && countdown && (
            <div className="bg-destructive/10 border border-destructive/20 rounded-xl p-4 mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-2 text-destructive">
                <Timer className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Complete your payment
                </span>
              </div>
              <div className="text-base font-semibold text-destructive tracking-wide">
                {countdown}
              </div>
            </div>
          )}

          <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 mb-6">
            {/* Main content */}
            <div className="flex-1 bg-muted/50 rounded-xl p-4 sm:p-6 border border-border/30">
              <div className="flex items-center gap-3 sm:gap-4 mb-6">
                <div className="w-10 h-10 bg-card rounded-lg flex items-center justify-center border border-border/60 shadow-sm">
                  <Package className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-lg font-medium text-foreground">
                  {getStatusHeadline()}
                </h2>
              </div>
              {/* Chips + dashed route + progress bar */}
              <div>
                <div className="flex flex-col sm:flex-row items-center gap-3 mb-4">
                  <div className="px-3 py-2 bg-card rounded-2xl flex items-center justify-center border border-border/60 shadow-sm gap-2 w-full sm:w-auto sm:justify-start">
                    <div className="p-1 bg-primary/10 rounded-full">
                      <Package className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-foreground">
                      {order.store?.name || "Store"},{" "}
                      {order.store?.city || "City"}
                    </span>
                  </div>
                  <div className="hidden sm:flex flex-1 items-center justify-center px-3">
                    <div className="flex items-center gap-2">
                      {["CANCELLED", "EXPIRED"].includes(order.status) ? (
                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-rose-100/80 text-rose-700 border border-rose-200">
                          <X className="w-4 h-4" />
                        </div>
                      ) : (
                        Array.from({ length: 6 }).map((_, i) => (
                          <span
                            key={i}
                            className="w-1.5 h-1.5 bg-gradient-to-r from-primary to-primary/60 rounded-full animate-pulse"
                            style={{ animationDelay: `${i * 0.1}s` }}
                          ></span>
                        ))
                      )}
                    </div>
                  </div>
                  <div className="px-3 py-2 bg-card rounded-2xl flex items-center justify-center border border-border/60 shadow-sm gap-2 w-full sm:w-auto sm:justify-start">
                    <div className="p-1 bg-primary/10 rounded-full">
                      <MapPin className="w-3.5 h-3.5 text-primary" />
                    </div>
                    <span className="text-xs sm:text-sm font-medium text-foreground">
                      {address?.city || "Delivery City"},{" "}
                      {address?.province || "Province"}
                    </span>
                  </div>
                </div>
                {/* Progress Bar */}
                <div className="mt-4">
                  {(() => {
                    const steps = [
                      "PENDING_PAYMENT",
                      "PAYMENT_REVIEW",
                      "PAID",
                      "PROCESSING",
                      "SHIPPED",
                      "CONFIRMED",
                    ];
                    const currentStepIndex = steps.indexOf(order.status);
                    const progressPercentage =
                      currentStepIndex >= 0
                        ? ((currentStepIndex + 1) / steps.length) * 100
                        : 0;
                    if (["CANCELLED", "EXPIRED"].includes(order.status))
                      return (
                        <div className="flex items-center justify-center py-3 bg-destructive/10 rounded-lg border border-destructive/20">
                          <span className="text-xs sm:text-sm text-destructive font-semibold">
                            Order {order.status.toLowerCase()}
                          </span>
                        </div>
                      );
                    return (
                      <>
                        <div className="h-3 bg-gradient-to-r from-muted via-muted to-muted/80 rounded-full overflow-hidden mb-4 shadow-inner">
                          <div
                            className="h-3 bg-gradient-to-r from-primary via-primary to-primary/80 rounded-full transition-all duration-700 ease-out shadow-lg"
                            style={{ width: `${progressPercentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between items-center">
                          {steps.map((step, i) => {
                            const isCompleted = i < currentStepIndex,
                              isCurrent = i === currentStepIndex;
                            return (
                              <div
                                key={step}
                                className="flex flex-col items-center gap-1.5"
                              >
                                <div
                                  className={`w-4 h-4 rounded-full border-2 transition-all duration-300 ${
                                    isCompleted || isCurrent
                                      ? "bg-gradient-to-br from-primary to-primary/80 border-primary scale-110"
                                      : "bg-muted border-border/60"
                                  }`}
                                />
                                <span
                                  className={`text-[0.65rem] sm:text-xs font-medium ${
                                    isCompleted || isCurrent
                                      ? "text-primary font-semibold"
                                      : "text-muted-foreground"
                                  }`}
                                >
                                  {step.replace("_", " ").split(" ")[0]}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    );
                  })()}
                </div>
              </div>
            </div>
            {/* Status cards */}
            <div className="flex gap-3 sm:gap-4 lg:gap-6">
              {/* Order Created Card */}
              <div className="bg-muted/30 rounded-2xl p-3 sm:p-4 lg:p-6 min-w-[120px] lg:min-w-[140px] border border-border/30 flex-1 lg:flex-none">
                <div className="flex items-start justify-start mb-20">
                  <div className="w-10 h-10 bg-card rounded-2xl flex items-center justify-center border border-border/60 shadow-sm">
                    <Calendar className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Order created
                  </p>
                  <p className="font-semibold text-foreground">
                    {order.createdAt ? formatDateShort(order.createdAt) : "-"}
                  </p>
                </div>
              </div>
              {/* Estimated Arrival Card */}
              <div className="bg-muted/30 rounded-2xl p-3 sm:p-4 lg:p-6 min-w-[120px] lg:min-w-[140px] border border-border/30 flex-1 lg:flex-none">
                <div className="flex items-start justify-start mb-20">
                  <div className="w-10 h-10 bg-card rounded-2xl flex items-center justify-center border border-border/60 shadow-sm">
                    <Package className="w-5 h-5 text-primary" />
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-sm text-muted-foreground mb-1">
                    Estimated Arrival
                  </p>
                  <p className="font-semibold text-foreground">
                    {order.createdAt
                      ? formatDateShort(
                          new Date(
                            new Date(order.createdAt).getTime() +
                              7 * 24 * 60 * 60 * 1000
                          ).toISOString()
                        )
                      : "Calculating..."}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress Bar */}

          {/* Two Column Layout */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
            {/* Timeline Column (card) */}
            <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/60 p-4 shadow-sm">
              <h4 className="text-sm font-medium text-foreground mb-4">
                Timeline
              </h4>
              <div className="space-y-4">
                {order.status === "SHIPPED" ||
                order.status === "CONFIRMED" ||
                order.status === "COMPLETED" ? (
                  <div className="flex gap-3">
                    <div className="text-sm">
                      <p className="font-medium text-foreground">
                        {order.shippedAt
                          ? formatDateShort(order.shippedAt)
                          : order.updatedAt
                          ? formatDateShort(order.updatedAt)
                          : formatDateShort(new Date().toISOString())}
                        {order.status === "SHIPPED" && !order.confirmedAt
                          ? " (Now)"
                          : ""}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.shippedAt
                          ? new Date(order.shippedAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour12: false,
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : order.updatedAt
                          ? new Date(order.updatedAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour12: false,
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : new Date().toLocaleTimeString("en-US", {
                              hour12: false,
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {order.status === "COMPLETED" ||
                        order.status === "CONFIRMED"
                          ? "Package delivered"
                          : "Package is on delivery"}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {address?.addressLine}, {address?.city},{" "}
                        {address?.province}
                      </p>
                    </div>
                  </div>
                ) : null}

                {order.status === "PROCESSING" ||
                order.status === "SHIPPED" ||
                order.status === "CONFIRMED" ||
                order.status === "COMPLETED" ? (
                  <div className="flex gap-3">
                    <div className="text-sm">
                      <p className="font-medium text-foreground">
                        {order.updatedAt && order.status !== "PROCESSING"
                          ? formatDateShort(order.updatedAt)
                          : order.createdAt
                          ? formatDateShort(
                              new Date(
                                new Date(order.createdAt).getTime() +
                                  ((order.id % 5) + 2) * 60 * 60 * 1000
                              ).toISOString()
                            )
                          : "Processing"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.updatedAt && order.status !== "PROCESSING"
                          ? new Date(order.updatedAt).toLocaleTimeString(
                              "en-US",
                              {
                                hour12: false,
                                hour: "2-digit",
                                minute: "2-digit",
                              }
                            )
                          : order.createdAt
                          ? new Date(
                              new Date(order.createdAt).getTime() +
                                ((order.id % 5) + 2) * 60 * 60 * 1000
                            ).toLocaleTimeString("en-US", {
                              hour12: false,
                              hour: "2-digit",
                              minute: "2-digit",
                            })
                          : "06:00"}
                      </p>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground">
                        Order is being prepared
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {order.store?.name || "Online Store"},{" "}
                        {order.store?.city || "Store City"}
                      </p>
                    </div>
                  </div>
                ) : null}

                <div className="flex gap-3">
                  <div className="text-sm">
                    <p className="font-medium text-foreground">
                      {order.createdAt
                        ? formatDateShort(order.createdAt)
                        : "Order Date"}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleTimeString(
                            "en-US",
                            {
                              hour12: false,
                              hour: "2-digit",
                              minute: "2-digit",
                            }
                          )
                        : "00:00"}
                    </p>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">
                      Order placed
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <div className="w-6 h-6 bg-primary rounded-sm flex items-center justify-center">
                        <span className="text-primary-foreground text-xs font-bold">
                          ✓
                        </span>
                      </div>
                      <span className="text-xs font-medium text-foreground">
                        Online Store
                      </span>
                      <div className="w-3 h-3 bg-primary rounded-full"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Shipment Info Column (card) */}
            <div className="bg-card/80 backdrop-blur-sm rounded-xl border border-border/60 p-4 shadow-sm">
              <h4 className="text-sm font-medium text-foreground mb-4">
                Shipment
              </h4>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center border border-primary/20">
                    <div className="w-4 h-4 bg-primary rounded-sm flex items-center justify-center">
                      <span className="text-primary-foreground text-xs">S</span>
                    </div>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">
                      {order.store?.name || "Store"} Delivery
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {order.store?.name || "Online Store"},{" "}
                      {order.store?.city || "Store City"},{" "}
                      {order.store?.province || "Store Province"}
                    </p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Recipient
                  </p>
                  <p className="text-sm text-foreground font-medium">
                    {address?.recipientName || "Customer"}
                  </p>
                  {address?.phoneNumber && (
                    <p className="text-sm text-muted-foreground">
                      {address.phoneNumber}
                    </p>
                  )}
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Delivery address
                  </p>
                  <p className="text-sm text-foreground font-medium">
                    {address
                      ? `${address.addressLine}, ${address.city}, ${address.province} ${address.postalCode}`
                      : "Delivery address not available"}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Tracking No.
                  </p>
                  <div className="flex items-center">
                    <div className="flex items-center justify-between w-full max-w-sm rounded-xl border border-border/60 bg-card/90 px-4 py-2">
                      <p className="text-sm font-mono text-foreground truncate">
                        TRK{order.id.toString().padStart(8, "0")}
                      </p>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-0 hover:bg-muted"
                        onClick={() =>
                          copyToClipboard(
                            `TRK${order.id.toString().padStart(8, "0")}`,
                            "Tracking number"
                          )
                        }
                        aria-label="Copy tracking number"
                      >
                        <Copy className="w-3 h-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Items Section */}
        <div className="bg-card/80 rounded-xl p-6 shadow-sm border border-border/60">
          <h3 className="text-lg font-semibold text-foreground mb-6">
            Items{" "}
            <span className="font-normal text-muted-foreground">
              {getTotalItems()}
            </span>
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
            {items.map((item) => (
              <div
                key={item.id}
                className="bg-muted/30 rounded-xl p-4 border border-border/30"
              >
                <div className="flex gap-3 sm:gap-4">
                  <div className="flex-shrink-0">
                    {item.product?.images?.[0]?.url ? (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-card rounded-lg overflow-hidden border border-border/60 shadow-sm">
                        <Image
                          src={item.product.images[0].url}
                          alt={
                            item.product.name || `Product #${item.productId}`
                          }
                          width={80}
                          height={80}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-card rounded-lg flex items-center justify-center border border-border/60 shadow-sm">
                        <Package className="w-10 h-10 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-foreground text-sm mb-2 line-clamp-2">
                      {item.product?.name || `Product #${item.productId}`}
                    </h4>
                    <p className="text-sm font-semibold text-foreground mb-1">
                      {formatCurrency(item.product?.price || 0)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Quantity: {item.qty}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Order Summary */}
        <div className="bg-card/80 rounded-xl p-6 shadow-sm border border-border/60">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Order Summary
            </h3>
            <Badge
              className={`px-3 py-1 ${
                order.payment?.status === "PAID" ||
                [
                  "PAID",
                  "PROCESSING",
                  "SHIPPED",
                  "CONFIRMED",
                  "COMPLETED",
                ].includes(order.status)
                  ? "bg-emerald-100/80 text-emerald-700 border-emerald-200"
                  : order.payment?.status === "REJECTED"
                  ? "bg-red-100/80 text-red-700 border-red-200"
                  : order.status === "PENDING_PAYMENT"
                  ? "bg-amber-100/80 text-amber-700 border-amber-200"
                  : "bg-muted text-muted-foreground border-border/60"
              }`}
            >
              {order.payment?.status === "PAID" ||
              [
                "PAID",
                "PROCESSING",
                "SHIPPED",
                "CONFIRMED",
                "COMPLETED",
              ].includes(order.status)
                ? "Payment Success"
                : order.payment?.status === "REJECTED"
                ? "Payment Rejected"
                : order.status === "PENDING_PAYMENT"
                ? "Payment Pending"
                : "Payment Review"}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Here&apos;s your summary for the product you bought.
          </p>
          <div className="space-y-3 mb-6">
            {items.map((item) => (
              <div key={item.id} className="flex justify-between text-sm">
                <span className="text-foreground font-medium">
                  {item.product?.name || `Product #${item.productId}`}
                </span>
                <span className="text-foreground font-medium">
                  {formatCurrency(item.totalAmount)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-border pt-4 mb-6">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold text-foreground">
                Total
              </span>
              <span className="text-lg font-bold text-primary">
                {formatCurrency(order.grandTotal)}
              </span>
            </div>
          </div>
          {/* Payment Actions */}
          {order.status === "PENDING_PAYMENT" &&
            order.paymentMethod === "GATEWAY" && (
              <div className="flex gap-3">
                <PayNowButton
                  orderId={order.id}
                  orderTotal={Number(order.grandTotal)}
                  onPaymentSuccess={onRefresh}
                  onPaymentPending={onRefresh}
                  onPaymentError={() => {}}
                  className="flex-1 bg-primary-gradient hover:opacity-95"
                />
                {CancelButton ? (
                  <CancelButton orderId={order.id} userId={order.userId} />
                ) : (
                  <Button
                    variant="destructive"
                    className="px-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                    disabled={order.status !== "PENDING_PAYMENT"}
                  >
                    Cancel Order
                  </Button>
                )}
              </div>
            )}
          {order.status === "PENDING_PAYMENT" &&
            order.paymentMethod === "MANUAL_TRANSFER" && (
              <div className="space-y-3 mt-4">
                {order.payment?.status === "REJECTED" ? (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-sm font-medium">
                      Your payment proof was rejected. Please upload a new
                      payment proof.
                    </p>
                  </div>
                ) : (
                  <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg flex items-center gap-2 text-destructive">
                    <AlertCircle className="w-4 h-4" />
                    <p className="text-sm">Upload payment proof to proceed</p>
                  </div>
                )}
                <PaymentUpload
                  orderId={order.id}
                  apiBase={apiBase}
                  onUploadSuccess={onRefresh}
                  cancelButton={
                    CancelButton ? (
                      <CancelButton orderId={order.id} userId={order.userId} />
                    ) : (
                      <Button
                        variant="destructive"
                        className="px-8 bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                        disabled={order.status !== "PENDING_PAYMENT"}
                      >
                        Cancel Order
                      </Button>
                    )
                  }
                />
              </div>
            )}
          {order.status === "SHIPPED" && (
            <ConfirmButton orderId={order.id} userId={order.userId} />
          )}
        </div>
      </div>
    </div>
  );
}
