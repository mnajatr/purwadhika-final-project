import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { locationService } from "../services/location.service.js";

export class StoresController {
  // GET /api/stores - Get all active stores with location info
  static async getStores(_request: Request, response: Response) {
    try {
      const stores = await prisma.store.findMany({
        select: {
          id: true,
          name: true,
          locations: {
            select: {
              addressLine: true,
              city: true,
              province: true,
            },
            take: 1,
          },
        },
        where: {
          isActive: true,
        },
        orderBy: {
          name: "asc",
        },
      });

      // Flatten the response for easier frontend consumption
      const formattedStores = stores.map((store) => ({
        id: store.id,
        name: store.name,
        address: store.locations[0]?.addressLine || "",
        city: store.locations[0]?.city || "",
        province: store.locations[0]?.province || "",
      }));

      response.status(200).json({
        success: true,
        data: formattedStores,
      });
    } catch (error) {
      response.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  // GET /api/stores/resolve - Resolve nearest store.
  // Preferred flow: provide userId and addressId (query or body) so backend resolves nearest store using saved address.
  // Backward-compat: lat & lon query params are still supported but will be deprecated.
  static async resolveNearest(request: Request, response: Response) {
    try {
      // Accept userId and addressId from either query or body
      const userIdRaw = (request.query.userId ?? request.body?.userId) as any;
      const addressIdRaw = (request.query.addressId ??
        request.body?.addressId) as any;
      const latRaw = (request.query.lat ?? request.body?.lat) as any;
      const lonRaw = (request.query.lon ?? request.body?.lon) as any;

      const userId = userIdRaw ? Number(userIdRaw) : undefined;
      const addressId = addressIdRaw ? Number(addressIdRaw) : undefined;

      // If addressId provided, prefer it
      if (addressId && userId) {
        // Resolve using address coordinates and compute distance
        const addr = await prisma.userAddress.findUnique({ where: { id: addressId } });
        if (!addr || !addr.latitude || !addr.longitude) {
          return response.status(200).json({ success: true, data: { nearestStore: null, message: "Address has no coordinates" } });
        }
        const computed = await locationService.computeNearestWithDistance(Number(addr.latitude), Number(addr.longitude));
        if (!computed) {
          return response.status(200).json({ success: true, data: { nearestStore: null, message: "No nearby store" } });
        }
        const store = await prisma.store.findUnique({ where: { id: computed.storeId }, select: { id: true, name: true, locations: true } });
        return response.status(200).json({ success: true, data: { nearestStore: store, distanceMeters: computed.distanceMeters, maxRadiusKm: computed.maxRadiusKm, inRange: computed.inRange, message: `Nearest store: ${store?.name ?? "unknown"}` } });
      }

      // If lat/lon provided (legacy), still resolve using coords
      if (latRaw && lonRaw) {
        const userLat = Number(latRaw);
        const userLon = Number(lonRaw);
        if (Number.isNaN(userLat) || Number.isNaN(userLon)) {
          return response
            .status(400)
            .json({ success: false, message: "invalid coordinates" });
        }
        const computed = await locationService.computeNearestWithDistance(userLat, userLon);
        if (!computed) {
          return response.status(200).json({ success: true, data: { nearestStore: null, message: "No nearby store" } });
        }
        const store = await prisma.store.findUnique({ where: { id: computed.storeId }, select: { id: true, name: true, locations: true } });
        return response.status(200).json({ success: true, data: { nearestStore: store, distanceMeters: computed.distanceMeters, maxRadiusKm: computed.maxRadiusKm, inRange: computed.inRange, message: `Nearest store: ${store?.name ?? "unknown"}` } });
      }

      return response
        .status(400)
        .json({
          success: false,
          message: "Provide userId+addressId or lat+lon",
        });
    } catch (err) {
      console.error(err);
      return response
        .status(500)
        .json({ success: false, message: "Failed to resolve nearest store" });
    }
  }
}
