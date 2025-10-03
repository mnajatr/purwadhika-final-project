/**
 * Geolocation Utilities
 * 
 * Helper functions for geographical calculations and location-based operations.
 */

/**
 * Calculate distance between two geographical coordinates using the Haversine formula.
 * 
 * The Haversine formula determines the great-circle distance between two points
 * on a sphere given their longitudes and latitudes. This is useful for calculating
 * the distance "as the crow flies" between two locations on Earth.
 * 
 * Formula:
 * a = sin²(Δφ/2) + cos φ1 ⋅ cos φ2 ⋅ sin²(Δλ/2)
 * c = 2 ⋅ atan2(√a, √(1−a))
 * d = R ⋅ c
 * 
 * where:
 * - φ is latitude
 * - λ is longitude
 * - R is Earth's radius (mean radius = 6,371 km)
 * - Δφ = φ2 - φ1
 * - Δλ = λ2 - λ1
 * 
 * @param lat1 - Latitude of point 1 in decimal degrees
 * @param lon1 - Longitude of point 1 in decimal degrees
 * @param lat2 - Latitude of point 2 in decimal degrees
 * @param lon2 - Longitude of point 2 in decimal degrees
 * @returns Distance in kilometers
 * 
 * @example
 * ```typescript
 * const distance = calculateDistance(-6.2088, 106.8456, -6.9175, 107.6191);
 * console.log(`Distance: ${distance.toFixed(2)} km`); // ~116.24 km (Jakarta to Bandung)
 * ```
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const R = 6371; // Earth radius in kilometers

  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) *
      Math.cos(toRad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance;
}

/**
 * Check if a point is within a certain radius of another point.
 * 
 * @param centerLat - Latitude of center point
 * @param centerLon - Longitude of center point
 * @param pointLat - Latitude of point to check
 * @param pointLon - Longitude of point to check
 * @param radiusKm - Radius in kilometers
 * @returns True if point is within radius, false otherwise
 * 
 * @example
 * ```typescript
 * const isNearby = isWithinRadius(-6.2088, 106.8456, -6.2000, 106.8450, 5);
 * console.log(isNearby); // true (less than 5km away)
 * ```
 */
export function isWithinRadius(
  centerLat: number,
  centerLon: number,
  pointLat: number,
  pointLon: number,
  radiusKm: number
): boolean {
  const distance = calculateDistance(centerLat, centerLon, pointLat, pointLon);
  return distance <= radiusKm;
}

/**
 * Format distance for display.
 * 
 * @param distanceKm - Distance in kilometers
 * @returns Formatted string (e.g., "1.5 km", "750 m")
 * 
 * @example
 * ```typescript
 * formatDistance(1.234); // "1.2 km"
 * formatDistance(0.567); // "567 m"
 * ```
 */
export function formatDistance(distanceKm: number): string {
  if (distanceKm < 1) {
    return `${Math.round(distanceKm * 1000)} m`;
  }
  return `${distanceKm.toFixed(1)} km`;
}

/**
 * Convert kilometers to meters.
 */
export function kmToMeters(km: number): number {
  return Math.round(km * 1000);
}

/**
 * Convert meters to kilometers.
 */
export function metersToKm(meters: number): number {
  return meters / 1000;
}

/**
 * Validate latitude value.
 * Valid range: -90 to 90
 */
export function isValidLatitude(lat: number): boolean {
  return typeof lat === 'number' && !isNaN(lat) && lat >= -90 && lat <= 90;
}

/**
 * Validate longitude value.
 * Valid range: -180 to 180
 */
export function isValidLongitude(lon: number): boolean {
  return typeof lon === 'number' && !isNaN(lon) && lon >= -180 && lon <= 180;
}

/**
 * Validate coordinate pair.
 */
export function isValidCoordinates(lat: number, lon: number): boolean {
  return isValidLatitude(lat) && isValidLongitude(lon);
}
