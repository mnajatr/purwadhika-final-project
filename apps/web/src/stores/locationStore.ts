import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ActiveAddress = {
  id: number | null;
  addressLine?: string;
  latitude?: number | null;
  longitude?: number | null;
};

type LocationState = {
  activeAddress: ActiveAddress | null;
  nearestStoreId: number | null;
  nearestStoreName: string | null;
  // User choice: whether to use geolocation or a saved address
  useGeo: boolean;
  selectedAddressId: number | null;
  setActiveAddress: (a: ActiveAddress | null) => void;
  setNearestStoreId: (id: number | null) => void;
  setNearestStoreName: (name: string | null) => void;
  setUseGeo: (useGeo: boolean) => void;
  setSelectedAddressId: (id: number | null) => void;
  updateActiveAddressWithStoreInfo: (
    storeId: number,
    storeName: string
  ) => void;
  clearAddress: () => void;
};

const useLocationStore = create<LocationState>()(
  persist(
    (set) => ({
      activeAddress: null,
      nearestStoreId: null,
      nearestStoreName: null,
      useGeo: true, // default to geolocation on first visit
      selectedAddressId: null,
      setActiveAddress: (a: ActiveAddress | null) =>
        set(() => ({ activeAddress: a })),
      setNearestStoreId: (id: number | null) =>
        set(() => ({ nearestStoreId: id })),
      setNearestStoreName: (name: string | null) =>
        set(() => ({ nearestStoreName: name })),
      setUseGeo: (useGeo: boolean) => set(() => ({ useGeo })),
      setSelectedAddressId: (id: number | null) =>
        set(() => ({ selectedAddressId: id })),
      updateActiveAddressWithStoreInfo: (storeId: number, storeName: string) =>
        set(() => ({ nearestStoreId: storeId, nearestStoreName: storeName })),
      clearAddress: () =>
        set(() => ({
          activeAddress: null,
          nearestStoreId: null,
          nearestStoreName: null,
          useGeo: true,
          selectedAddressId: null,
        })),
    }),
    {
      name: "location-storage", // key in localStorage
      partialize: (state) => ({
        activeAddress: state.activeAddress,
        nearestStoreId: state.nearestStoreId,
        nearestStoreName: state.nearestStoreName,
        useGeo: state.useGeo,
        selectedAddressId: state.selectedAddressId,
      }),
    }
  )
);

export default useLocationStore;
export { useLocationStore };
