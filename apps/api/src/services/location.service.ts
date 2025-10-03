import { prisma } from "@repo/database";
import {
  calculateDistance,
  isValidCoordinates,
  kmToMeters,
} from "../utils/geo.utils.js";

export class LocationService {
  async findNearestStoreId(
    lat: number,
    lon: number
  ): Promise<number | undefined> {
    // Validate coordinates
    if (!isValidCoordinates(lat, lon)) {
      throw new Error(`Invalid coordinates: lat=${lat}, lon=${lon}`);
    }

    // Load all store locations (small number expected) and compute distance
    const locations = await prisma.storeLocation.findMany({
      include: { store: true },
    });

    if (!locations || locations.length === 0) return undefined;

    let best: { storeId: number; distKm: number; loc: any } | null = null;

    for (const loc of locations) {
      const distKm = calculateDistance(
        lat,
        lon,
        Number(loc.latitude),
        Number(loc.longitude)
      );

      if (!best || distKm < best.distKm) {
        best = { storeId: loc.storeId, distKm, loc };
      }
    }

    // Enforce a max service radius (e.g., 10 km) to avoid assigning very distant store
    const MAX_KM = Number(process.env.MAX_STORE_RADIUS_KM ?? 10);
    if (best && best.distKm <= MAX_KM) return best.storeId;
    return undefined;
  }

  // New helper to compute nearest store + distance details
  async computeNearestWithDistance(lat: number, lon: number) {
    // Validate coordinates
    if (!isValidCoordinates(lat, lon)) {
      throw new Error(`Invalid coordinates: lat=${lat}, lon=${lon}`);
    }

    const locations = await prisma.storeLocation.findMany({
      include: { store: true },
    });
    if (!locations || locations.length === 0) return null;

    let best: { storeId: number; distKm: number; loc: any } | null = null;

    for (const loc of locations) {
      const distKm = calculateDistance(
        lat,
        lon,
        Number(loc.latitude),
        Number(loc.longitude)
      );

      if (!best || distKm < best.distKm) {
        best = { storeId: loc.storeId, distKm, loc };
      }
    }

    if (!best) return null;

    const MAX_KM = Number(process.env.MAX_STORE_RADIUS_KM ?? 10);
    return {
      storeId: best.storeId,
      distanceMeters: kmToMeters(best.distKm),
      distanceKm: best.distKm,
      maxRadiusKm: MAX_KM,
      inRange: best.distKm <= MAX_KM,
      storeLocation: best.loc,
    };
  }

  async resolveStoreId(
    storeId: number | undefined,
    userId: number,
    userLat?: number,
    userLon?: number,
    addressId?: number
  ): Promise<number> {
    const { ERROR_MESSAGES } = await import("../utils/helpers.js");

    let resolvedStoreId = storeId;
    const coordsExplicit =
      typeof userLat === "number" && typeof userLon === "number";

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
