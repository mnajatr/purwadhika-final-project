"use client";

import React from "react";
import { useCart } from "@/hooks/useCart";
import useCreateOrder from "@/hooks/useOrder";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Spinner } from "@/components/ui/spinner";
import AddressCard from "@/components/checkout/AddressCard";
import ItemsList from "@/components/checkout/ItemsList";
import OrderSummary from "@/components/checkout/OrderSummary";
import ApplyDiscount from "@/components/discount/ApplyDiscount";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import usersService from "@/services/users.service";
import useLocationStore from "@/stores/locationStore";
import apiClient from "@/lib/axios-client";
import {
  ArrowLeft,
  Clock,
  MessageSquare,
  Check,
  Package,
  ShieldCheck,
} from "lucide-react";
import {
  FaShippingFast,
  FaTruck,
  FaWallet,
  FaMapMarkerAlt,
  FaComments,
  FaLock,
  FaCheckCircle,
} from "react-icons/fa";
import { MdLocalShipping, MdPayment, MdMessage } from "react-icons/md";
import { TbTruckDelivery, TbCreditCard, TbDiscount } from "react-icons/tb";
import { DiscountResponse } from "@/types/discount.types";
import OrderSuccessModal from "@/components/checkout/OrderSuccessModal";
type ResolveResp = {
  success?: boolean;
  data?: {
    nearestStore?: { id: number } | null;
    distanceMeters?: number | null;
    maxRadiusKm?: number | null;
    inRange?: boolean;
  };
  message?: string;
};

