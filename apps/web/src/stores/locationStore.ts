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
  setActiveAddress: (a: ActiveAddress | null) => void;
  setNearestStoreId: (id: number | null) => void;
  setNearestStoreName: (name: string | null) => void;
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
      setActiveAddress: (a: ActiveAddress | null) =>
        set(() => ({ activeAddress: a })),
      setNearestStoreId: (id: number | null) =>
        set(() => ({ nearestStoreId: id })),
      setNearestStoreName: (name: string | null) =>
        set(() => ({ nearestStoreName: name })),
      updateActiveAddressWithStoreInfo: (storeId: number, storeName: string) =>
        set(() => ({ nearestStoreId: storeId, nearestStoreName: storeName })),
      clearAddress: () =>
        set(() => ({
          activeAddress: null,
          nearestStoreId: null,
          nearestStoreName: null,
        })),
    }),
    {
      name: "location-storage", // key in localStorage
      partialize: (state) => ({
        activeAddress: state.activeAddress,
        nearestStoreId: state.nearestStoreId,
        nearestStoreName: state.nearestStoreName,
      }),
    }
  )
);

export default useLocationStore;
export { useLocationStore };
