import { prisma } from "@repo/database";

export class LocationService {
  /**
   * Find the nearest store ID based on latitude and longitude coordinates
   * @param lat - Latitude coordinate
   * @param lon - Longitude coordinate
   * @returns Store ID if found within service radius, undefined otherwise
   */
  async findNearestStoreId(lat: number, lon: number): Promise<number | undefined> {
    // Haversine formula constants
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    // Load all store locations (small number expected) and compute distance
    const locations = await prisma.storeLocation.findMany({
      include: { store: true },
    });
    
    if (!locations || locations.length === 0) return undefined;

    let best: { storeId: number; distKm: number } | null = null;
    
    for (const loc of locations) {
      const dLat = toRad(Number(loc.latitude) - lat);
      const dLon = toRad(Number(loc.longitude) - lon);
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat)) *
          Math.cos(toRad(Number(loc.latitude))) *
          Math.sin(dLon / 2) *
          Math.sin(dLon / 2);
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
      const distKm = R * c;

      if (!best || distKm < best.distKm) {
        best = { storeId: loc.storeId, distKm };
      }
    }

    // Enforce a max service radius (e.g., 50 km) to avoid assigning very distant store
    const MAX_KM = Number(process.env.MAX_STORE_RADIUS_KM ?? 50);
    if (best && best.distKm <= MAX_KM) return best.storeId;
    return undefined;
  }

  /**
   * Resolve store ID based on coordinates and address preferences
   * @param storeId - Explicit store ID if provided
   * @param userId - User ID for fallback address lookup
   * @param userLat - Explicit latitude coordinate
   * @param userLon - Explicit longitude coordinate
   * @param addressId - Address ID for coordinate lookup
   * @returns Resolved store ID
   */
  async resolveStoreId(
    storeId: number | undefined,
    userId: number,
    userLat?: number,
    userLon?: number,
    addressId?: number
  ): Promise<number> {
    const { ERROR_MESSAGES } = await import("../utils/helpers.js");
    
    let resolvedStoreId = storeId;
    const coordsExplicit = typeof userLat === "number" && typeof userLon === "number";

    if (!resolvedStoreId) {
      if (coordsExplicit) {
        // If user explicitly provided coords, only use them
        resolvedStoreId = await this.findNearestStoreId(userLat!, userLon!);
        if (!resolvedStoreId) {
          throw new Error(ERROR_MESSAGES.STORE.NO_NEARBY);
        }
      } else {
        // No explicit coords: try addressId coords first
        if (typeof addressId === "number") {
          const addr = await prisma.userAddress.findUnique({
            where: { id: addressId },
          });
          if (addr && addr.latitude && addr.longitude) {
            resolvedStoreId = await this.findNearestStoreId(
              Number(addr.latitude),
              Number(addr.longitude)
            );
          }
        }

        // Finally try user's primary address if still not resolved
        if (!resolvedStoreId) {
          const addr = await prisma.userAddress.findFirst({
            where: { userId },
          });
          if (addr && addr.latitude && addr.longitude) {
            resolvedStoreId = await this.findNearestStoreId(
              Number(addr.latitude),
              Number(addr.longitude)
            );
          }
        }

        if (!resolvedStoreId) {
          throw new Error(ERROR_MESSAGES.STORE.NO_NEARBY);
        }
      }
    }

    return resolvedStoreId as number;
  }
}

export const locationService = new LocationService();
