export function useGeolocation() {
  // Geolocation removed — returning nulls. Frontend should use user's saved addresses.
  return {
    latitude: null as number | null,
    longitude: null as number | null,
    error: null as string | null,
    loading: false,
    refetch: () => Promise.resolve(),
  };
}
