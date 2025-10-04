"use client";

import React from "react";
import { useQuery } from "@tanstack/react-query";
import { useCart, useUpdateCartItem } from "@/hooks/useCart";
import useCreateOrder from "@/hooks/useOrder";
import usersService from "@/services/users.service";
import useLocationStore from "@/stores/locationStore";
import apiClient from "@/lib/axios-client";
import { toast } from "sonner";
import { DiscountResponse } from "@/types/discount.types";

type FieldType = "address" | "shipping" | "payment";

function scrollToField(fieldType: FieldType) {
  const selectors = {
    address: '[data-field="address"]',
    shipping: '[data-field="shipping"]',
    payment: '[data-field="payment"]',
  };

  const targetElement = document.querySelector(selectors[fieldType]);
  if (targetElement) {
    targetElement.scrollIntoView({ behavior: "smooth", block: "center" });
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
}

function formatDistanceError(
  distanceMeters: number | null,
  maxRadiusKm: number | null,
  isOutsideService: boolean
): string {
  if (distanceMeters != null && maxRadiusKm != null) {
    const km = (distanceMeters / 1000).toFixed(1);
    return isOutsideService
      ? `Address is ${km} km away (limit ${maxRadiusKm} km) — outside service area`
      : `Address is ${km} km away (limit ${maxRadiusKm} km) — not served by the store you shopped from.`;
  }
  return isOutsideService
    ? "Selected address is outside service area for any store"
    : "Selected address is not served by the store you shopped from. Please pick another address.";
}

function handleBackendErrors(
  errors: Array<{ field: string; message: string }>
): void {
  const fieldMapping: Record<string, FieldType> = {
    addressId: "address",
    shippingMethod: "shipping",
    paymentMethod: "payment",
  };

  const priority = ["addressId", "shippingMethod", "paymentMethod"];
  const firstError =
    errors.find((e) => priority.includes(e.field)) || errors[0];

  toast.error(firstError.message);

  const frontendField = fieldMapping[firstError.field];
  if (frontendField) scrollToField(frontendField);
}

export function getUserId(): number {
  if (typeof window === "undefined") return 4;
  const devUser = localStorage.getItem("devUserId");
  const storedUserId = sessionStorage.getItem("checkout:userId");
  return devUser && devUser !== "none"
    ? Number(devUser)
    : storedUserId
    ? Number(storedUserId)
    : 4;
}

function getSelectedCartIds(): number[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem("checkout:selectedIds");
    if (raw) {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.map((n) => Number(n));
    }
  } catch {}
  return null;
}

function getOrCreateIdempotencyKey(): string {
  if (typeof window === "undefined") {
    return String(Math.random()).slice(2, 14);
  }
  try {
    const key = sessionStorage.getItem("checkout:idempotencyKey");
    if (key) return key;
  } catch {}
  const newKey = String(Math.random()).slice(2, 14);
  try {
    sessionStorage.setItem("checkout:idempotencyKey", newKey);
  } catch {}
  return newKey;
}

function storePaymentSession(orderTotal: number, paymentMethod: string) {
  try {
    const paymentSession = {
      orderId: 0,
      orderTotal,
      timestamp: Date.now(),
      paymentMethod,
    };
    sessionStorage.setItem("pendingPayment", JSON.stringify(paymentSession));
  } catch {}
}

function clearCheckoutSession(): void {
  try {
    sessionStorage.removeItem("checkout:selectedIds");
    sessionStorage.removeItem("checkout:idempotencyKey");
  } catch {}
}

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

type Address = {
  id: number;
  addressLine?: string;
  city?: string;
  postalCode?: string;
};

