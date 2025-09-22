import React from "react";
import useLocationStore from "@/stores/locationStore";
import { Store } from "lucide-react";

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
}

export default function NearestStoreIndicator({
  nearestStore,
  message,
}: NearestStoreIndicatorProps) {
  const nearestStoreNameFromStore = useLocationStore((s) => s.nearestStoreName);
  const displayName = nearestStore?.name ?? nearestStoreNameFromStore ?? null;
  if (nearestStore) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
        <div className="flex items-center gap-3">
          <Store className="h-5 w-5 text-green-600" />
          <div>
            <p className="text-green-800 font-medium">
              Showing products from: {displayName}
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
            Select one of your saved addresses to view products from the nearest
            store
          </p>
        </div>
      </div>
    </div>
  );
}
