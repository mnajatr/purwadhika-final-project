"use client";

import React from "react";
import { apiClient } from "@/lib/axios-client";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
} from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MapPin, CheckCircle } from "lucide-react";
import { FaMapMarkerAlt } from "react-icons/fa";

type Addr = {
  id: number;
  recipientName: string;
  addressLine: string;
  province: string;
  city: string;
  postalCode: string;
  isPrimary: boolean;
};

type AddressCardProps = {
  onSelect?: (addr: { id: number }) => void;
  // If provided, component will validate each address against this store id
  // and disable addresses that are out-of-range or served by a different store.
  checkoutStoreId?: number | null;
  userId?: number;
};

export default function AddressCard({
  onSelect,
  checkoutStoreId,
  userId,
}: AddressCardProps) {
  const [addrs, setAddrs] = React.useState<Addr[] | null>(null);
  // per-address resolve info: map addressId -> { inRange, distanceMeters, maxRadiusKm, nearestStoreId }
  type ResolveInfo = {
    inRange: boolean;
    distanceMeters?: number | null;
    maxRadiusKm?: number | null;
    nearestStoreId?: number | null;
  };
  const [resolveMap, setResolveMap] = React.useState<
    Record<number, ResolveInfo>
  >({});
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const [drawerOpen, setDrawerOpen] = React.useState(false);

  // prevent refetching repeatedly; keep a local ref to indicate we've loaded
  // addresses once during this client session
  const loadedRef = React.useRef(false);
  React.useEffect(() => {
    if (loadedRef.current) return;
    const devUser =
      typeof window !== "undefined" ? localStorage.getItem("devUserId") : null;
    const storedUserId =
      typeof window !== "undefined"
        ? sessionStorage.getItem("checkout:userId")
        : null;
    // Prefer admin dev user selector (localStorage.devUserId) when set, otherwise sessionStorage, then seeded 4
    const userId =
      devUser && devUser !== "none"
        ? Number(devUser)
        : storedUserId
        ? Number(storedUserId)
        : 4;
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get<Addr[]>(`/users/${userId}/addresses`);
        if (!mounted) return;
        setAddrs(res);
        const primary = res.find((a) => a.isPrimary) ?? res[0];
        if (primary) {
          setSelectedId(primary.id);
          onSelect?.({ id: primary.id });
        }
        // If checkoutStoreId is provided, resolve each address's coverage status
        if (checkoutStoreId && Array.isArray(res) && res.length > 0) {
          (async () => {
            const map: Record<number, ResolveInfo> = {};
            for (const a of res) {
              try {
                const uid = userId ?? 4;
                // apiClient.get returns the response data directly in this project
                const rr = await apiClient.get(
                  `/stores/resolve?userId=${uid}&addressId=${a.id}`
                );
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data: any = rr ?? {};
                map[a.id] = {
                  inRange: Boolean(data.inRange ?? data.data?.inRange),
                  distanceMeters:
                    data.distanceMeters ?? data.data?.distanceMeters ?? null,
                  maxRadiusKm:
                    data.maxRadiusKm ?? data.data?.maxRadiusKm ?? null,
                  nearestStoreId:
                    data.nearestStore?.id ??
                    data.data?.nearestStore?.id ??
                    null,
                } as ResolveInfo;
              } catch {
                // fallback: mark as out-of-range on any error
                map[a.id] = { inRange: false };
              }
            }
            setResolveMap(map);
          })();
        }
      } catch {
        setAddrs([]);
      } finally {
        if (mounted) setLoading(false);
        loadedRef.current = true;
      }
    })();
    return () => {
      mounted = false;
    };
  }, [onSelect, checkoutStoreId, userId]);

  const handleSelect = (a: Addr) => {
    setSelectedId(a.id);
    onSelect?.({ id: a.id });
  };

  const handleSelectFromDrawer = (a: Addr) => {
    setSelectedId(a.id);
    onSelect?.({ id: a.id });
    setDrawerOpen(false);
  };

  // helper: whether an address should be treated as disabled based on resolve info
  const isDisabled = (info?: ResolveInfo | null) =>
    Boolean(
      checkoutStoreId &&
        info &&
        (!info.inRange ||
          (info.nearestStoreId != null &&
            info.nearestStoreId !== checkoutStoreId))
    );

  // small subcomponent to render the validation warnings (red/orange boxes)
  const ValidationWarnings = ({ info }: { info?: ResolveInfo | null }) => {
    if (!info) return null;

    return (
      <>
        {!info.inRange && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                className="w-4 h-4 text-red-500 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="text-xs text-red-700">
                Outside delivery range:{" "}
                {info.distanceMeters
                  ? (info.distanceMeters / 1000).toFixed(1)
                  : "N/A"}{" "}
                km (limit {info.maxRadiusKm ?? "N/A"} km)
              </div>
            </div>
          </div>
        )}

        {info.nearestStoreId != null &&
          info.nearestStoreId !== checkoutStoreId &&
          info.inRange && (
            <div className="mt-2 p-2 bg-orange-50 border border-orange-200 rounded-lg">
              <div className="flex items-center gap-2">
                <svg
                  className="w-4 h-4 text-orange-500 flex-shrink-0"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="text-xs text-orange-700">
                  Served by different store than your cart items
                </div>
              </div>
            </div>
          )}
      </>
    );
  };

  // helper: choose which address to render in the compact card
  const primaryAddress = React.useMemo(() => {
    // prefer explicit selection made by user in this component
    if (selectedId != null && addrs) {
      const found = addrs.find((x) => x.id === selectedId);
      if (found) return found;
    }
    if (!addrs || addrs.length === 0) return null;
    const prim = addrs.find((x) => x.isPrimary);
    if (prim) return prim;
    // fallback: pick first in-range address if checkoutStoreId provided
    if (checkoutStoreId) {
      const inRange = addrs.find((a) => {
        const info = resolveMap[a.id];
        return info ? info.inRange : true;
      });
      if (inRange) return inRange;
    }
    return addrs[0];
  }, [addrs, resolveMap, checkoutStoreId, selectedId]);

  return (
    <Card className="bg-card rounded-2xl border border-border shadow-sm backdrop-blur-sm overflow-hidden">
      <CardHeader className="p-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center relative">
            <FaMapMarkerAlt className="w-7 h-7 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-foreground">
              Shipping Address
            </h3>
            <p className="text-sm text-muted-foreground">
              Select your delivery location
            </p>
          </div>
        </div>
      </CardHeader>

      {/* full-width gradient separator between header and content */}
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
        {loading ? (
          <div className="flex items-center gap-3 text-muted-foreground">
            <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
            Loading addresses...
          </div>
        ) : addrs && addrs.length > 0 ? (
          <div className="space-y-4">
            {/* Render only the primary/selected address in the compact card */}
            {primaryAddress &&
              (() => {
                const a = primaryAddress;
                const info = resolveMap[a.id];
                const disabled = isDisabled(info);

                return (
                  <div
                    key={a.id}
                    onClick={() => !disabled && handleSelect(a)}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                      selectedId === a.id
                        ? "border-primary bg-primary/5"
                        : "border-border bg-muted/20"
                    } ${
                      disabled
                        ? "opacity-50 cursor-not-allowed"
                        : "cursor-pointer"
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <span className="font-semibold text-foreground">
                            {a.recipientName}
                          </span>
                          {a.isPrimary && (
                            <Badge variant="secondary" className="text-xs">
                              Primary
                            </Badge>
                          )}
                        </div>

                        <div className="text-sm text-muted-foreground space-y-1">
                          <p>{a.addressLine}</p>
                          <p>
                            {a.city}, {a.province} {a.postalCode}
                          </p>
                        </div>

                        <ValidationWarnings info={info} />
                      </div>

                      {selectedId === a.id && (
                        <div className="flex items-center justify-center">
                          <CheckCircle className="w-5 h-5 text-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                );
              })()}

            {/* Drawer trigger to select other addresses */}
            <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
              <div className="pt-2">
                <DrawerTrigger asChild>
                  <Button variant="default" className="w-full">
                    Select address
                  </Button>
                </DrawerTrigger>
              </div>

              <DrawerContent>
                <DrawerHeader>
                  <DrawerTitle>Choose delivery address</DrawerTitle>
                  <DrawerDescription>
                    Select from your saved addresses. Disabled addresses are
                    outside the service area.
                  </DrawerDescription>
                </DrawerHeader>

                <div className="p-4">
                  <ScrollArea className="h-[56vh]">
                    <div className="space-y-3 p-2 pr-4">
                      {addrs.map((a) => {
                        const info = resolveMap[a.id];
                        const disabled = isDisabled(info);
                        return (
                          <div
                            key={a.id}
                            className={`p-3 rounded-lg border ${
                              selectedId === a.id
                                ? "border-primary bg-primary/5"
                                : "border-border bg-card"
                            } ${
                              disabled
                                ? "opacity-50 cursor-not-allowed"
                                : "cursor-pointer"
                            }`}
                            onClick={() =>
                              !disabled && handleSelectFromDrawer(a)
                            }
                          >
                            <div className="flex items-start gap-3">
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <div className="font-semibold">
                                    {a.recipientName}
                                  </div>
                                  {a.isPrimary && (
                                    <Badge
                                      variant="secondary"
                                      className="text-xs"
                                    >
                                      Primary
                                    </Badge>
                                  )}
                                </div>

                                <div className="text-sm text-muted-foreground space-y-1">
                                  <p>{a.addressLine}</p>
                                  <p>
                                    {a.city}, {a.province} {a.postalCode}
                                  </p>
                                </div>

                                <ValidationWarnings info={info} />
                              </div>

                              <div className="flex items-center">
                                {selectedId === a.id && (
                                  <CheckCircle className="w-5 h-5 text-primary" />
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>
                </div>
              </DrawerContent>
            </Drawer>
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-4 relative">
              <MapPin
                className="w-8 h-8 text-muted-foreground"
                fill="currentColor"
                stroke="none"
              />
              <svg
                viewBox="0 0 24 24"
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.2}
                aria-hidden
              >
                <circle cx="12" cy="9" r="2.5" />
              </svg>
            </div>
            <h4 className="font-medium text-foreground mb-2">
              No addresses saved
            </h4>
            <p className="text-sm text-muted-foreground">
              Add an address in your profile to continue
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
