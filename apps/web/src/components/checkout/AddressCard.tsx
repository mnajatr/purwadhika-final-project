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

export default function AddressCard({ onSelect }: { onSelect?: (addr: { id: number }) => void }) {
  const [addrs, setAddrs] = React.useState<Addr[] | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [selectedId, setSelectedId] = React.useState<number | null>(null);

  // prevent refetching repeatedly; keep a local ref to indicate we've loaded
  // addresses once during this client session
  const loadedRef = React.useRef(false);
  React.useEffect(() => {
    if (loadedRef.current) return;
    const devUser = typeof window !== "undefined" ? localStorage.getItem("devUserId") : null;
    const storedUserId =
      typeof window !== "undefined"
        ? sessionStorage.getItem("checkout:userId")
        : null;
    // Prefer admin dev user selector (localStorage.devUserId) when set, otherwise sessionStorage, then seeded 4
    const userId = devUser && devUser !== "none" ? Number(devUser) : storedUserId ? Number(storedUserId) : 4;
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
  }, [onSelect]);

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
            {addrs.map((a) => (
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
            ))}
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
