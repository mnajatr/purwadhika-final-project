import { create } from "zustand";

export type ActiveAddress = {
  id: number | null;
  addressLine?: string;
};

type LocationState = {
  activeAddress: ActiveAddress | null;
  nearestStoreId: number | null;
  nearestStoreName: string | null;
  setActiveAddress: (a: ActiveAddress | null) => void;
  setNearestStoreId: (id: number | null) => void;
  setNearestStoreName: (name: string | null) => void;
  clearAddress: () => void;
};

const useLocationStore = create<LocationState>((set) => ({
  activeAddress: null,
  nearestStoreId: null,
  nearestStoreName: null,
  setActiveAddress: (a: ActiveAddress | null) =>
    set(() => ({ activeAddress: a })),
  setNearestStoreId: (id: number | null) => set(() => ({ nearestStoreId: id })),
  setNearestStoreName: (name: string | null) =>
    set(() => ({ nearestStoreName: name })),
  clearAddress: () =>
    set(() => ({
      activeAddress: null,
      nearestStoreId: null,
      nearestStoreName: null,
    })),
}));

export default useLocationStore;
export { useLocationStore };
