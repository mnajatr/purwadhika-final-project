"use client";

import React from "react";
import { apiClient } from "@/lib/axios-client";

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

export default function AddressCard({ onSelect, checkoutStoreId, userId }: AddressCardProps) {
  const [addrs, setAddrs] = React.useState<Addr[] | null>(null);
  // per-address resolve info: map addressId -> { inRange, distanceMeters, maxRadiusKm, nearestStoreId }
  type ResolveInfo = {
    inRange: boolean;
    distanceMeters?: number | null;
    maxRadiusKm?: number | null;
    nearestStoreId?: number | null;
  };
  const [resolveMap, setResolveMap] = React.useState<Record<number, ResolveInfo>>({});
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);

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
                const rr = await apiClient.get(`/stores/resolve?userId=${uid}&addressId=${a.id}`);
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const data: any = rr ?? {};
                map[a.id] = {
                  inRange: Boolean(data.inRange ?? data.data?.inRange),
                  distanceMeters: data.distanceMeters ?? data.data?.distanceMeters ?? null,
                  maxRadiusKm: data.maxRadiusKm ?? data.data?.maxRadiusKm ?? null,
                  nearestStoreId: data.nearestStore?.id ?? data.data?.nearestStore?.id ?? null,
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

  return (
    <section className="bg-white border rounded-lg p-0 mb-6 shadow-sm overflow-hidden">
      <div className="bg-rose-50 p-4 flex items-center gap-3">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="w-6 h-6 text-rose-600"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10l1.5-2 3 4 4-6 6 8"
          />
        </svg>
        <div>
          <div className="text-sm font-semibold">Delivery Address</div>
          <div className="text-xs text-muted-foreground">
            Select from your saved addresses
          </div>
        </div>
      </div>

      <div className="p-4 text-sm text-muted-foreground">
        {loading ? (
          <div>Loading addresses…</div>
        ) : addrs && addrs.length > 0 ? (
          <div className="space-y-3">
            {addrs.map((a) => {
              const info = resolveMap[a.id];
              const disabled = Boolean(
                checkoutStoreId &&
                  info &&
                  (!info.inRange || (info.nearestStoreId != null && info.nearestStoreId !== checkoutStoreId))
              );
              return (
                <label
                  key={a.id}
                  className={`block ${disabled ? "opacity-50" : "cursor-pointer"} p-3 border rounded-md`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={selectedId === a.id}
                    onChange={() => !disabled && handleSelect(a)}
                    disabled={disabled}
                    className="mr-2"
                  />
                  <span className="font-medium">{a.recipientName}</span>
                  <div className="text-xs">{a.addressLine}</div>
                  <div className="text-xs">
                    {a.city}, {a.province} {a.postalCode}
                  </div>
                  {info && !info.inRange ? (
                    <div className="text-xs text-rose-600 mt-1">
                      Out of delivery range: {info.distanceMeters ? (info.distanceMeters / 1000).toFixed(1) : "N/A"} km (limit {info.maxRadiusKm ?? "N/A"} km)
                    </div>
                  ) : info && info.nearestStoreId != null && info.nearestStoreId !== checkoutStoreId ? (
                    <div className="text-xs text-rose-600 mt-1">Not served by selected store</div>
                  ) : null}
                </label>
              );
            })}
          </div>
        ) : (
          <div>
            No saved addresses. Add one in your profile or proceed with default
            address.
          </div>
        )}
      </div>
    </section>
  );
}
