"use client";

import React, { useState } from "react";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  Upload,
  FileImage,
  CheckCircle,
  AlertCircle,
  X,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import type { OrderDetail } from "@/hooks/useOrder";

interface PaymentUploadProps {
  orderId: number;
  apiBase: string;
  onUploadSuccess?: () => void;
}

export default function PaymentUpload({
  orderId,
  apiBase,
  onUploadSuccess,
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
