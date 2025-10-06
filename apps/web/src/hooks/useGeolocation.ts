"use client";

import { useState, useEffect } from "react";

interface GeolocationState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

export function useGeolocation(options?: PositionOptions) {
  const [state, setState] = useState<GeolocationState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: true,
  });

  useEffect(() => {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      setState({
        latitude: null,
        longitude: null,
        error: "Geolocation is not supported by your browser",
        loading: false,
      });
      return;
    }

    // Get current position
    const onSuccess = (position: GeolocationPosition) => {
      console.log("📍 Geolocation obtained:", {
        lat: position.coords.latitude,
        lon: position.coords.longitude,
      });
      setState({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude,
        error: null,
        loading: false,
      });
    };

    const onError = (error: GeolocationPositionError) => {
      let errorMessage = "Unable to retrieve your location";

      switch (error.code) {
        case error.PERMISSION_DENIED:
          errorMessage =
            "Location permission denied. Please enable location access in your browser settings.";
          break;
        case error.POSITION_UNAVAILABLE:
          errorMessage = "Location information is unavailable.";
          break;
        case error.TIMEOUT:
          errorMessage = "Location request timed out.";
          break;
      }

      console.error("❌ Geolocation error:", errorMessage);
      setState({
        latitude: null,
        longitude: null,
        error: errorMessage,
        loading: false,
      });
    };

    // Request current position with longer cache to avoid rate limiting
    navigator.geolocation.getCurrentPosition(
      onSuccess,
      onError,
      options || {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 600000, // Cache for 10 minutes to avoid excessive requests
      }
    );
  }, [options]);

  const refetch = () => {
    setState((prev) => ({ ...prev, loading: true }));

    navigator.geolocation.getCurrentPosition(
      (position) => {
        console.log("📍 Geolocation refreshed:", {
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
        setState({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          error: null,
          loading: false,
        });
      },
      (error) => {
        let errorMessage = "Unable to retrieve your location";

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location unavailable";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out";
            break;
        }

        console.error("❌ Geolocation refresh error:", errorMessage);
        setState({
          latitude: null,
          longitude: null,
          error: errorMessage,
          loading: false,
        });
      },
      options || {
        enableHighAccuracy: false,
        timeout: 10000,
        maximumAge: 0, // Force fresh location only when manually refreshed
      }
    );
  };

  return {
    ...state,
    refetch,
  };
}
