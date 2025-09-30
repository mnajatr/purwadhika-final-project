"use client";

import React, { useEffect } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
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

// Custom Dialog components that work with Midtrans
const PaymentDialog = ({
  open,
  onOpenChange,
  children,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}) => {
  if (!open) return null;

  const modalContent = (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      <div
        className="fixed inset-0 bg-black/50 backdrop-blur-sm transition-all duration-300"
        onClick={() => onOpenChange(false)}
      />
      <div className="relative bg-popover text-popover-foreground border border-muted/20 rounded-lg shadow-2xl max-w-md w-full mx-4 z-[10000] ring-1 ring-primary/10 animate-in fade-in-0 zoom-in-95 duration-300">
        {children}
      </div>
    </div>
  );

  // Use portal to render at document body level to avoid positioning issues
  return typeof document !== "undefined"
    ? createPortal(modalContent, document.body)
    : modalContent;
};

const PaymentDialogContent = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => <div className={`p-8 ${className}`}>{children}</div>;

const PaymentDialogHeader = ({ children }: { children: React.ReactNode }) => (
  <div className="pb-4">{children}</div>
);

const PaymentDialogTitle = ({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) => (
  <h2 className={`text-xl font-bold text-foreground ${className}`}>
    {children}
  </h2>
);

const PaymentDialogDescription = ({
  children,
}: {
  children: React.ReactNode;
}) => <p className="text-sm text-muted-foreground mt-1">{children}</p>;

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
              // Safely parse error message with multiple fallbacks
              let parsedMessage = "Payment failed, please try again";

              try {
                // Cast to unknown first, then to Record for safe property access
                const unknownResult = result as unknown;

                if (unknownResult && typeof unknownResult === "object") {
                  const obj = unknownResult as Record<string, unknown>;

                  // Try various common Midtrans error message fields
                  if (
                    typeof obj.status_message === "string" &&
                    obj.status_message.trim()
                  ) {
                    parsedMessage = obj.status_message.trim();
                  } else if (
                    typeof obj.message === "string" &&
                    obj.message.trim()
                  ) {
                    parsedMessage = obj.message.trim();
                  } else if (
                    typeof obj.error === "string" &&
                    obj.error.trim()
                  ) {
                    parsedMessage = obj.error.trim();
                  } else if (
                    obj.error &&
                    typeof (obj.error as Record<string, unknown>)?.message ===
                      "string"
                  ) {
                    const nestedMsg = (obj.error as Record<string, unknown>)
                      .message;
                    if (typeof nestedMsg === "string" && nestedMsg.trim()) {
                      parsedMessage = nestedMsg.trim();
                    }
                  }
                  // For empty objects {} or objects without useful messages, keep default fallback
                } else if (
                  typeof unknownResult === "string" &&
                  unknownResult.trim()
                ) {
                  parsedMessage = unknownResult.trim();
                }
                // If result is null/undefined/empty, keep default fallback message
              } catch (parseError) {
                // If parsing fails for any reason, keep default fallback
                console.log(
                  "⚠️ Error parsing Midtrans error payload:",
                  parseError
                );
              }

              // Always handle error gracefully - no throwing, no crashing
              try {
                // Show user-friendly toast
                toast.error(`Payment failed: ${parsedMessage}`);

                // Log for debugging (use console.log/warn to avoid Next.js error reporting)
                console.log("🔴 Payment error (raw):", result);
                console.log("📝 Payment error (parsed):", parsedMessage);

                // Notify parent component safely
                if (typeof onPaymentError === "function") {
                  try {
                    onPaymentError(parsedMessage);
                  } catch (callbackError) {
                    console.warn(
                      "⚠️ onPaymentError callback failed:",
                      callbackError
                    );
                  }
                }
              } catch (handlingError) {
                // Ultimate fallback - even if toast/logging fails, don't crash
                console.warn(
                  "🚨 Critical error in payment error handler:",
                  handlingError
                );
                // Show fallback toast if possible
                try {
                  toast.error("Payment failed, please try again");
                } catch {
                  // Silent fallback - don't cascade errors
                }
              } finally {
                // Always reset the progress flag
                window.__midtransSnapInProgress = false;
              }
            },
            onClose: () => {
              try {
                // User closed payment popup manually
                console.log("Payment popup closed by user");
                toast.info(
                  "Payment window closed. You can try again if needed."
                );
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
      const errorMsg =
        error instanceof Error ? error.message : String(error || "");

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
    <PaymentDialog open={isOpen} onOpenChange={onClose}>
      <PaymentDialogContent className="sm:max-w-md">
        <PaymentDialogHeader>
          <PaymentDialogTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Payment Gateway
          </PaymentDialogTitle>
          <PaymentDialogDescription>
            Complete your payment for Order #{orderId}
          </PaymentDialogDescription>
        </PaymentDialogHeader>

        <div className="space-y-4">
          {/* Order Summary */}
          <div className="bg-muted/30 rounded-xl p-5 border border-border/60">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">
                Order Total
              </span>
              <span className="text-xl font-bold text-primary">
                {formatCurrency(orderTotal)}
              </span>
            </div>
          </div>

          {/* Status */}
          <div className="flex flex-col items-center space-y-4 py-6">
            {createSnapToken.isPending || !snapLoaded ? (
              <>
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                  <Spinner size={24} className="text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-foreground">
                    {!snapLoaded
                      ? "Loading payment gateway..."
                      : "Preparing payment..."}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please wait a moment
                  </p>
                </div>
              </>
            ) : createSnapToken.isError ? (
              <>
                <div className="w-16 h-16 bg-destructive/10 rounded-2xl flex items-center justify-center border border-destructive/20">
                  <AlertCircle className="w-8 h-8 text-destructive" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-destructive">
                    Payment initialization failed
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {createSnapToken.error?.message || "Please try again"}
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setPaymentAttempted(false);
                    createSnapToken.reset();
                  }}
                  className="w-full bg-primary-gradient hover:opacity-95"
                  size="lg"
                >
                  Try Again
                </Button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center border border-primary/20">
                  <Clock className="w-8 h-8 text-primary" />
                </div>
                <div className="text-center">
                  <p className="text-base font-semibold text-foreground">
                    Payment window should open automatically
                  </p>
                  <p className="text-sm text-muted-foreground">
                    If it doesn&apos;t open, click the button below
                  </p>
                </div>
                <Button
                  onClick={() => {
                    setPaymentAttempted(false);
                    handlePayment();
                  }}
                  className="w-full bg-primary-gradient hover:opacity-95"
                  size="lg"
                >
                  Open Payment
                </Button>
              </>
            )}
          </div>

          {/* Security badge */}
          <div className="flex items-center justify-center gap-2 py-3 bg-muted/30 rounded-xl border border-border/30">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span className="text-sm font-medium text-muted-foreground">
              Secured by Midtrans Payment Gateway
            </span>
          </div>
        </div>
      </PaymentDialogContent>
    </PaymentDialog>
  );
}
