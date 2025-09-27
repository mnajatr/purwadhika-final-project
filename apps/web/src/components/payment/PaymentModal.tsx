"use client";

import React, { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Spinner } from "@/components/ui/spinner";
import { toast } from "sonner";
import { useCreateSnapToken, type MidtransResult } from "@/hooks/usePayment";
import { CreditCard, AlertCircle, CheckCircle, Clock } from "lucide-react";

// Expose a typed global flag to prevent duplicate Snap opens
declare global {
  interface Window {
    __midtransSnapInProgress?: boolean;
  }
}

// Custom Dialog components since @/components/ui/dialog might not exist
const Dialog = ({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative bg-background border rounded-lg shadow-lg max-w-md w-full mx-4">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={className}>{children}</div>;

const DialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="p-6 pb-4">{children}</div>
);

const DialogTitle = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h2 className={`text-lg font-semibold ${className || ""}`}>{children}</h2>
);

const DialogDescription = ({ children }: { children: React.ReactNode }) => (
  <p className="text-sm text-muted-foreground mt-1">{children}</p>
);

export interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId: number;
  orderTotal: number;
  onPaymentSuccess?: () => void;
  onPaymentPending?: () => void;
  onPaymentError?: (error: string) => void;
}

export function PaymentModal({
  isOpen,
  onClose,
  orderId,
  orderTotal,
  onPaymentSuccess,
  onPaymentPending,
  onPaymentError,
}: PaymentModalProps) {
  const createSnapToken = useCreateSnapToken();
  const [snapLoaded, setSnapLoaded] = React.useState(false);
  const [paymentAttempted, setPaymentAttempted] = React.useState(false);

  // Load Midtrans Snap script
  useEffect(() => {
    if (!isOpen) return;

    // Check if script is already loaded
    if (window.snap) {
      setSnapLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.src = "https://app.sandbox.midtrans.com/snap/snap.js";

    // Get client key from API response instead of env variable
    script.onload = () => setSnapLoaded(true);
    script.onerror = () => {
      toast.error("Failed to load payment gateway");
      setSnapLoaded(false);
    };

    document.head.appendChild(script);

    return () => {
      // Don't remove script to avoid re-loading on subsequent opens
    };
  }, [isOpen]);

  const handlePayment = React.useCallback(async () => {
    try {
      if (!window.snap) {
        throw new Error("Payment gateway not loaded");
      }

      // Prevent duplicate snap.pay calls (Midtrans throws if called when popup already present)
      if (window.__midtransSnapInProgress) {
        console.warn("snap.pay call skipped: snap already in progress");
        return;
      }

      // mark that a snap.pay attempt is starting so concurrent calls are blocked
      window.__midtransSnapInProgress = true;

      // Create token after claiming the in-progress flag; if token creation fails, reset flag
      const snapData = await (async () => {
        try {
          return await createSnapToken.mutateAsync(orderId);
        } catch (e) {
          window.__midtransSnapInProgress = false;
          throw e;
        }
      })();

      if (!snapData.snapToken) {
        window.__midtransSnapInProgress = false;
        throw new Error("Failed to create payment token");
      }

      // Set client key dynamically from API response
      if (snapData.clientKey && typeof window !== "undefined") {
        const script = document.querySelector('script[src*="snap.js"]');
        if (script) {
          script.setAttribute("data-client-key", snapData.clientKey);
        }
      }

      try {
        // Open Midtrans Snap without redirect
        try {
          window.snap.pay(snapData.snapToken, {
          onSuccess: (result: MidtransResult) => {
            try {
              toast.success(
                "Payment successful! Your order is being processed."
              );
              console.log("Payment success:", result);
              // Don't close modal immediately, let parent component handle
              onPaymentSuccess?.();
              // Close modal after a short delay to show success message
              setTimeout(() => onClose(), 2000);
            } finally {
              window.__midtransSnapInProgress = false;
            }
          },
          onPending: (result: MidtransResult) => {
            try {
              toast.info(
                "Payment is being processed. Please check your order status."
              );
              console.log("Payment pending:", result);
              onPaymentPending?.();
              // Close modal after a short delay
              setTimeout(() => onClose(), 2000);
            } finally {
              window.__midtransSnapInProgress = false;
            }
          },
          onError: (result: MidtransResult) => {
            const errorMsg = result.status_message || "Payment failed";
            try {
              toast.error(`Payment failed: ${errorMsg}`);
              console.error("Payment error:", result);
              onPaymentError?.(errorMsg);
              // Don't close modal on error, let user try again
            } finally {
              window.__midtransSnapInProgress = false;
            }
          },
          onClose: () => {
            try {
              // User closed payment popup manually
              console.log("Payment popup closed by user");
              toast.info("Payment window closed. You can try again if needed.");
            } finally {
              window.__midtransSnapInProgress = false;
              // Close the modal when user closes Snap popup
              onClose();
            }
          },
          });
        } catch (e: unknown) {
          // Midtrans may throw when snap.pay is invoked while popup already open
          const msg = e instanceof Error ? e.message : String(e || "");
          if (
            msg.includes("Invalid state transition") ||
            msg.includes("snap.pay is not allowed") ||
            msg.includes("PopupInView")
          ) {
            console.warn("snap.pay skipped due to invalid state:", msg);
            // inform user softly and recover
            toast.info("Payment popup is already open");
            window.__midtransSnapInProgress = false;
            return;
          }

          window.__midtransSnapInProgress = false;
          throw e;
        }
      } catch (e) {
        window.__midtransSnapInProgress = false;
        throw e;
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error || "");

      // Handle known Midtrans invalid-state errors gracefully (do not propagate)
      if (
        errorMsg.includes("Invalid state transition") ||
        errorMsg.includes("snap.pay is not allowed") ||
        errorMsg.includes("PopupInView") ||
        errorMsg.includes("snap.pay is not allowed to be called")
      ) {
        console.warn("Ignored Midtrans invalid-state error:", errorMsg);
        toast.info("Payment popup is already open");
        window.__midtransSnapInProgress = false;
        return;
      }

      const shown = errorMsg || "Payment initialization failed";
      toast.error(shown);
      window.__midtransSnapInProgress = false;
      onPaymentError?.(shown);
    }
  }, [
    createSnapToken,
    orderId,
    onPaymentSuccess,
    onPaymentPending,
    onPaymentError,
    onClose,
  ]);

  // Auto-trigger payment when modal opens and Snap is loaded
  useEffect(() => {
    if (
      isOpen &&
      snapLoaded &&
      !paymentAttempted &&
      !createSnapToken.isPending
    ) {
      setPaymentAttempted(true);
      handlePayment();
    }
  }, [
    isOpen,
    snapLoaded,
    paymentAttempted,
    createSnapToken.isPending,
    handlePayment,
  ]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Payment Gateway
          </DialogTitle>
          <DialogDescription>
            Complete your payment for Order #{orderId}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Order Summary */}
          <Card>
            <CardContent className="p-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  Order Total
                </span>
                <span className="text-lg font-bold text-primary">
                  {formatCurrency(orderTotal)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Status */}
          <div className="flex flex-col items-center space-y-3 py-4">
            {createSnapToken.isPending || !snapLoaded ? (
              <>
                <Spinner size={32} className="text-primary" />
                <div className="text-center">
                  <p className="text-sm font-medium">
                    {!snapLoaded
                      ? "Loading payment gateway..."
                      : "Preparing payment..."}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Please wait a moment
                  </p>
                </div>
              </>
            ) : createSnapToken.isError ? (
              <>
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium text-red-600">
                    Payment initialization failed
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {createSnapToken.error?.message || "Please try again"}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setPaymentAttempted(false);
                    createSnapToken.reset();
                  }}
                  className="w-full"
                >
                  Try Again
                </Button>
              </>
            ) : (
              <>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <Clock className="w-6 h-6 text-blue-600" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-medium">
                    Payment window should open automatically
                  </p>
                  <p className="text-xs text-muted-foreground">
                    If it doesn&apos;t open, click the button below
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setPaymentAttempted(false);
                    handlePayment();
                  }}
                  className="w-full"
                  variant="default"
                >
                  Open Payment
                </Button>
              </>
            )}
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 py-2 bg-muted/30 rounded-lg">
            <CheckCircle className="w-4 h-4 text-green-600" />
            <span className="text-xs text-muted-foreground">
              Secured by Midtrans Payment Gateway
            </span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
