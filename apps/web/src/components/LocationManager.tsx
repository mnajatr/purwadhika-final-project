"use client";

import React from "react";
import { useGeolocation } from "@/hooks/useGeolocation";
import { apiClient } from "@/lib/axios-client";
import useLocationStore from "@/stores/locationStore";
import { useQueryClient } from "@tanstack/react-query";
import { MapPin, Loader2, AlertCircle, RefreshCw } from "lucide-react";

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

// Custom Confirmation Dialog Component
interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  confirmText?: string;
  cancelText?: string;
}

function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  confirmText = "Continue",
  cancelText = "Cancel",
}: ConfirmDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-32">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative bg-white rounded-lg shadow-2xl border border-gray-200 max-w-md w-full mx-4 p-6 animate-in fade-in-0 zoom-in-95">
        <div className="space-y-4 mb-6">
          <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
          <p className="text-sm text-gray-600">
            This{" "}
            <span className="text-red-500 font-medium">
              maybe delete all your cart items
            </span>
            . This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 text-sm font-medium text-white bg-primary rounded-md hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function LocationManager({ userId }: LocationManagerProps) {
  const {
    latitude,
    longitude,
    error: geoError,
    loading: geoLoading,
    refetch: refetchGeolocation,
  } = useGeolocation();
  const [addrs, setAddrs] = React.useState<Addr[] | null>(null);
  const [loadingAddrs, setLoadingAddrs] = React.useState(true);
  const [resolving, setResolving] = React.useState(false);
  const [showConfirm, setShowConfirm] = React.useState(false);
  const [pendingAction, setPendingAction] = React.useState<(() => void) | null>(
    null
  );

  // Use store state instead of local state - this persists across navigation
  const useGeo = useLocationStore((s) => s.useGeo);
  const selectedAddressId = useLocationStore((s) => s.selectedAddressId);
  const setUseGeo = useLocationStore((s) => s.setUseGeo);
  const setSelectedAddressId = useLocationStore((s) => s.setSelectedAddressId);
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

        console.debug("Resolved by coordinates:", {
          store,
          distanceMeters,
          inRange,
        });

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
        const devUser =
          typeof window !== "undefined"
            ? localStorage.getItem("devUserId")
            : null;
        const storedUserId =
          typeof window !== "undefined"
            ? sessionStorage.getItem("checkout:userId")
            : null;
        const uid =
          userId ??
          (devUser && devUser !== "none"
            ? Number(devUser)
            : storedUserId
            ? Number(storedUserId)
            : 4);

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
    [
      userId,
      setActiveAddress,
      setNearestStoreId,
      setNearestStoreName,
      queryClient,
    ]
  );

  // Load user addresses
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

        // If user has no addresses, fallback to geolocation (but don't force refetch)
        if (res.length === 0) {
          console.log(
            "👤 User has no saved addresses, using geolocation fallback"
          );
          setUseGeo(true);
          setSelectedAddressId(null);
          // Don't call refetchGeolocation() - let the normal useGeolocation hook handle it
        }
      } catch {
        if (mounted) {
          setAddrs([]);
          // On error fetching addresses, also fallback to geolocation
          console.log(
            "⚠️ Error fetching addresses, using geolocation fallback"
          );
          setUseGeo(true);
          setSelectedAddressId(null);
        }
      } finally {
        if (mounted) setLoadingAddrs(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [userId, setUseGeo, setSelectedAddressId]);

  // Auto-resolve when geolocation is ready (only if useGeo is true and no address selected)
  React.useEffect(() => {
    if (useGeo && !geoLoading && latitude && longitude && !selectedAddressId) {
      resolveByCoordinates(latitude, longitude);
    }
  }, [
    useGeo,
    geoLoading,
    latitude,
    longitude,
    selectedAddressId,
    resolveByCoordinates,
  ]);

  // Check if user has items in cart
  const hasCartItems = () => {
    const activeAddr = useLocationStore.getState().activeAddress;
    return activeAddr !== null && (selectedAddressId !== null || useGeo);
  };

  const handleAddressSelect = (address: Addr) => {
    const isChangingAddress = selectedAddressId !== null || useGeo;

    if (isChangingAddress && hasCartItems()) {
      setPendingAction(() => () => {
        setSelectedAddressId(address.id);
        setUseGeo(false);
        resolveByAddress(address);
      });
      setShowConfirm(true);
    } else {
      setSelectedAddressId(address.id);
      setUseGeo(false);
      resolveByAddress(address);
    }
  };

  const handleUseCurrentLocation = () => {
    const isChangingLocation = selectedAddressId !== null;

    if (isChangingLocation && hasCartItems()) {
      setPendingAction(() => () => {
        setSelectedAddressId(null);
        setUseGeo(true);
        if (latitude && longitude) {
          resolveByCoordinates(latitude, longitude);
        }
      });
      setShowConfirm(true);
    } else {
      setSelectedAddressId(null);
      setUseGeo(true);
      if (latitude && longitude) {
        resolveByCoordinates(latitude, longitude);
      }
    }
  };

  const handleRefreshGeolocation = (e: React.MouseEvent) => {
    e.stopPropagation();
    refetchGeolocation();
    // Re-resolve after getting new coordinates
    setTimeout(() => {
      if (useGeo && latitude && longitude) {
        resolveByCoordinates(latitude, longitude);
      }
    }, 1000);
  };

  const handleConfirm = () => {
    if (pendingAction) {
      pendingAction();
    }
    setShowConfirm(false);
    setPendingAction(null);
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setPendingAction(null);
  };

  return (
    <>
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={handleCancel}
        onConfirm={handleConfirm}
        title="Are you sure you want to change the shipping address?"
        confirmText="Continue"
        cancelText="Cancel"
      />

      <div className="space-y-4">
        {/* Show info banner when using geolocation as fallback */}
        {addrs && addrs.length === 0 && useGeo && !geoError && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2">
            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">
                Using your current location
              </p>
              <p className="text-xs text-blue-700 mt-1">
                Since you don&apos;t have any saved addresses, we&apos;re using
                your current location to show products from nearby stores.
              </p>
            </div>
          </div>
        )}

        <div className="border rounded-lg p-4">
          <div
            className={`w-full flex items-center justify-between p-3 rounded-md transition-all ${
              useGeo && !selectedAddressId
                ? "bg-primary/10 border-2 border-primary"
                : "bg-gray-50 border border-gray-200"
            }`}
          >
            <button
              onClick={handleUseCurrentLocation}
              disabled={geoLoading || resolving}
              className="flex-1 flex items-center gap-3 text-left hover:opacity-80 transition-opacity"
            >
              <MapPin
                className={`h-5 w-5 flex-shrink-0 ${
                  useGeo && !selectedAddressId
                    ? "text-primary"
                    : "text-gray-600"
                }`}
              />
              <div className="flex-1">
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
            </button>
            <div className="flex items-center gap-2 flex-shrink-0">
              {useGeo && !selectedAddressId && latitude && longitude && (
                <button
                  onClick={handleRefreshGeolocation}
                  disabled={geoLoading}
                  className="p-1.5 hover:bg-primary/20 rounded-md transition-colors group"
                  title="Refresh location"
                >
                  <RefreshCw
                    className={`h-4 w-4 text-primary group-hover:rotate-180 transition-transform duration-300 ${
                      geoLoading ? "animate-spin" : ""
                    }`}
                  />
                </button>
              )}
              {resolving && useGeo && (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              )}
            </div>
          </div>
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
              {useGeo && latitude && longitude
                ? "Using your current location to show nearby products"
                : "Add an address in your profile or allow location access to see products from nearby stores"}
            </p>
          </div>
        )}
      </div>
    </>
  );
}
