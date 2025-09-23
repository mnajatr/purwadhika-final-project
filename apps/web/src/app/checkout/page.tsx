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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import AddressCard from "@/components/checkout/AddressCard";
import ItemsList from "@/components/checkout/ItemsList";
import OrderSummary from "@/components/checkout/OrderSummary";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import usersService from "@/services/users.service";
import useLocationStore from "@/stores/locationStore";
import apiClient from "@/lib/axios-client";
import {
  ArrowLeft,
  Clock,
  CreditCard,
  Tag,
  MessageSquare,
  Check,
} from "lucide-react";
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
  // Prefer admin dev user selector (localStorage.devUserId) when set, otherwise sessionStorage, then seeded 4
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
  // Freeze the store used during shopping at first render to avoid cart switching during checkout
  const initialStoreIdRef = React.useRef<number | null>(
    typeof window !== "undefined"
      ? useLocationStore.getState().nearestStoreId ?? null
      : null
  );
  const { data: cart, isLoading: isCartLoading } = useCart(
    userId,
    initialStoreIdRef.current ?? undefined
  );

  // do not pass storeId to createOrder so backend can resolve nearest store
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

  // local payload type allowing shippingMethod to be passed through
  type CreateOrderPayload = {
    items: Array<{ productId: number; qty: number }>;
    idempotencyKey: string;
    addressId?: number | undefined;
    shippingMethod?: string;
    shippingOption?: string | null;
    paymentMethod?: string;
  };

  const [idempotencyKey, setIdempotencyKey] = React.useState<string | null>(
    null
  );

  // selected address from AddressCard (id only)
  const [selectedAddress, setSelectedAddress] = React.useState<{
    id: number;
  } | null>(null);

  // payment method selection
  const [paymentMethod, setPaymentMethod] = React.useState<string>("Manual");

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

  if (isCartLoading) return <div>Loading...</div>;
  if (!cart || cart.items.length === 0)
    return <div>Your cart is empty. Please add items first.</div>;

  const items = (
    selectedIds && selectedIds.length > 0
      ? cart.items.filter((it) => selectedIds.includes(it.id))
      : cart.items
  ).map((it) => ({ productId: it.productId, qty: it.qty }));

  const handlePlaceOrder = async () => {
    try {
      const key = idempotencyKey ?? String(Math.random()).slice(2, 14);
      // persist key so retries keep using same idempotency
      try {
        sessionStorage.setItem("checkout:idempotencyKey", key);
      } catch {}

      // use selected address id
      let addressId: number | undefined;
      if (selectedAddress) addressId = selectedAddress.id;

      // Validate against the store used during shopping (frozen at first render)
      const checkoutStoreId = initialStoreIdRef.current;
      if (checkoutStoreId) {
        if (!addressId) {
          toast.error("Please select an address");
          return;
        }
        const resp = await apiClient.get<ResolveResp>(
          `/stores/resolve?userId=${userId}&addressId=${addressId}`
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
              `Address is ${km} km away (limit ${maxRadiusKm} km) — not served by the chosen store.`
            );
          } else {
            toast.error(
              "Selected address is not served by the chosen store. Please pick an address within the store's delivery area."
            );
          }
          return;
        }
      }

      await createOrder.mutateAsync({
        items,
        idempotencyKey: key,
        addressId,
        shippingMethod,
        shippingOption,
        paymentMethod,
      } as CreateOrderPayload);
      toast.success("Order created — redirecting...");
      // cleanup and redirect
      try {
        sessionStorage.removeItem("checkout:selectedIds");
        sessionStorage.removeItem("checkout:idempotencyKey");
      } catch {}
    } catch (err) {
      const msg =
        (err as { message?: string })?.message || "Failed to create order";
      toast.error(msg);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-6 px-4 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.history.back()}
              className="h-9 w-9 p-0"
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Checkout</h1>
              <p className="text-muted-foreground">
                Complete your purchase securely
              </p>
            </div>
          </div>
          <Badge variant="secondary" className="px-3 py-1">
            {items.length} {items.length === 1 ? "item" : "items"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Delivery Address (component includes its own Card) */}
            <AddressCard
              onSelect={handleSelectAddress}
              checkoutStoreId={initialStoreIdRef.current}
              userId={userId}
            />

            {/* Order Items (component includes its own Card) */}
            <ItemsList cart={cart} selectedIds={selectedIds} userId={userId} />

            {/* Shipping Method */}
            <Card className="relative bg-card rounded-2xl border border-border shadow-sm backdrop-blur-sm overflow-hidden">
              {/* wrapper used to measure card width for the dropdown */}
              <div ref={cardRef} className="w-full">
                <CardHeader className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center relative">
                        <Clock className="w-7 h-7 text-primary" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-foreground">
                          Shipping Method
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          Choose a carrier
                        </p>
                      </div>
                    </div>

                    <div className="flex items-end">
                      <div className="mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShippingMenuOpen(true)}
                        >
                          Change
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                {/* separator */}
                <div className="px-4">
                  <div
                    aria-hidden
                    className="w-full rounded-full h-1"
                    style={{
                      background:
                        "linear-gradient(90deg, #dfefb5, #fff7ce, #fde7bc)",
                    }}
                  />
                </div>

                <CardContent className="p-4 flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-foreground">
                      {shippingMethod ?? "Select shipping carrier"}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Rates and ETA applied at confirmation
                    </div>
                  </div>

                  <div>
                    {/* Dropdown is anchored to an invisible full-width trigger inside the Card so the menu aligns to the card's left edge */}
                    <DropdownMenu
                      open={shippingMenuOpen}
                      onOpenChange={(open) => {
                        if (open) updateShippingMenuWidth();
                        setShippingMenuOpen(open);
                      }}
                    >
                      <DropdownMenuTrigger asChild>
                        {/* invisible full-card anchor; pointer-events none so it doesn't block clicks */}
                        <span className="absolute left-0 top-0 w-full h-full pointer-events-none" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align="start"
                        sideOffset={4}
                        className="p-6"
                        style={{
                          width: shippingMenuWidth
                            ? `${shippingMenuWidth}px`
                            : undefined,
                        }}
                      >
                        <DropdownMenuItem
                          onSelect={() => {
                            setShippingMethod("JNE");
                            setShippingOption(null);
                            setShippingMenuOpen(false);
                            setShippingOptionOpen(true);
                          }}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-xs font-semibold text-primary">
                                JNE
                              </div>
                              <div className="text-sm">
                                <div className="font-medium">JNE</div>
                                <div className="text-xs text-muted-foreground">
                                  ETA: 2-3 days
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div>Rp 12.000</div>
                              {shippingMethod === "JNE" && (
                                <Check className="w-4 h-4 text-primary" />
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
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-xs font-semibold text-primary">
                                J&T
                              </div>
                              <div className="text-sm">
                                <div className="font-medium">J&T Express</div>
                                <div className="text-xs text-muted-foreground">
                                  ETA: 1-2 days
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div>Rp 15.000</div>
                              {shippingMethod === "J&T" && (
                                <Check className="w-4 h-4 text-primary" />
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
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-xs font-semibold text-primary">
                                NX
                              </div>
                              <div className="text-sm">
                                <div className="font-medium">Ninja Xpress</div>
                                <div className="text-xs text-muted-foreground">
                                  ETA: 1-3 days
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <div>Rp 18.000</div>
                              {shippingMethod === "Ninja Xpress" && (
                                <Check className="w-4 h-4 text-primary" />
                              )}
                            </div>
                          </div>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  {/* visible trigger button moved into the CardHeader above */}
                </CardContent>
              </div>

              {/* Shipping Option - appears only after a carrier (shippingMethod) is chosen */}
              {shippingMethod && (
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <div className="font-semibold text-foreground">
                        {shippingOption ?? "Select shipping option"}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        Choose a delivery option
                      </div>
                    </div>

                    <div>
                      <DropdownMenu
                        open={shippingOptionOpen}
                        onOpenChange={setShippingOptionOpen}
                      >
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setShippingOptionOpen(true)}
                          >
                            Change
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="start"
                          sideOffset={4}
                          className="p-3"
                          style={{
                            width: shippingMenuWidth
                              ? `${shippingMenuWidth}px`
                              : undefined,
                          }}
                        >
                          <DropdownMenuItem
                            onSelect={() => {
                              setShippingOption("Reguler");
                              setShippingOptionOpen(false);
                            }}
                          >
                            Reguler
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onSelect={() => {
                              setShippingOption("Hemat Kargo");
                              setShippingOptionOpen(false);
                            }}
                          >
                            Hemat Kargo
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>
                </CardContent>
              )}
            </Card>

            {/* Payment Method */}
            <Card className="bg-card rounded-2xl border border-border shadow-sm backdrop-blur-sm overflow-hidden">
              <CardHeader className="p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center relative">
                    <CreditCard className="w-7 h-7 text-primary" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-foreground">
                      Payment Method
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Select how you&apos;d like to pay
                    </p>
                  </div>
                </div>
              </CardHeader>

              <div className="px-4">
                <div
                  aria-hidden
                  className="w-full rounded-full h-1"
                  style={{
                    background:
                      "linear-gradient(90deg, #dfefb5, #fff7ce, #fde7bc)",
                  }}
                />
              </div>

              <CardContent className="p-4 space-y-3">
                {[
                  {
                    id: "Manual",
                    title: "Manual Transfer",
                    subtitle: "Bank transfer (manual)",
                  },
                  {
                    id: "Gateway",
                    title: "Payment Gateway",
                    subtitle: "Fast secure payments",
                  },
                ].map((m) => {
                  const active = paymentMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setPaymentMethod(m.id)}
                      className={`w-full flex items-center gap-4 p-3 rounded-xl border transition-all text-left ${
                        active
                          ? "border-primary bg-primary/5"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 flex items-center justify-center text-sm font-semibold text-primary">
                        {m.id[0]}
                      </div>

                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <div className="font-semibold text-foreground">
                            {m.title}
                          </div>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {m.subtitle}
                        </div>
                      </div>

                      <div className="flex items-center">
                        {active ? (
                          <Check className="w-5 h-5 text-primary" />
                        ) : (
                          <div className="w-4 h-4 rounded-full border-2 border-border" />
                        )}
                      </div>
                    </button>
                  );
                })}
              </CardContent>
            </Card>

            {/* Additional Options */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Promo Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-base">
                    <Tag className="h-4 w-4 text-primary" />
                    Promo Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="promo">Enter discount code</Label>
                    <div className="flex gap-2">
                      <Input
                        id="promo"
                        placeholder="SAVE10"
                        className="flex-1"
                      />
                      <Button variant="outline">Apply</Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Special Instructions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-3 text-base">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    Special Instructions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Label htmlFor="instructions">
                      Delivery notes (optional)
                    </Label>
                    <textarea
                      id="instructions"
                      placeholder="Leave at front door, call when arriving..."
                      className="w-full px-3 py-2 border border-border rounded-md bg-background text-sm resize-none h-20 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-6">
              {/* OrderSummary renders its own Card */}
              <OrderSummary
                cart={cart}
                items={items}
                idempotencyKey={idempotencyKey}
                setIdempotencyKey={setIdempotencyKey}
                onPlaceOrder={handlePlaceOrder}
                isProcessing={createOrder.status === "pending"}
                customer={customer ?? undefined}
                address={selectedAddressFull ?? undefined}
              />
            </div>
          </div>
        </div>

        {/* Mobile Order Summary */}
        <div className="lg:hidden mt-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="h-4 w-4 text-primary" />
                </div>
                Order Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <OrderSummary
                cart={cart}
                items={items}
                idempotencyKey={idempotencyKey}
                setIdempotencyKey={setIdempotencyKey}
                onPlaceOrder={handlePlaceOrder}
                isProcessing={createOrder.status === "pending"}
                customer={customer ?? undefined}
                address={selectedAddressFull ?? undefined}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
