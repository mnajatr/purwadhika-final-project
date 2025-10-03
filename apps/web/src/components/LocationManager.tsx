"use client";

import React from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { apiClient } from "@/lib/axios-client";
import useLocationStore from "@/stores/locationStore";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, Loader2, AlertCircle } from "lucide-react";

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
  data: {
    nearestStore: { id: number; name?: string } | null;
    distanceMeters?: number;
    maxRadiusKm?: number;
    inRange?: boolean;
    message?: string;
  };
};

interface LocationManagerProps {
  userId?: number;
}

export default function LocationManager({ userId }: LocationManagerProps) {
  const { latitude, longitude, error: geoError, loading: geoLoading } = useGeolocation();
  const [addrs, setAddrs] = React.useState<Addr[] | null>(null);
  const [loadingAddrs, setLoadingAddrs] = React.useState(true);
  const [selectedAddressId, setSelectedAddressId] = React.useState<number | null>(null);
  const [resolving, setResolving] = React.useState(false);
  const [useGeo, setUseGeo] = React.useState(true); // Start with geolocation by default
  
  const setActiveAddress = useLocationStore((s) => s.setActiveAddress);
  const setNearestStoreId = useLocationStore((s) => s.setNearestStoreId);
  const setNearestStoreName = useLocationStore((s) => s.setNearestStoreName);
  const queryClient = useQueryClient();

  // Resolve nearest store using coordinates
  const resolveByCoordinates = React.useCallback(
    async (lat: number, lon: number) => {
      setResolving(true);
      try {
        const resp = await apiClient.get<ResolveResp>(
          `/stores/resolve?lat=${lat}&lon=${lon}`
        );
        
        const store = resp.data?.nearestStore ?? null;
        const distanceMeters = resp.data?.distanceMeters;
        const inRange = resp.data?.inRange;

        console.debug("Resolved by coordinates:", { store, distanceMeters, inRange });

        if (store && inRange) {
          setNearestStoreId(store.id);
          setNearestStoreName(store.name ?? null);
          setActiveAddress({
            id: null,
            addressLine: "Current Location",
            latitude: lat,
            longitude: lon,
          });

          // Invalidate and refetch products
          queryClient.invalidateQueries({ queryKey: ["products"] });
          queryClient.refetchQueries({ queryKey: ["products", store.id] });
        } else {
          console.warn("No store in range or store not found");
          setNearestStoreId(null);
          setNearestStoreName(null);
        }
      } catch (err) {
        console.error("Failed to resolve nearest store by coordinates", err);
        setNearestStoreId(null);
        setNearestStoreName(null);
      } finally {
        setResolving(false);
      }
    },
    [setActiveAddress, setNearestStoreId, setNearestStoreName, queryClient]
  );

  // Resolve nearest store using address
  const resolveByAddress = React.useCallback(
    async (address: Addr) => {
      setResolving(true);
      try {
        const devUser = typeof window !== "undefined" ? localStorage.getItem("devUserId") : null;
        const storedUserId = typeof window !== "undefined" ? sessionStorage.getItem("checkout:userId") : null;
        const uid = userId ?? (devUser && devUser !== "none" ? Number(devUser) : storedUserId ? Number(storedUserId) : 4);

        const resp = await apiClient.get<ResolveResp>(
          `/stores/resolve?userId=${uid}&addressId=${address.id}`
        );

        const store = resp.data?.nearestStore ?? null;
        console.debug("Resolved by address:", store);

        if (store) {
          setNearestStoreId(store.id);
          setNearestStoreName(store.name ?? null);
          setActiveAddress({
            id: address.id,
            addressLine: address.addressLine,
            latitude: address.latitude,
            longitude: address.longitude,
          });

          // Invalidate and refetch products
          queryClient.invalidateQueries({ queryKey: ["products"] });
          queryClient.refetchQueries({ queryKey: ["products", store.id] });
        } else {
          setNearestStoreId(null);
          setNearestStoreName(null);
        }
      } catch (err) {
        console.error("Failed to resolve nearest store by address", err);
        setNearestStoreId(null);
        setNearestStoreName(null);
      } finally {
        setResolving(false);
      }
    },
    [userId, setActiveAddress, setNearestStoreId, setNearestStoreName, queryClient]
  );

  // Load user addresses
  React.useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const devUser = typeof window !== "undefined" ? localStorage.getItem("devUserId") : null;
        const storedUserId = typeof window !== "undefined" ? sessionStorage.getItem("checkout:userId") : null;
        const uid = userId ?? (devUser && devUser !== "none" ? Number(devUser) : storedUserId ? Number(storedUserId) : 4);

        const res = await apiClient.get<Addr[]>(`/users/${uid}/addresses`);
        if (!mounted) return;
        setAddrs(res);
      } catch {
        if (mounted) setAddrs([]);
      } finally {
        if (mounted) setLoadingAddrs(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId]);

  // Auto-resolve when geolocation is ready (only if useGeo is true and no address selected)
  React.useEffect(() => {
    if (useGeo && !geoLoading && latitude && longitude && !selectedAddressId) {
      resolveByCoordinates(latitude, longitude);
    }
  }, [useGeo, geoLoading, latitude, longitude, selectedAddressId, resolveByCoordinates]);

  // Handle address selection
  const handleAddressSelect = (address: Addr) => {
    setSelectedAddressId(address.id);
    setUseGeo(false); // Switch to address mode
    resolveByAddress(address);
  };

  // Switch back to geolocation
  const handleUseCurrentLocation = () => {
    setSelectedAddressId(null);
    setUseGeo(true);
    if (latitude && longitude) {
      resolveByCoordinates(latitude, longitude);
    }
  };

  return (
    <div className="space-y-4">
      {/* Current location button */}
      <div className="border rounded-lg p-4">
        <button
          onClick={handleUseCurrentLocation}
          disabled={geoLoading || resolving}
          className={`w-full flex items-center justify-between p-3 rounded-md transition-all ${
            useGeo && !selectedAddressId
              ? "bg-primary/10 border-2 border-primary"
              : "bg-gray-50 border border-gray-200 hover:bg-gray-100"
          }`}
        >
          <div className="flex items-center gap-3">
            <MapPin className={`h-5 w-5 ${useGeo && !selectedAddressId ? "text-primary" : "text-gray-600"}`} />
            <div className="text-left">
              <p className="font-medium">Use Current Location</p>
              {geoLoading ? (
                <p className="text-sm text-gray-600 flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Getting your location...
                </p>
              ) : geoError ? (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {geoError}
                </p>
              ) : latitude && longitude ? (
                <p className="text-sm text-gray-600">
                  {latitude.toFixed(6)}, {longitude.toFixed(6)}
                </p>
              ) : null}
            </div>
          </div>
          {resolving && useGeo && <Loader2 className="h-4 w-4 animate-spin" />}
        </button>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-2">
        <div className="flex-1 border-t border-gray-300" />
        <span className="text-sm text-gray-500">or select saved address</span>
        <div className="flex-1 border-t border-gray-300" />
      </div>

      {/* Address list */}
      {loadingAddrs ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
        </div>
      ) : addrs && addrs.length > 0 ? (
        <div className="space-y-2">
          {addrs.map((addr) => (
            <label
              key={addr.id}
              className={`block cursor-pointer p-3 rounded-md transition-all ${
                selectedAddressId === addr.id
                  ? "bg-primary/10 border-2 border-primary"
                  : "border border-gray-200 hover:bg-gray-50"
              }`}
            >
              <input
                type="radio"
                name="address"
                checked={selectedAddressId === addr.id}
                onChange={() => handleAddressSelect(addr)}
                className="sr-only"
              />
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <p className="font-medium">{addr.recipientName}</p>
                  <p className="text-sm text-gray-600">{addr.addressLine}</p>
                  <p className="text-sm text-gray-500">
                    {addr.city}, {addr.province} {addr.postalCode}
                  </p>
                  {addr.isPrimary && (
                    <span className="inline-block mt-1 px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded">
                      Primary
                    </span>
                  )}
                </div>
                {resolving && selectedAddressId === addr.id && (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                )}
              </div>
            </label>
          ))}
        </div>
      ) : (
        <div className="text-center p-4 bg-gray-50 rounded-md">
          <p className="text-gray-600">No saved addresses found</p>
          <p className="text-sm text-gray-500 mt-1">
            Add an address in your profile to see products from nearby stores
          </p>
        </div>
      )}
    </div>
  );
}
