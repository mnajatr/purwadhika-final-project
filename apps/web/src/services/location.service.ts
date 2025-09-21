import apiClient from "@/lib/axios-client";

type ResolveResp = {
  success: boolean;
  data: {
    nearestStore: {
      id: number;
      name: string;
      locations?: Array<{ id: number; latitude: number; longitude: number }>;
    } | null;
    message: string;
  };
};

export const locationService = {
  resolveNearest: async (lat: number, lon: number): Promise<ResolveResp> => {
    const resp = await apiClient.get<ResolveResp>(
      `/stores/resolve?lat=${lat}&lon=${lon}`
    );
    return resp;
  },
};

export default locationService;