export default function CheckoutPage() {
  const devUser =
    typeof window !== "undefined" ? localStorage.getItem("devUserId") : null;
  const storedUserId =
    typeof window !== "undefined"
      ? sessionStorage.getItem("checkout:userId")
      : null;
  const userId =
    devUser && devUser !== "none"
      ? Number(devUser)
      : storedUserId
      ? Number(storedUserId)
      : 4;

  const initialStoreIdRef = React.useRef<number | null>(
    typeof window !== "undefined"
      ? useLocationStore.getState().nearestStoreId ?? null
      : null
  );

  const { data: cart, isLoading: isCartLoading } = useCart(
    userId,
    initialStoreIdRef.current ?? undefined
  );

  const [appliedDiscounts, setAppliedDiscounts] = React.useState<
    DiscountResponse[]
  >([]);

  const createOrder = useCreateOrder(userId);

  // shipping method selection (null = not selected)
  const [shippingMethod, setShippingMethod] = React.useState<string | null>(
    null
  );
  // shipping option (e.g., Reguler, Hemat Kargo) shown after carrier is chosen
  const [shippingOption, setShippingOption] = React.useState<string | null>(
    null
  );
  // open state for the shipping option dropdown so it appears reliably
  const [shippingOptionOpen, setShippingOptionOpen] =
    React.useState<boolean>(false);
  // control the shipping dropdown open state so we can anchor it to the card
  const [shippingMenuOpen, setShippingMenuOpen] =
    React.useState<boolean>(false);
  // measured pixel width for the shipping dropdown to exactly match the card
  const [shippingMenuWidth, setShippingMenuWidth] = React.useState<
    number | null
  >(null);
  const cardRef = React.useRef<HTMLDivElement | null>(null);

  const updateShippingMenuWidth = React.useCallback(() => {
    const el = cardRef.current;
    if (!el) return setShippingMenuWidth(null);
    const rect = el.getBoundingClientRect();
    setShippingMenuWidth(Math.round(rect.width));
  }, []);

  React.useEffect(() => {
    if (!shippingMenuOpen) return;
    updateShippingMenuWidth();
    const onResize = () => updateShippingMenuWidth();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [shippingMenuOpen, updateShippingMenuWidth]);

  const [idempotencyKey, setIdempotencyKey] = React.useState<string | null>(
    null
  );

  const [selectedAddress, setSelectedAddress] = React.useState<{
    id: number;
  } | null>(null);

  const [paymentMethod, setPaymentMethod] = React.useState<string | null>(null);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);

  const handleSelectAddress = React.useCallback(
    async (a: { id: number }) => {
      setSelectedAddress(a);
      // Validation-only: ensure selected address is served by the same store used during shopping
      try {
        const checkoutStoreId = initialStoreIdRef.current;
        if (!checkoutStoreId) return; // nothing to validate
        const resp = await apiClient.get<ResolveResp>(
          `/stores/resolve?userId=${userId}&addressId=${a.id}`
        );
        const resolved = resp.data?.nearestStore?.id ?? null;
        const distanceMeters = resp.data?.distanceMeters ?? null;
        const maxRadiusKm = resp.data?.maxRadiusKm ?? null;
        if (!resolved) {
          if (distanceMeters != null && maxRadiusKm != null) {
            const km = (distanceMeters / 1000).toFixed(1);
            toast.error(
              `Address is ${km} km away (limit ${maxRadiusKm} km) — outside service area`
            );
          } else {
            toast.error(
              "Selected address is outside service area for any store"
            );
          }
          return;
        }
        if (resolved !== checkoutStoreId) {
          if (distanceMeters != null && maxRadiusKm != null) {
            const km = (distanceMeters / 1000).toFixed(1);
            toast.error(
              `Address is ${km} km away (limit ${maxRadiusKm} km) — not served by the store you shopped from.`
            );
          } else {
            toast.error(
              "Selected address is not served by the store you shopped from. Please pick another address."
            );
          }
        }
      } catch {
        /* ignore resolve errors here; will be re-validated on place order */
      }
    },
    [userId]
  );

  // read selection saved by CartPage (sessionStorage key: checkout:selectedIds)
  const [selectedIds, setSelectedIds] = React.useState<number[] | null>(null);

  React.useEffect(() => {
    try {
      const raw = sessionStorage.getItem("checkout:selectedIds");
      if (raw) {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) setSelectedIds(parsed.map((n) => Number(n)));
      }
    } catch {
      setSelectedIds(null);
    }
    // read any stored idempotency key
    try {
      const key = sessionStorage.getItem("checkout:idempotencyKey");
      if (key) setIdempotencyKey(key);
    } catch {
      /* ignore */
    }
  }, []);

  // fetch basic user profile for display in order summary via React Query
  const { data: userData } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => usersService.getUser(userId),
    enabled: Boolean(userId),
  });

  const customer = React.useMemo(() => {
    return userData
      ? {
          fullName: userData.profile?.fullName,
          phone: undefined,
          email: userData.email,
        }
      : null;
  }, [userData]);

  // fetch user's addresses and pick the selected one from cache
  const { data: userAddresses } = useQuery({
    queryKey: ["user", userId, "addresses"],
    queryFn: () => usersService.getUserAddresses(userId),
    enabled: Boolean(userId),
  });

  const selectedAddressFull = React.useMemo(() => {
    if (!selectedAddress || !Array.isArray(userAddresses)) return null;
    type Addr = {
      id: number;
      addressLine?: string;
      city?: string;
      postalCode?: string;
    };
    const typed = userAddresses as Addr[];
    const found = typed.find((a) => a.id === selectedAddress.id);
    return found
      ? {
          id: found.id,
          addressLine: found.addressLine,
          city: found.city,
          postalCode: found.postalCode,
        }
      : null;
  }, [selectedAddress, userAddresses]);

  const handleSuccessModalComplete = React.useCallback(() => {
    // Don't hide modal immediately, keep it visible during redirect
    // setShowSuccessModal(false);

    // Get order success info from session
    const orderSuccessStr = sessionStorage.getItem("orderSuccess");
    if (orderSuccessStr) {
      try {
        const { orderId } = JSON.parse(orderSuccessStr);
        sessionStorage.removeItem("orderSuccess");

        // Add a small delay to ensure modal animation completes, then redirect
        // Modal will stay visible until the page actually changes
        setTimeout(() => {
          window.location.href = `/orders/${orderId}`;
        }, 300);
      } catch (err) {
        console.warn("Failed to parse order success info", err);
        // Fallback: just go to orders page
        setTimeout(() => {
          window.location.href = `/orders`;
        }, 300);
      }
    } else {
      // Fallback: just go to orders page
      setTimeout(() => {
        window.location.href = `/orders`;
      }, 300);
    }
  }, []);

  if (isCartLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div
          role="status"
          aria-live="polite"
          className="w-full max-w-sm p-8 text-center"
        >
          {/* Outer animated ring */}
          <div className="relative mx-auto w-32 h-32 flex items-center justify-center">
            {/* Rotating gradient background */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary via-secondary to-primary animate-spin opacity-20 blur-sm"></div>

            {/* Main container */}
            <div className="relative w-28 h-28 rounded-full shadow-2xl bg-gradient-to-br from-primary/20 via-background to-secondary/20 border border-primary/10 animate-pulse">
              {/* Inner glow effect */}
              <div className="absolute inset-2 rounded-full bg-gradient-to-tr from-primary/5 to-secondary/5 shadow-inner">
                {/* Spinner container */}
                <div className="w-full h-full flex items-center justify-center bg-card/90 rounded-full backdrop-blur-sm border border-white/20">
                  <Spinner
                    variant="ring"
                    size={84}
                    className="text-primary drop-shadow-lg"
                  />
                </div>
              </div>

              {/* Floating dots */}
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-primary rounded-full animate-bounce shadow-lg"></div>
              <div
                className="absolute -bottom-1 -left-1 w-2 h-2 bg-secondary rounded-full animate-bounce shadow-lg"
                style={{ animationDelay: "0.5s" }}
              ></div>
            </div>

            {/* Pulse rings */}
            <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping"></div>
            <div
              className="absolute inset-4 rounded-full border border-secondary/20 animate-ping"
              style={{ animationDelay: "0.3s" }}
            ></div>
          </div>

          <span className="sr-only">Loading checkout</span>
        </div>
      </div>
    );
  }

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-semibold text-foreground">
              Your cart is empty
            </h2>
            <p className="text-muted-foreground">
              Please add items to your cart before proceeding to checkout.
            </p>
          </div>
          <Button onClick={() => window.history.back()} className="mt-4">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
        </div>
      </div>
    );
  }

  const items = (
    selectedIds && selectedIds.length > 0
      ? cart.items.filter((it) => selectedIds.includes(it.id))
      : cart.items
  ).map((it) => ({ productId: it.productId, qty: it.qty }));

  const productIds = cart.items.map((it) => it.productId);

  const scrollToField = (fieldType: "address" | "shipping" | "payment") => {
    let targetElement: Element | null = null;

    switch (fieldType) {
      case "address":
        targetElement = document.querySelector('[data-field="address"]');
        break;
      case "shipping":
        targetElement = document.querySelector('[data-field="shipping"]');
        break;
      case "payment":
        targetElement = document.querySelector('[data-field="payment"]');
        break;
    }

    if (targetElement) {
      targetElement.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });

      targetElement.classList.add(
        "ring-2",
        "ring-red-500",
        "ring-opacity-75",
        "animate-pulse"
      );
      setTimeout(() => {
        targetElement?.classList.remove(
          "ring-2",
          "ring-red-500",
          "ring-opacity-75",
          "animate-pulse"
        );
      }, 3000);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      if (!selectedAddress) {
        toast.error("Please select a delivery address");
        scrollToField("address");
        return;
      }

      if (!shippingMethod) {
        toast.error("Please select a shipping method");
        scrollToField("shipping");
        return;
      }

      if (!paymentMethod) {
        toast.error("Please select a payment method");
        scrollToField("payment");
        return;
      }

      const key = idempotencyKey ?? String(Math.random()).slice(2, 14);
      try {
        sessionStorage.setItem("checkout:idempotencyKey", key);
      } catch {}

      const addressId = selectedAddress.id;

      const checkoutStoreId = initialStoreIdRef.current;
      if (checkoutStoreId) {
        const resp = await apiClient.get<ResolveResp>(
          `/stores/resolve?userId=${userId}&addressId=${addressId}`
        );
        const resolved = resp.data?.nearestStore?.id ?? null;
        const distanceMeters = resp.data?.distanceMeters ?? null;
        const maxRadiusKm = resp.data?.maxRadiusKm ?? null;

        if (!resolved) {
          const km = distanceMeters ? (distanceMeters / 1000).toFixed(1) : null;
          const message =
            km && maxRadiusKm
              ? `Address is ${km} km away (limit ${maxRadiusKm} km) — outside service area`
              : "Selected address is outside service area for any store";
          toast.error(message);
          scrollToField("address");
          return;
        }

        if (resolved !== checkoutStoreId) {
          const km = distanceMeters ? (distanceMeters / 1000).toFixed(1) : null;
          const message =
            km && maxRadiusKm
              ? `Address is ${km} km away (limit ${maxRadiusKm} km) — not served by the chosen store.`
              : "Selected address is not served by the chosen store. Please pick an address within the store's delivery area.";
          toast.error(message);
          scrollToField("address");
          return;
        }
      }

      if (paymentMethod === "Gateway") {
        try {
          const cartTotal =
            cart?.items?.reduce((sum, item) => {
              const price = item.product?.price ?? 0;
              return sum + price * item.qty;
            }, 0) ?? 0;

          const paymentSession = {
            orderId: 0,
            orderTotal: cartTotal,
            timestamp: Date.now(),
            paymentMethod: paymentMethod,
          };
          sessionStorage.setItem(
            "pendingPayment",
            JSON.stringify(paymentSession)
          );
        } catch {
          // Ignore payment session errors
        }
      }

      await createOrder.mutateAsync({
        items,
        idempotencyKey: key,
        addressId,
        shippingMethod,
        shippingOption: shippingOption || undefined,
        paymentMethod,
      });

      // Show success modal instead of immediate redirect
      setShowSuccessModal(true);

      try {
        sessionStorage.removeItem("checkout:selectedIds");
        sessionStorage.removeItem("checkout:idempotencyKey");
      } catch {}
    } catch (err) {
      const error = err as {
        message?: string;
        response?: {
          data?: {
            message?: string;
            errors?: Array<{ field: string; message: string }>;
          };
        };
      };

      const backendErrors = error.response?.data?.errors;
      if (backendErrors && backendErrors.length > 0) {
        type BE = { field?: string; message?: string };
        const typedErrors = backendErrors as BE[];
        // Prioritize which backend field to surface first in the UI.
        // Order: addressId -> shippingMethod -> paymentMethod
        const priority = ["addressId", "shippingMethod", "paymentMethod"];
        let firstError: { field: string; message: string } | undefined;
        for (const p of priority) {
          const found = typedErrors.find((e) => e.field === p);
          if (found) {
            firstError = found as { field: string; message: string };
            break;
          }
        }
        // fallback to the first returned error if none match priority
        if (!firstError) firstError = backendErrors[0];

        toast.error(firstError.message);

        const fieldMapping: Record<string, "address" | "shipping" | "payment"> =
          {
            addressId: "address",
            shippingMethod: "shipping",
            paymentMethod: "payment",
          };

        const frontendField = fieldMapping[firstError.field];
        if (frontendField) {
          scrollToField(frontendField);
        }
        return;
      }

      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to create order";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-6">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
              className="h-10 w-10 p-0 rounded-full shadow-md hover:shadow-lg transition-all duration-200 hover:scale-105"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Checkout
              </h1>
              <p className="text-muted-foreground mt-1">
                {!selectedAddress
                  ? "Please select a delivery address to continue"
                  : !shippingMethod
                  ? "Choose your preferred shipping method"
                  : !paymentMethod
                  ? "Select a payment method to complete your order"
                  : "Review your order and place when ready"}
              </p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-4 py-2 bg-muted/50 rounded-2xl">
            <ShieldCheck className="w-5 h-5 text-green-500" />
            <span className="text-sm font-medium text-foreground">
              Secure Checkout
            </span>
          </div>
        </div>

        {/* Mobile Progress Steps */}
        <div className="lg:hidden mb-8">
          <Card className="bg-gradient-to-r from-primary/5 to-secondary/5 border border-primary/20">
            <CardContent className="p-4">
              <div className="flex items-center justify-between relative">
                {/* Progress line */}
                <div className="absolute top-1/2 left-6 right-6 h-0.5 bg-border -translate-y-1/2">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary transition-all duration-500"
                    style={{
                      width:
                        selectedAddress && shippingMethod && paymentMethod
                          ? "100%"
                          : shippingMethod
                          ? "66%"
                          : selectedAddress
                          ? "33%"
                          : "0%",
                    }}
                  />
                </div>

                {/* Step indicators */}
                <div className="flex items-center justify-between w-full relative z-10">
                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                        selectedAddress
                          ? "bg-primary text-white"
                          : "bg-background border-2 border-border"
                      }`}
                    >
                      {selectedAddress ? (
                        <FaCheckCircle className="w-5 h-5" />
                      ) : (
                        "1"
                      )}
                    </div>
                    <span className="text-xs font-medium text-center">
                      Address
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                        shippingMethod
                          ? "bg-primary text-white"
                          : "bg-background border-2 border-border"
                      }`}
                    >
                      {shippingMethod ? (
                        <FaCheckCircle className="w-5 h-5" />
                      ) : (
                        "2"
                      )}
                    </div>
                    <span className="text-xs font-medium text-center">
                      Ship
                    </span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                        paymentMethod
                          ? "bg-primary text-white"
                          : "bg-background border-2 border-border"
                      }`}
                    >
                      {paymentMethod ? (
                        <FaCheckCircle className="w-5 h-5" />
                      ) : (
                        "3"
                      )}
                    </div>
                    <span className="text-xs font-medium text-center">Pay</span>
                  </div>

                  <div className="flex flex-col items-center gap-2">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                        selectedAddress && shippingMethod && paymentMethod
                          ? "bg-gradient-to-r from-primary to-secondary text-white animate-pulse"
                          : "bg-background border-2 border-border"
                      }`}
                    >
                      <FaLock className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-medium text-center">
                      Order
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content with left-side steps */}
          <div className="lg:col-span-2">
            <div className="flex gap-4">
              {/* Left bullets moved next to each card on large screens (no sticky sidebar) */}

              {/* Right: original main content moved here */}
              <div className="flex-1 space-y-8 relative">
                {/* Vertical progress track (visible on large screens) */}
                <div
                  aria-hidden
                  className="hidden lg:block absolute left-7 top-0 bottom-0 w-[2px] bg-border/60"
                />
                {/* Delivery Address (component includes its own Card) with left bullet on large screens */}
                <div
                  className={`flex items-center gap-6 transition-all duration-300 rounded-xl ${
                    !selectedAddress ? "bg-red-50/50 dark:bg-red-900/10" : ""
                  }`}
                  data-field="address"
                >
                  <div className="hidden lg:flex flex-col items-center w-14">
                    <div
                      className={`z-10 flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300 ${
                        selectedAddress
                          ? "bg-primary text-white shadow-lg scale-110"
                          : "bg-card border-2 border-red-300 hover:border-primary/50 text-red-500"
                      }`}
                    >
                      {selectedAddress ? (
                        <FaCheckCircle className="w-5 h-5" />
                      ) : (
                        <FaMapMarkerAlt className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <AddressCard
                      onSelect={handleSelectAddress}
                      checkoutStoreId={initialStoreIdRef.current}
                      userId={userId}
                    />
                  </div>
                </div>

                {/* Order Items (component includes its own Card) - aligned with other cards */}
                <div className="flex items-center gap-6">
                  <div className="hidden lg:flex flex-col items-center w-14">
                    {/* placeholder to align with bullets */}
                    <div className="z-10 w-10 h-10" />
                  </div>
                  <div className="flex-1">
                    <ItemsList
                      cart={cart}
                      selectedIds={selectedIds}
                      userId={userId}
                    />
                  </div>
                </div>

                {/* Shipping Method */}
                <div
                  className={`flex items-center gap-6 transition-all duration-300 rounded-xl ${
                    !shippingMethod && selectedAddress
                      ? "bg-orange-50/50 dark:bg-orange-900/10"
                      : ""
                  }`}
                  data-field="shipping"
                >
                  <div className="hidden lg:flex flex-col items-center w-14">
                    <div
                      className={`z-10 flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300 ${
                        shippingMethod
                          ? "bg-primary text-white shadow-lg scale-110"
                          : selectedAddress
                          ? "bg-orange-100 border-2 border-orange-300 text-orange-600"
                          : "bg-muted border-2 border-border"
                      }`}
                    >
                      {shippingMethod ? (
                        <FaCheckCircle className="w-5 h-5" />
                      ) : (
                        <FaShippingFast className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <Card className="bg-card rounded-2xl border border-border shadow-sm backdrop-blur-sm overflow-hidden">
                      {/* wrapper used to measure card width for the dropdown */}
                      <div ref={cardRef} className="w-full relative z-10">
                        <CardHeader className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-start gap-4">
                              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center relative">
                                <MdLocalShipping className="w-7 h-7 text-primary" />
                                {shippingMethod && (
                                  <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                )}
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                  Shipping Method
                                  {shippingMethod && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Selected
                                    </Badge>
                                  )}
                                </h3>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Choose your preferred delivery option
                                </p>
                              </div>
                            </div>

                            <Button
                              variant={shippingMethod ? "default" : "outline"}
                              size="sm"
                              onClick={() => setShippingMenuOpen(true)}
                              className="min-w-[80px] transition-all duration-200"
                            >
                              {shippingMethod ? "Change" : "Select"}
                            </Button>
                          </div>
                        </CardHeader>

                        {/* separator (match AddressCard) */}
                        <div className="px-4">
                          <div
                            aria-hidden
                            className="w-full rounded-full h-1"
                            style={{
                              background:
                                "linear-gradient(90deg, rgb(223, 239, 181), rgb(247, 237, 184), rgb(253, 231, 188))",
                            }}
                          />
                        </div>

                        <CardContent className="p-6 flex items-center justify-between">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-muted rounded-xl flex items-center justify-center">
                              <TbTruckDelivery className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <div>
                              <div className="font-semibold text-foreground text-lg">
                                {shippingMethod ?? "Select shipping carrier"}
                              </div>
                              <div className="text-sm text-muted-foreground">
                                {shippingMethod
                                  ? "Fast and reliable delivery service"
                                  : "Choose from available carriers"}
                              </div>
                            </div>
                          </div>

                          {/* Dropdown is anchored to an invisible full-width trigger inside the Card */}
                          <DropdownMenu
                            open={shippingMenuOpen}
                            onOpenChange={(open) => {
                              if (open) updateShippingMenuWidth();
                              setShippingMenuOpen(open);
                            }}
                          >
                            <DropdownMenuTrigger asChild>
                              <span className="absolute left-0 top-0 w-full h-full pointer-events-none" />
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                              align="start"
                              sideOffset={8}
                              className="p-4 min-w-[400px] shadow-2xl border-2"
                              style={{
                                width: shippingMenuWidth
                                  ? `${shippingMenuWidth}px`
                                  : undefined,
                              }}
                            >
                              <div className="mb-3">
                                <h4 className="font-semibold text-foreground mb-1">
                                  Available Carriers
                                </h4>
                                <p className="text-xs text-muted-foreground">
                                  Choose your preferred shipping option
                                </p>
                              </div>

                              <DropdownMenuItem
                                onSelect={() => {
                                  setShippingMethod("JNE");
                                  setShippingOption(null);
                                  setShippingMenuOpen(false);
                                  setShippingOptionOpen(true);
                                }}
                                className="p-4 hover:bg-primary/5 rounded-xl"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-100 to-orange-100 dark:from-red-900 dark:to-orange-900 flex items-center justify-center text-sm font-bold text-red-600 dark:text-red-400 shadow-md">
                                      JNE
                                    </div>
                                    <div>
                                      <div className="font-semibold text-foreground">
                                        JNE Express
                                      </div>
                                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        ETA: 2-3 days
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 text-sm">
                                    <span className="font-semibold text-foreground">
                                      Rp 12.000
                                    </span>
                                    {shippingMethod === "JNE" && (
                                      <Check className="w-5 h-5 text-primary" />
                                    )}
                                  </div>
                                </div>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onSelect={() => {
                                  setShippingMethod("J&T");
                                  setShippingOption(null);
                                  setShippingMenuOpen(false);
                                  setShippingOptionOpen(true);
                                }}
                                className="p-4 hover:bg-primary/5 rounded-xl"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 dark:from-green-900 dark:to-emerald-900 flex items-center justify-center text-sm font-bold text-green-600 dark:text-green-400 shadow-md">
                                      J&T
                                    </div>
                                    <div>
                                      <div className="font-semibold text-foreground">
                                        J&T Express
                                      </div>
                                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        ETA: 1-2 days
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 text-sm">
                                    <span className="font-semibold text-foreground">
                                      Rp 15.000
                                    </span>
                                    {shippingMethod === "J&T" && (
                                      <Check className="w-5 h-5 text-primary" />
                                    )}
                                  </div>
                                </div>
                              </DropdownMenuItem>

                              <DropdownMenuItem
                                onSelect={() => {
                                  setShippingMethod("Ninja Xpress");
                                  setShippingOption(null);
                                  setShippingMenuOpen(false);
                                  setShippingOptionOpen(true);
                                }}
                                className="p-4 hover:bg-primary/5 rounded-xl"
                              >
                                <div className="flex items-center justify-between w-full">
                                  <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-indigo-100 dark:from-purple-900 dark:to-indigo-900 flex items-center justify-center text-sm font-bold text-purple-600 dark:text-purple-400 shadow-md">
                                      NX
                                    </div>
                                    <div>
                                      <div className="font-semibold text-foreground">
                                        Ninja Xpress
                                      </div>
                                      <div className="text-sm text-muted-foreground flex items-center gap-2">
                                        <Clock className="w-3 h-3" />
                                        ETA: 1-3 days
                                      </div>
                                    </div>
                                  </div>
                                  <div className="flex items-center gap-3 text-sm">
                                    <span className="font-semibold text-foreground">
                                      Rp 18.000
                                    </span>
                                    {shippingMethod === "Ninja Xpress" && (
                                      <Check className="w-5 h-5 text-primary" />
                                    )}
                                  </div>
                                </div>
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </CardContent>
                      </div>

                      {/* Shipping Option - appears only after a carrier is chosen */}
                      {shippingMethod && (
                        <CardContent className="p-6 pt-0 border-t border-border/50">
                          <div className="flex items-center justify-between bg-gradient-to-r from-muted/50 to-transparent p-4 rounded-xl">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                                <Package className="w-5 h-5 text-primary" />
                              </div>
                              <div>
                                <div className="font-semibold text-foreground">
                                  {shippingOption ?? "Select shipping option"}
                                </div>
                                <div className="text-sm text-muted-foreground">
                                  Choose delivery speed and pricing
                                </div>
                              </div>
                            </div>

                            <DropdownMenu
                              open={shippingOptionOpen}
                              onOpenChange={setShippingOptionOpen}
                            >
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="min-w-[80px]"
                                >
                                  {shippingOption ? "Change" : "Select"}
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent
                                align="start"
                                sideOffset={4}
                                className="p-3 min-w-[200px]"
                              >
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setShippingOption("Reguler");
                                    setShippingOptionOpen(false);
                                  }}
                                  className="p-3 rounded-lg hover:bg-primary/5"
                                >
                                  <div className="flex items-center gap-2">
                                    <TbTruckDelivery className="w-4 h-4 text-blue-500" />
                                    <span className="font-medium">Reguler</span>
                                  </div>
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onSelect={() => {
                                    setShippingOption("Hemat Kargo");
                                    setShippingOptionOpen(false);
                                  }}
                                  className="p-3 rounded-lg hover:bg-primary/5"
                                >
                                  <div className="flex items-center gap-2">
                                    <TbDiscount className="w-4 h-4 text-green-500" />
                                    <span className="font-medium">
                                      Hemat Kargo
                                    </span>
                                  </div>
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </CardContent>
                      )}
                    </Card>
                  </div>
                </div>

                {/* Payment Method */}
                <div
                  className={`flex items-center gap-6 transition-all duration-300 rounded-xl ${
                    !paymentMethod && shippingMethod
                      ? "bg-green-50/50 dark:bg-green-900/10"
                      : ""
                  }`}
                  data-field="payment"
                >
                  <div className="hidden lg:flex flex-col items-center w-14">
                    <div
                      className={`z-10 flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300 ${
                        paymentMethod
                          ? "bg-primary text-white shadow-lg scale-110"
                          : shippingMethod
                          ? "bg-green-100 border-2 border-green-300 text-green-600"
                          : "bg-muted border-2 border-border"
                      }`}
                    >
                      {paymentMethod ? (
                        <FaCheckCircle className="w-5 h-5" />
                      ) : (
                        <FaWallet className="w-5 h-5" />
                      )}
                    </div>
                  </div>
                  <div className="flex-1">
                    <Card className="bg-card rounded-2xl border border-border shadow-sm backdrop-blur-sm overflow-hidden">
                      <CardHeader className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center relative">
                              <MdPayment className="w-7 h-7 text-primary" />
                              {paymentMethod && (
                                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                                  <Check className="w-3 h-3 text-white" />
                                </div>
                              )}
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                                Payment Method
                                {paymentMethod && (
                                  <Badge
                                    variant="secondary"
                                    className="text-xs"
                                  >
                                    Selected
                                  </Badge>
                                )}
                              </h3>
                              <p className="text-sm text-muted-foreground mt-1">
                                Select your preferred payment option
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <ShieldCheck className="w-5 h-5 text-green-500" />
                            <span className="text-xs text-green-600 font-medium">
                              Secure
                            </span>
                          </div>
                        </div>
                      </CardHeader>

                      {/* separator (match AddressCard) */}
                      <div className="px-4">
                        <div
                          aria-hidden
                          className="w-full rounded-full h-1"
                          style={{
                            background:
                              "linear-gradient(90deg, rgb(223, 239, 181), rgb(247, 237, 184), rgb(253, 231, 188))",
                          }}
                        />
                      </div>

                      <CardContent className="p-6 space-y-4">
                        {[
                          {
                            id: "Manual",
                            title: "Manual Transfer",
                            subtitle: "Bank transfer verification",
                            icon: <FaTruck className="w-5 h-5" />,
                            // neutral/primary styling to match AddressCard
                            color: "from-primary/20 to-primary/40",
                            iconColor: "text-primary",
                            bgColorActive: "bg-primary/10 border-primary",
                            bgColorInactive: "",
                          },
                          {
                            id: "Gateway",
                            title: "Payment Gateway",
                            subtitle: "Instant online payments",
                            icon: <TbCreditCard className="w-5 h-5" />,
                            color: "from-primary/20 to-primary/40",
                            iconColor: "text-primary",
                            bgColorActive: "bg-primary/10 border-primary",
                            bgColorInactive: "",
                          },
                        ].map((method) => {
                          const active = paymentMethod === method.id;
                          return (
                            <button
                              key={method.id}
                              onClick={() => setPaymentMethod(method.id)}
                              className={`w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all duration-300 text-left group hover:scale-[1.02] ${
                                active
                                  ? `border-primary bg-primary/10 shadow-lg ring-2 ring-primary/20 ${
                                      method.bgColorActive ?? ""
                                    }`
                                  : `border-border bg-card hover:border-primary/30 hover:shadow-md ${
                                      method.bgColorInactive ?? ""
                                    }`
                              }`}
                            >
                              <div
                                className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${
                                  method.color
                                } flex items-center justify-center shadow-lg transition-all duration-300 ${
                                  active
                                    ? "scale-110 shadow-xl"
                                    : "group-hover:scale-105"
                                }`}
                              >
                                <div className={method.iconColor}>
                                  {method.icon}
                                </div>
                              </div>

                              <div className="flex-1">
                                <div className="flex items-center justify-between">
                                  <div className="font-semibold text-foreground text-lg">
                                    {method.title}
                                  </div>
                                  {active && (
                                    <Badge className="bg-primary text-primary-foreground">
                                      Active
                                    </Badge>
                                  )}
                                </div>
                                <div className="text-sm text-muted-foreground mt-1">
                                  {method.subtitle}
                                </div>
                              </div>

                              <div className="flex items-center">
                                {active ? (
                                  <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
                                    <Check className="w-4 h-4 text-white" />
                                  </div>
                                ) : (
                                  <div className="w-5 h-5 rounded-full border-2 border-border group-hover:border-primary/50 transition-colors duration-300" />
                                )}
                              </div>
                            </button>
                          );
                        })}

                        {/* Security notice */}
                        <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl mt-4">
                          <FaLock className="w-4 h-4 text-muted-foreground" />
                          <div className="text-sm text-muted-foreground">
                            <span className="font-medium">SSL encrypted.</span>{" "}
                            Your payment information is secure and protected.
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>

                {/* Additional Options (aligned with other cards) */}
                <div className="flex items-center gap-6">
                  <div className="hidden lg:flex flex-col items-center w-14">
                    {/* placeholder to align with bullets */}
                    <div className="z-10 w-10 h-10" />
                  </div>
                  <div className="flex-1">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Promo Code */}
                      <ApplyDiscount
                        productIds={productIds}
                        onApplyDiscount={setAppliedDiscounts}
                      />

                      {/* Special Instructions */}
                      <Card className="bg-card rounded-2xl border border-border shadow-sm backdrop-blur-sm overflow-hidden">
                        <CardHeader className="p-4">
                          <CardTitle className="flex items-center gap-3 text-lg">
                            <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center shadow-md">
                              <MdMessage className="w-5 h-5 text-primary" />
                            </div>
                            <div>
                              <div className="font-semibold text-foreground">
                                Special Instructions
                              </div>
                              <div className="text-sm font-normal text-muted-foreground">
                                Additional delivery notes
                              </div>
                            </div>
                          </CardTitle>
                        </CardHeader>

                        {/* separator (match AddressCard) */}
                        <div className="px-4">
                          <div
                            aria-hidden
                            className="w-full rounded-full h-1"
                            style={{
                              background:
                                "linear-gradient(90deg, rgb(223, 239, 181), rgb(247, 237, 184), rgb(253, 231, 188))",
                            }}
                          />
                        </div>

                        <CardContent className="p-6">
                          <div className="space-y-3">
                            <Label
                              htmlFor="instructions"
                              className="text-sm font-medium text-foreground"
                            >
                              Delivery notes (optional)
                            </Label>
                            <div className="relative">
                              <textarea
                                id="instructions"
                                placeholder="Leave at front door, call when arriving, fragile items..."
                                className="w-full px-4 py-3 pl-10 border-2 border-border rounded-xl bg-background text-sm resize-none h-24 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary hover:border-primary/50 transition-colors"
                              />
                              <FaComments className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="text-xs text-muted-foreground flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              Help us deliver your order perfectly
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>
                </div>

                {/* Review bullet (bottom) - visible on large screens */}
                <div className="flex items-center gap-6 mt-6">
                  <div className="hidden lg:flex flex-col items-center w-14">
                    <div
                      className={`z-10 flex items-center justify-center w-10 h-10 rounded-full text-sm font-semibold transition-all duration-300 ${
                        selectedAddress && shippingMethod && paymentMethod
                          ? "bg-gradient-to-r from-primary to-primary/80 text-white shadow-lg animate-pulse"
                          : "bg-muted border-2 border-border"
                      }`}
                    >
                      <FaLock className="w-5 h-5" />
                    </div>
                    <div className="text-xs font-medium mt-2 text-muted-foreground">
                      Order
                    </div>
                  </div>
                  <div className="flex-1" />
                </div>
              </div>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              {/* OrderSummary renders its own Card */}
              <OrderSummary
                cart={cart}
                items={cart.items.map((it) => ({
                  productId: it.productId,
                  qty: it.qty,
                }))}
                appliedDiscounts={appliedDiscounts}
                onPlaceOrder={handlePlaceOrder}
                isProcessing={createOrder.status === "pending"}
                customer={customer ?? undefined}
                address={selectedAddressFull ?? undefined}
                shippingMethod={shippingMethod}
                shippingOption={shippingOption}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Success Modal */}
      <OrderSuccessModal
        isVisible={showSuccessModal}
        onComplete={handleSuccessModalComplete}
      />
    </div>
  );
}
