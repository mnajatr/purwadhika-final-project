"use client";

import React from "react";
import { apiClient } from "@/lib/axios-client";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import {
  Drawer,
  DrawerTrigger,
  DrawerContent,
  DrawerHeader,
  DrawerFooter,
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
          <div className="mt-3 p-3 bg-gradient-to-r from-red-50 to-red-100/50 border border-red-200/60 rounded-xl backdrop-blur-sm">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 bg-red-100 rounded-full flex items-center justify-center">
                <svg
                  className="w-3.5 h-3.5 text-red-600"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-red-800 mb-1">
                  Outside Delivery Range
                </p>
                <p className="text-xs text-red-700">
                  Distance:{" "}
                  {info.distanceMeters
                    ? (info.distanceMeters / 1000).toFixed(1)
                    : "N/A"}{" "}
                  km
                  {info.maxRadiusKm && ` (Max: ${info.maxRadiusKm} km)`}
                </p>
              </div>
            </div>
          </div>
        )}

        {info.nearestStoreId != null &&
          info.nearestStoreId !== checkoutStoreId &&
          info.inRange && (
            <div className="mt-3 p-3 bg-gradient-to-r from-orange-50 to-orange-100/50 border border-orange-200/60 rounded-xl backdrop-blur-sm">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 w-6 h-6 bg-orange-100 rounded-full flex items-center justify-center">
                  <svg
                    className="w-3.5 h-3.5 text-orange-600"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth="2"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-xs font-semibold text-orange-800 mb-1">
                    Different Store Area
                  </p>
                  <p className="text-xs text-orange-700">
                    This address is served by a different store than your cart
                    items
                  </p>
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
                  <Button variant="default" className="w-full group">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 text-white group-hover:scale-110 transition-transform duration-200">
                        <svg
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="2"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
                          />
                        </svg>
                      </div>
                      <span>Select address</span>
                    </div>
                  </Button>
                </DrawerTrigger>
              </div>

              <DrawerContent>
                <DrawerHeader className="border-b bg-gradient-to-r from-primary/5 to-primary/10">
                  <div className="flex items-center justify-center gap-4 mb-3 w-full">
                    <div className="flex flex-col text-center">
                      <DrawerTitle className="text-xl font-semibold">
                        Choose Delivery Location
                      </DrawerTitle>
                      <DrawerDescription className="text-sm text-muted-foreground mt-1 max-w-md">
                        Select your preferred delivery address from saved
                        locations
                      </DrawerDescription>
                    </div>
                  </div>
                </DrawerHeader>

                <div className="p-4 bg-gradient-to-b from-background to-muted/20">
                  <ScrollArea className="h-[70vh] md:h-[80vh]">
                    <div className="space-y-4 p-1 pr-4 pb-44">
                      {addrs.map((a) => {
                        const info = resolveMap[a.id];
                        const disabled = isDisabled(info);
                        const isSelected = selectedId === a.id;

                        return (
                          <div
                            key={a.id}
                            className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 hover:scale-[1.005] ${
                              isSelected
                                ? "border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg"
                                : "border-border bg-card/80 backdrop-blur-sm hover:border-primary/30 hover:shadow-md"
                            } ${
                              disabled
                                ? "opacity-60 cursor-not-allowed"
                                : "cursor-pointer"
                            }`}
                            onClick={() =>
                              !disabled && handleSelectFromDrawer(a)
                            }
                          >
                            {/* Selection indicator line */}
                            {isSelected && (
                              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary rounded-r-full" />
                            )}

                            <div className="p-5">
                              <div className="flex items-start gap-4">
                                {/* Location icon */}
                                <div
                                  className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center relative transition-colors duration-200 ${
                                    isSelected
                                      ? "bg-primary/20 text-primary"
                                      : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
                                  }`}
                                >
                                  <FaMapMarkerAlt className="w-6 h-6" />
                                </div>

                                <div className="flex-1 min-w-0">
                                  {/* Header with name and badges */}
                                  <div className="flex items-center gap-2 mb-3">
                                    <h3 className="font-bold text-lg text-foreground truncate">
                                      {a.recipientName}
                                    </h3>
                                    <div className="flex gap-1">
                                      {a.isPrimary && (
                                        <Badge
                                          variant="default"
                                          className="text-xs bg-green-100 text-green-800 border-green-200"
                                        >
                                          Primary
                                        </Badge>
                                      )}
                                      {!disabled && info?.inRange && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs border-green-200 text-green-700"
                                        >
                                          Available
                                        </Badge>
                                      )}
                                    </div>
                                  </div>

                                  {/* Address details */}
                                  <div className="space-y-2 mb-3">
                                    <div className="flex items-start gap-2">
                                      <div className="w-4 h-4 mt-0.5 text-muted-foreground">
                                        <svg
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="1.5"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                                          />
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25s-7.5-4.108-7.5-11.25a7.5 7.5 0 0115 0z"
                                          />
                                        </svg>
                                      </div>
                                      <p className="text-sm text-foreground font-medium leading-relaxed">
                                        {a.addressLine}
                                      </p>
                                    </div>
                                    <div className="flex items-center gap-2 pl-6">
                                      <span className="text-sm text-muted-foreground">
                                        {a.city}, {a.province}
                                      </span>
                                      <span className="w-1 h-1 bg-muted-foreground rounded-full"></span>
                                      <span className="text-sm font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded">
                                        {a.postalCode}
                                      </span>
                                    </div>
                                  </div>

                                  {/* Distance info if available */}
                                  {info?.distanceMeters && (
                                    <div className="flex items-center gap-2 pl-6 mb-3">
                                      <div className="w-3 h-3 text-blue-500">
                                        <svg
                                          viewBox="0 0 24 24"
                                          fill="none"
                                          stroke="currentColor"
                                          strokeWidth="2"
                                        >
                                          <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m-6 3l6-3"
                                          />
                                        </svg>
                                      </div>
                                      <span className="text-xs text-blue-600 font-medium">
                                        ~
                                        {(info.distanceMeters / 1000).toFixed(
                                          1
                                        )}{" "}
                                        km away
                                      </span>
                                    </div>
                                  )}

                                  <ValidationWarnings info={info} />
                                </div>

                                {/* Selection indicator */}
                                <div className="flex-shrink-0 flex items-center">
                                  {isSelected ? (
                                    <div className="w-6 h-6 bg-primary rounded-full flex items-center justify-center">
                                      <CheckCircle className="w-4 h-4 text-white" />
                                    </div>
                                  ) : (
                                    <div className="w-6 h-6 border-2 border-muted-foreground/30 rounded-full group-hover:border-primary/50 transition-colors duration-200" />
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Hover effect overlay */}
                            {!disabled && (
                              <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none" />
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </ScrollArea>

                  <DrawerFooter className="mt-4">
                    <div className="w-full flex flex-col gap-2">
                      <Button
                        variant="default"
                        className="w-full"
                        onClick={() =>
                          (window.location.href = "/profile/addresses")
                        }
                      >
                        Add New Address
                      </Button>

                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full"
                        onClick={() =>
                          (window.location.href = "/profile/addresses")
                        }
                      >
                        Manage saved addresses
                      </Button>
                    </div>
                  </DrawerFooter>
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
