"use client";

import React from "react";
import { useCart } from "@/hooks/useCart";
import useCreateOrder from "@/hooks/useOrder";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import AddressCard from "@/components/checkout/AddressCard";
import ItemsList from "@/components/checkout/ItemsList";
import OrderSummary from "@/components/checkout/OrderSummary";
import { toast } from "sonner";
import { useQuery } from "@tanstack/react-query";
import usersService from "@/services/users.service";
import useLocationStore from "@/stores/locationStore";
import apiClient from "@/lib/axios-client";

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
  const storeId = 1;
  const { data: cart, isLoading } = useCart(userId, storeId);
  // do not pass storeId to createOrder so backend can resolve nearest store
  const createOrder = useCreateOrder(userId);

  const [idempotencyKey, setIdempotencyKey] = React.useState<string | null>(
    null
  );

  // selected address from AddressCard (id only)
  const [selectedAddress, setSelectedAddress] = React.useState<{
    id: number;
  } | null>(null);

  // stable callback to pass to AddressCard to avoid re-creating the function
  // each render which caused AddressCard.useEffect to re-run and refetch.
  const handleSelectAddress = React.useCallback(
    (a: { id: number }) => setSelectedAddress(a),
    []
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

  if (isLoading) return <div>Loading...</div>;
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

      // Validate against nearest store in global state (if present)
      const nearestStoreId = useLocationStore.getState().nearestStoreId;
      if (nearestStoreId) {
        if (!addressId) {
          toast.error("Please select an address");
          return;
        }
        const resp = await apiClient.get<{
          success: boolean;
          data: { nearestStore: { id: number } | null };
        }>(`/stores/resolve?userId=${userId}&addressId=${addressId}`);
        const resolved = resp.data?.nearestStore?.id ?? null;
        if (!resolved) {
          toast.error("Selected address is outside service area for any store");
          return;
        }
        if (resolved !== nearestStoreId) {
          toast.error(
            "Selected address is not served by the chosen store. Please pick an address within the store's delivery area."
          );
          return;
        }
      }

      await createOrder.mutateAsync({
        items,
        idempotencyKey: key,
        addressId,
      });
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
    <div className="max-w-6xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Checkout</h1>

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8">
        <div>
          <AddressCard onSelect={handleSelectAddress} />
          <ItemsList cart={cart} selectedIds={selectedIds} userId={userId} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Card className="relative overflow-hidden shadow-sm rounded-lg">
              <CardHeader className="p-0">
                <div className="absolute top-0 left-0 right-0 bg-indigo-50 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-indigo-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 3h18v4H3zM6 11h12l-1.5 9H7.5L6 11z"
                      />
                    </svg>
                    <CardTitle className="text-sm">Shipping</CardTitle>
                  </div>
                  <div className="text-xs text-muted-foreground">Fastest</div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-12">
                <select className="input input-bordered w-full">
                  <option value="">Select Shipping Courier</option>
                  <option value="jne">JNE</option>
                  <option value="tiki">TIKI</option>
                  <option value="sicepat">SiCepat</option>
                </select>
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden shadow-sm rounded-lg">
              <CardHeader className="p-0">
                <div className="absolute top-0 left-0 right-0 bg-rose-50 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-rose-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 14l2-2 4 4M7 7h10M7 11h4"
                      />
                    </svg>
                    <CardTitle className="text-sm">Discount Coupon</CardTitle>
                  </div>
                  <div className="text-xs text-muted-foreground">Save</div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-12">
                <div className="text-sm text-muted-foreground mb-2">
                  Use discount codes to save more.
                </div>
                <div className="flex gap-2">
                  <input
                    className="flex-1 input input-bordered border-gray-200 rounded-md"
                    placeholder="Enter coupon code"
                  />
                  <Button size="sm">Use Voucher</Button>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            <Card className="relative overflow-hidden shadow-sm rounded-lg">
              <CardHeader className="p-0">
                <div className="absolute top-0 left-0 right-0 bg-yellow-50 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-yellow-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4l3 3"
                      />
                    </svg>
                    <CardTitle className="text-sm">Note</CardTitle>
                  </div>
                  <div className="text-xs text-muted-foreground">Optional</div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-12">
                <textarea
                  className="input input-bordered w-full h-20 border-gray-200 rounded-md"
                  placeholder="Add a note for your order"
                />
              </CardContent>
            </Card>

            <Card className="relative overflow-hidden shadow-sm rounded-lg">
              <CardHeader className="p-0">
                <div className="absolute top-0 left-0 right-0 bg-green-50 p-2 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="w-5 h-5 text-green-600"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M3 10h4l3 8 4-16 3 8h4"
                      />
                    </svg>
                    <CardTitle className="text-sm">Choose Payment</CardTitle>
                  </div>
                  <div className="text-xs text-muted-foreground">Secure</div>
                </div>
              </CardHeader>
              <CardContent className="p-4 pt-12">
                <select className="input input-bordered w-full border-gray-200 rounded-md">
                  <option value="">Select Payment</option>
                  <option value="manual">Manual</option>
                  <option value="payment_gateway">Payment Gateway</option>
                </select>
              </CardContent>
            </Card>
          </div>

          {/* Place Order button moved to OrderSummary component (right column) */}
        </div>

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
  );
}
