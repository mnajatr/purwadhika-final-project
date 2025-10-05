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
import { MapPin, CheckCircle, Settings } from "lucide-react";
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
  checkoutStoreId?: number | null;
  userId?: number;
};

export default function AddressCard({
  onSelect,
  checkoutStoreId,
  userId,
}: AddressCardProps) {
  const [addrs, setAddrs] = React.useState<Addr[] | null>(null);

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

  const loadedRef = React.useRef(false);
  React.useEffect(() => {
    if (loadedRef.current) return;
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
    let mounted = true;
    (async () => {
      try {
        const res = await apiClient.get<Addr[]>(`/users/${userId}/addresses`);
        if (!mounted) return;
        setAddrs(res);
        
        // Auto-select address logic
        if (checkoutStoreId && Array.isArray(res) && res.length > 0) {
          // Resolve all addresses first
          const map: Record<number, ResolveInfo> = {};
          for (const a of res) {
            try {
              const uid = userId ?? 4;
              const rr = await apiClient.get(
                `/stores/resolve?userId=${uid}&addressId=${a.id}`
              );
              const data = (rr as Record<string, unknown>) ?? {};
              const nestedData =
                (data.data as Record<string, unknown>) ?? data;
              map[a.id] = {
                inRange: Boolean(nestedData.inRange ?? data.inRange),
                distanceMeters:
                  (data.distanceMeters as number) ??
                  (nestedData.distanceMeters as number) ??
                  null,
                maxRadiusKm:
                  (data.maxRadiusKm as number) ??
                  (nestedData.maxRadiusKm as number) ??
                  null,
                nearestStoreId:
                  ((data.nearestStore as Record<string, unknown>)
                    ?.id as number) ??
                  ((nestedData.nearestStore as Record<string, unknown>)
                    ?.id as number) ??
                  null,
              } as ResolveInfo;
            } catch {
              map[a.id] = { inRange: false };
            }
          }
          setResolveMap(map);
          
          // Find best address to auto-select
          const inRangeAddrs = res.filter((a) => {
            const info = map[a.id];
            return info ? info.inRange && (!info.nearestStoreId || info.nearestStoreId === checkoutStoreId) : false;
          });
          
          let selectedAddr: Addr | null = null;
          
          // Try primary address if in range
          const primaryInRange = inRangeAddrs.find((a) => a.isPrimary);
          if (primaryInRange) {
            selectedAddr = primaryInRange;
          } else if (inRangeAddrs.length > 0) {
            // Otherwise select first in range
            selectedAddr = inRangeAddrs[0];
          } else {
            // Fallback to primary or first address even if out of range
            selectedAddr = res.find((a) => a.isPrimary) ?? res[0];
          }
          
          if (selectedAddr) {
            setSelectedId(selectedAddr.id);
            onSelect?.({ id: selectedAddr.id });
          }
        } else {
          // No checkout context, just select primary or first
          const primary = res.find((a) => a.isPrimary) ?? res[0];
          if (primary) {
            setSelectedId(primary.id);
            onSelect?.({ id: primary.id });
          }
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

  const isDisabled = (info?: ResolveInfo | null) =>
    Boolean(
      checkoutStoreId &&
        info &&
        (!info.inRange ||
          (info.nearestStoreId != null &&
            info.nearestStoreId !== checkoutStoreId))
    );

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
                    Outside current delivery range
                  </p>
                </div>
              </div>
            </div>
          )}
      </>
    );
  };

  const primaryAddress = React.useMemo(() => {
    if (selectedId != null && addrs) {
      const found = addrs.find((x) => x.id === selectedId);
      if (found) return found;
    }
    if (!addrs || addrs.length === 0) return null;
    
    // If checkout context, try to auto-select address within range
    if (checkoutStoreId) {
      const inRangeAddrs = addrs.filter((a) => {
        const info = resolveMap[a.id];
        return info ? info.inRange && (!info.nearestStoreId || info.nearestStoreId === checkoutStoreId) : false;
      });
      
      // Try to get primary from in-range addresses
      const primInRange = inRangeAddrs.find((x) => x.isPrimary);
      if (primInRange) return primInRange;
      
      // Otherwise return first in-range address
      if (inRangeAddrs.length > 0) return inRangeAddrs[0];
    }
    
    // Fallback to any primary or first address
    const prim = addrs.find((x) => x.isPrimary);
    if (prim) return prim;
    return addrs[0];
  }, [addrs, resolveMap, checkoutStoreId, selectedId]);

  // Count addresses within range for display
  const inRangeCount = React.useMemo(() => {
    if (!addrs || addrs.length === 0 || !checkoutStoreId) return 0;
    return addrs.filter((a) => {
      const info = resolveMap[a.id];
      return info ? info.inRange && (!info.nearestStoreId || info.nearestStoreId === checkoutStoreId) : false;
    }).length;
  }, [addrs, resolveMap, checkoutStoreId]);

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

              <DrawerContent className="max-h-[95vh]">
                <DrawerHeader className="border-b bg-gradient-to-r from-primary/5 via-primary/10 to-primary/5 backdrop-blur-sm">
                  <div className="flex items-center justify-center gap-4 mb-3 w-full">
                    <div className="flex flex-col text-center">
                      <div className="flex items-center justify-center gap-2 mb-2">
                        <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                          <FaMapMarkerAlt className="w-4 h-4 text-primary" />
                        </div>
                        <DrawerTitle className="text-xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                          Choose Delivery Location
                        </DrawerTitle>
                      </div>
                      <DrawerDescription className="text-sm text-muted-foreground mt-1 max-w-md">
                        {checkoutStoreId 
                          ? (
                            <span className="flex items-center justify-center gap-1.5">
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                                <CheckCircle className="w-3 h-3" />
                                {inRangeCount} available
                              </span>
                              <span>within delivery range</span>
                            </span>
                          )
                          : "Select your preferred delivery address from saved locations"
                        }
                      </DrawerDescription>
                    </div>
                  </div>
                </DrawerHeader>

                <div className="p-6 bg-gradient-to-b from-background via-muted/10 to-muted/20">
                  <ScrollArea className="h-[70vh] md:h-[75vh]">
                    {!addrs || addrs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                        <div className="relative mb-6">
                          <div className="w-24 h-24 bg-gradient-to-br from-muted via-muted/80 to-muted/60 rounded-3xl flex items-center justify-center shadow-lg">
                            <MapPin className="w-12 h-12 text-muted-foreground/70" />
                          </div>
                          <div className="absolute -top-1 -right-1 w-8 h-8 bg-red-100 rounded-full flex items-center justify-center border-2 border-background shadow-md">
                            <svg className="w-4 h-4 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </div>
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-2">
                          No Saved Addresses
                        </h3>
                        <p className="text-sm text-muted-foreground mb-3 max-w-sm leading-relaxed">
                          You haven&apos;t saved any delivery addresses yet.
                        </p>
                        <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-50 border border-blue-200 text-blue-700 text-xs font-medium mb-6">
                          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span>Add an address to continue checkout</span>
                        </div>
                        <Button
                          variant="default"
                          size="lg"
                          className="shadow-lg"
                          onClick={() => (window.location.href = "/profile/addresses")}
                        >
                          <MapPin className="w-4 h-4 mr-2" />
                          Add New Address
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-4 p-1 pr-4 pb-44">
                        {addrs.map((a) => {
                        const info = resolveMap[a.id];
                        const disabled = isDisabled(info);
                        const isSelected = selectedId === a.id;
                        const isInRange = info?.inRange && (!info.nearestStoreId || info.nearestStoreId === checkoutStoreId);

                        return (
                          <div
                            key={a.id}
                            className={`group relative overflow-hidden rounded-2xl border-2 transition-all duration-300 ${
                              disabled 
                                ? "border-red-200/60 bg-red-50/30 opacity-75" 
                                : isSelected
                                ? "border-primary bg-gradient-to-br from-primary/10 via-primary/5 to-transparent shadow-lg hover:scale-[1.005]"
                                : "border-border bg-card/80 backdrop-blur-sm hover:border-primary/30 hover:shadow-md hover:scale-[1.005]"
                            } ${
                              disabled
                                ? "cursor-not-allowed"
                                : "cursor-pointer"
                            }`}
                            onClick={() =>
                              !disabled && handleSelectFromDrawer(a)
                            }
                          >

                            {/* Selection indicator line */}
                            {isSelected && !disabled && (
                              <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-gradient-to-b from-primary via-primary to-primary/70 rounded-r-full shadow-sm" />
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
                                  <div className="flex items-center gap-2 mb-3 flex-wrap">
                                    <h3 className="font-bold text-lg text-foreground truncate">
                                      {a.recipientName}
                                    </h3>
                                    <div className="flex gap-1.5 flex-wrap">
                                      {a.isPrimary && (
                                        <Badge
                                          variant="default"
                                          className="text-xs bg-blue-100 text-blue-800 border-blue-200"
                                        >
                                          Primary
                                        </Badge>
                                      )}
                                      {!disabled && isInRange && (
                                        <Badge
                                          variant="outline"
                                          className="text-xs border-green-300 bg-green-50 text-green-700 font-semibold"
                                        >
                                          ✓ In Range
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

                                  {/* Distance display removed in drawer per UX request */}

                                  {/* Show validation warnings only if disabled */}
                                  {disabled && <ValidationWarnings info={info} />}
                                </div>

                                {/* Selection indicator */}
                                <div className="flex-shrink-0 flex items-center">
                                  {isSelected && !disabled ? (
                                    <div className="w-7 h-7 bg-primary rounded-full flex items-center justify-center shadow-md">
                                      <CheckCircle className="w-5 h-5 text-white" />
                                    </div>
                                  ) : disabled ? (
                                    <div className="w-7 h-7 border-2 border-red-300 bg-red-50 rounded-full flex items-center justify-center">
                                      <svg className="w-4 h-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2.5">
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                                      </svg>
                                    </div>
                                  ) : (
                                    <div className="w-7 h-7 border-2 border-muted-foreground/30 rounded-full group-hover:border-primary/50 transition-colors duration-200" />
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
                    )}
                  </ScrollArea>

                  <DrawerFooter className="mt-4 border-t bg-card/50 backdrop-blur-sm">
                    <div className="w-full flex flex-col gap-3">
                      <Button
                        variant="default"
                        size="lg"
                        className="w-full shadow-md hover:shadow-lg transition-shadow"
                        onClick={() =>
                          (window.location.href = "/profile/addresses")
                        }
                      >
                        <MapPin className="w-4 h-4 mr-2" />
                        Add New Address
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full border-border/50 hover:border-primary/30 hover:bg-primary/5"
                        onClick={() =>
                          (window.location.href = "/profile/addresses")
                        }
                      >
                        <Settings className="w-3.5 h-3.5 mr-2" />
                        Manage Saved Addresses
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
