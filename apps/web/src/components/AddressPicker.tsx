"use client";

import React from "react";
import { apiClient } from "@/lib/axios-client";
import useLocationStore from "@/stores/locationStore";
import { useQueryClient } from "@tanstack/react-query";

type Addr = {
  id: number;
  recipientName: string;
  addressLine: string;
  province: string;
  city: string;
  postalCode: string;
  latitude: number;
  longitude: number;
  isPrimary: boolean;
};

type ResolveResp = {
  success: boolean;
  nearestStore: { id: number; name?: string } | null;
  message?: string;
};

export default function AddressPicker({ userId }: { userId?: number }) {
  const [addrs, setAddrs] = React.useState<Addr[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);
  const setActiveAddress = useLocationStore((s) => s.setActiveAddress);
  const setNearestStoreId = useLocationStore((s) => s.setNearestStoreId);
  const setNearestStoreName = useLocationStore((s) => s.setNearestStoreName);
  const queryClient = useQueryClient();

  const handleSelectCb = React.useCallback(
    async (a: Addr, callResolve = true) => {
      setSelectedId(a.id);
      setActiveAddress({ id: a.id, addressLine: a.addressLine });
      if (!callResolve) return;
      try {
        const devUser =
          typeof window !== "undefined"
            ? localStorage.getItem("devUserId")
            : null;
        const storedUserId =
          typeof window !== "undefined"
            ? sessionStorage.getItem("checkout:userId")
            : null;
        // Prefer admin dev user selector (localStorage.devUserId) when set, otherwise sessionStorage, then seeded 4
        const uid =
          userId ??
          (devUser && devUser !== "none"
            ? Number(devUser)
            : storedUserId
            ? Number(storedUserId)
            : 4);
        const resp = await apiClient.get<ResolveResp>(
          `/stores/resolve?userId=${uid}&addressId=${a.id}`
        );
        // Backend sometimes returns { success: true, data: { nearestStore } }
        // and some endpoints return { nearestStore } directly. Handle both shapes.
        type RespShapeA = {
          data: {
            nearestStore: { id: number; name?: string } | null;
            message?: string;
          };
        };
        type RespShapeB = {
          nearestStore: { id: number; name?: string } | null;
          message?: string;
        };
        const r = resp as unknown as RespShapeA | RespShapeB;
        const store =
          (r as RespShapeA).data?.nearestStore ??
          (r as RespShapeB).nearestStore ??
          null;
        // DEBUG: log resolve response and store
        try {
          console.debug(
            "/stores/resolve response:",
            r,
            "resolved store:",
            store
          );
        } catch {}
        setNearestStoreId(store?.id ?? null);
        setNearestStoreName(store?.name ?? null);
        // Force refetch of products so UI will request with the new storeId
        try {
          if (store?.id) {
            // Invalidate both the generic products queries and the specific keyed query
            queryClient.invalidateQueries({ queryKey: ["products", store.id] });
            queryClient.invalidateQueries({ queryKey: ["products"] });
            // Also immediately refetch the products query for the new store so UI updates without waiting for background refetch
            queryClient.refetchQueries({ queryKey: ["products", store.id] });
          } else {
            queryClient.invalidateQueries({ queryKey: ["products"] });
            queryClient.refetchQueries({ queryKey: ["products"] });
          }
        } catch {}
        try {
          if (typeof window !== "undefined") {
            if (store?.id)
              localStorage.setItem("nearestStoreId", String(store.id));
            else localStorage.removeItem("nearestStoreId");
            if (store?.name)
              localStorage.setItem("nearestStoreName", store.name);
            else localStorage.removeItem("nearestStoreName");
            console.debug(
              "locationStore updated: nearestStoreId=",
              localStorage.getItem("nearestStoreId"),
              "nearestStoreName=",
              localStorage.getItem("nearestStoreName")
            );
          }
        } catch {}
      } catch (err) {
        console.error("Failed to resolve nearest store", err);
        setNearestStoreId(null);
        setNearestStoreName(null);
      }
    },
    [
      setActiveAddress,
      setNearestStoreId,
      setNearestStoreName,
      userId,
      queryClient,
    ]
  );

  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const devUser =
          typeof window !== "undefined"
            ? localStorage.getItem("devUserId")
            : null;
        const storedUserId =
          typeof window !== "undefined"
            ? sessionStorage.getItem("checkout:userId")
            : null;
        // Prefer admin dev user selector (localStorage.devUserId) when set, otherwise sessionStorage, then seeded 4
        const uid =
          userId ??
          (devUser && devUser !== "none"
            ? Number(devUser)
            : storedUserId
            ? Number(storedUserId)
            : 4);
        const res = await apiClient.get<Addr[]>(`/users/${uid}/addresses`);
        if (!mounted) return;
        setAddrs(res);
        const primary = res.find((a) => a.isPrimary) ?? res[0];
        if (primary) {
          setSelectedId(primary.id);
          await handleSelectCb(primary, true);
        }
      } catch {
        setAddrs([]);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId, handleSelectCb]);

  // delegate to stable callback
  const handleSelect = handleSelectCb;

  if (loading) return <div>Loading addresses…</div>;

  return (
    <div className="space-y-3">
      {addrs && addrs.length > 0 ? (
        addrs.map((a) => (
          <label
            key={a.id}
            className="block cursor-pointer p-3 border rounded-md"
          >
            <input
              type="radio"
              name="address"
              checked={selectedId === a.id}
              onChange={() => handleSelect(a)}
              className="mr-2"
            />
            <span className="font-medium">{a.recipientName}</span>
            <div className="text-xs">{a.addressLine}</div>
            <div className="text-xs">
              {a.city}, {a.province} {a.postalCode}
            </div>
          </label>
        ))
      ) : (
        <div>
          No saved addresses. Add one in your profile or proceed with default
          address.
        </div>
      )}
    </div>
  );
}
