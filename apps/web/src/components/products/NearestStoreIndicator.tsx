import React from "react";
import { MapPin, Store, AlertCircle } from "lucide-react";

interface NearestStoreIndicatorProps {
  nearestStore: {
    id: number;
    name: string;
    locations: Array<{
      id: number;
      latitude: number;
      longitude: number;
      storeId: number;
    }>;
  } | null;
  message: string;
  isLocationLoading?: boolean;
  locationError?: string | null;
  onRetryLocation?: () => void;
}

export default function NearestStoreIndicator({
  nearestStore,
  message,
  isLocationLoading = false,
  locationError = null,
  onRetryLocation,
}: NearestStoreIndicatorProps) {
  if (isLocationLoading) {
    return (
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="animate-spin">
            <MapPin className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <p className="text-blue-800 font-medium">
              Detecting your location...
            </p>
            <p className="text-blue-600 text-sm">
              Finding the nearest store for you
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (locationError) {
    return (
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="h-5 w-5 text-yellow-600" />
            <div>
              <p className="text-yellow-800 font-medium">
                Location access needed
              </p>
              <p className="text-yellow-600 text-sm">{locationError}</p>
            </div>
          </div>
          {onRetryLocation && (
            <button
              onClick={onRetryLocation}
              className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700 transition-colors"
            >
              Retry
            </button>
          )}
        </div>
      </div>
    );
  }

  if (nearestStore) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <Store className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-green-800 font-medium">
              Showing products from: {nearestStore.name}
            </p>
            <p className="text-green-600 text-sm">{message}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-6">
      <div className="flex items-center gap-3">
        <Store className="h-5 w-5 text-gray-600" />
        <div>
          <p className="text-gray-800 font-medium">{message}</p>
          <p className="text-gray-600 text-sm">
            Enable location access to see products from your nearest store
          </p>
        </div>
      </div>
    </div>
  );
}