export function useCheckoutForm(userId: number) {
  const initialStoreIdRef = React.useRef<number | null>(
    typeof window !== "undefined"
      ? useLocationStore.getState().nearestStoreId ?? null
      : null
  );

  const { data: cart, isLoading: isCartLoading } = useCart(
    userId,
    initialStoreIdRef.current ?? undefined
  );

  const createOrder = useCreateOrder(userId);
  const updateCartItemMutation = useUpdateCartItem(
    userId,
    initialStoreIdRef.current ?? undefined
  );

  // Form state
  const [selectedAddress, setSelectedAddress] = React.useState<{
    id: number;
  } | null>(null);
  const [shippingMethod, setShippingMethod] = React.useState<string | null>(
    null
  );
  const [shippingOption, setShippingOption] = React.useState<string | null>(
    null
  );
  const [paymentMethod, setPaymentMethod] = React.useState<string | null>(null);
  const [appliedDiscounts, setAppliedDiscounts] = React.useState<
    DiscountResponse[]
  >([]);
  const [showSuccessModal, setShowSuccessModal] = React.useState(false);
  const [idempotencyKey, setIdempotencyKey] = React.useState<string | null>(
    null
  );
  const [selectedIds, setSelectedIds] = React.useState<number[] | null>(null);

  // Load selected IDs and idempotency key on mount
  React.useEffect(() => {
    const ids = getSelectedCartIds();
    setSelectedIds(ids);

    const key = getOrCreateIdempotencyKey();
    setIdempotencyKey(key);
  }, []);

  // Fetch user data
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

  // Fetch user addresses
  const { data: userAddresses } = useQuery({
    queryKey: ["user", userId, "addresses"],
    queryFn: () => usersService.getUserAddresses(userId),
    enabled: Boolean(userId),
  });

  const selectedAddressFull = React.useMemo(() => {
    if (!selectedAddress || !Array.isArray(userAddresses)) return null;
    const typed = userAddresses as Address[];
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

  // Calculate cart items for order
  const items = React.useMemo(() => {
    if (!cart) return [];
    return (
      selectedIds && selectedIds.length > 0
        ? cart.items.filter((it) => selectedIds.includes(it.id))
        : cart.items
    ).map((it) => ({ productId: it.productId, qty: it.qty }));
  }, [cart, selectedIds]);

  // Address selection with validation
  const handleSelectAddress = React.useCallback(
    async (a: { id: number }) => {
      setSelectedAddress(a);

      try {
        const checkoutStoreId = initialStoreIdRef.current;
        if (!checkoutStoreId) return;

        const resp = await apiClient.get<ResolveResp>(
          `/stores/resolve?userId=${userId}&addressId=${a.id}`
        );

        const resolved = resp.data?.nearestStore?.id ?? null;
        const distanceMeters = resp.data?.distanceMeters ?? null;
        const maxRadiusKm = resp.data?.maxRadiusKm ?? null;

        if (!resolved) {
          const message = formatDistanceError(
            distanceMeters,
            maxRadiusKm,
            true
          );
          toast.error(message);
          return;
        }

        if (resolved !== checkoutStoreId) {
          const message = formatDistanceError(
            distanceMeters,
            maxRadiusKm,
            false
          );
          toast.error(message);
        }
      } catch {
        // Ignore resolve errors; will be re-validated on place order
      }
    },
    [userId]
  );

  const handleUpdateCart = async (itemId: number, newQty: number) => {
    if (!cart) return;

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      toast.error("Cart item not found");
      return;
    }

    await updateCartItemMutation.mutateAsync({
      itemId,
      qty: newQty,
    });
  };

  const handleShippingMethodChange = (method: string) => {
    setShippingMethod(method);
    setShippingOption(null);
  };

  const handlePlaceOrder = async () => {
    try {
      // Validation
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

      // Validate address with store
      const checkoutStoreId = initialStoreIdRef.current;
      if (checkoutStoreId) {
        const resp = await apiClient.get<ResolveResp>(
          `/stores/resolve?userId=${userId}&addressId=${addressId}`
        );
        const resolved = resp.data?.nearestStore?.id ?? null;
        const distanceMeters = resp.data?.distanceMeters ?? null;
        const maxRadiusKm = resp.data?.maxRadiusKm ?? null;

        if (!resolved) {
          const message = formatDistanceError(
            distanceMeters,
            maxRadiusKm,
            true
          );
          toast.error(message);
          scrollToField("address");
          return;
        }

        if (resolved !== checkoutStoreId) {
          const message = formatDistanceError(
            distanceMeters,
            maxRadiusKm,
            false
          );
          toast.error(message);
          scrollToField("address");
          return;
        }
      }

      // Store payment session for gateway payments
      if (paymentMethod === "Gateway" && cart) {
        const cartTotal =
          items.reduce((sum, it) => {
            const price =
              cart.items.find((ci) => ci.productId === it.productId)?.product
                ?.price ?? 0;
            return sum + price * it.qty;
          }, 0) ?? 0;

        storePaymentSession(cartTotal, paymentMethod);
      }

      // Create order
      await createOrder.mutateAsync({
        items,
        idempotencyKey: key,
        addressId,
        shippingMethod,
        shippingOption: shippingOption || undefined,
        paymentMethod,
      });

      // Show success modal
      setShowSuccessModal(true);
      clearCheckoutSession();
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
        handleBackendErrors(backendErrors);
        return;
      }

      const msg =
        error.response?.data?.message ||
        error.message ||
        "Failed to create order";
      toast.error(msg);
    }
  };

  const handleSuccessModalComplete = React.useCallback(() => {
    const orderSuccessStr = sessionStorage.getItem("orderSuccess");
    if (orderSuccessStr) {
      try {
        const { orderId } = JSON.parse(orderSuccessStr);
        sessionStorage.removeItem("orderSuccess");

        setTimeout(() => {
          window.location.href = `/orders/${orderId}`;
        }, 300);
      } catch {
        setTimeout(() => {
          window.location.href = `/orders`;
        }, 300);
      }
    } else {
      setTimeout(() => {
        window.location.href = `/orders`;
      }, 300);
    }
  }, []);

  return {
    // Data
    cart,
    isCartLoading,
    customer,
    selectedAddressFull,
    items,
    initialStoreId: initialStoreIdRef.current,

    // Form state
    selectedAddress,
    shippingMethod,
    shippingOption,
    paymentMethod,
    appliedDiscounts,
    showSuccessModal,

    // Handlers
    handleSelectAddress,
    handleUpdateCart,
    setShippingMethod: handleShippingMethodChange,
    setShippingOption,
    setPaymentMethod,
    setAppliedDiscounts,
    handlePlaceOrder,
    handleSuccessModalComplete,

    // Status
    isProcessing: createOrder.status === "pending",
  };
}
