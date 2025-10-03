import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { locationService } from "../services/location.service.js";
import { AppError, createValidationError } from "../errors/app.error.js";

export class StoresController {
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

      const formattedStores = stores.map((store) => ({
        id: store.id,
        name: store.name,
        address: store.locations[0]?.addressLine || "",
        city: store.locations[0]?.city || "",
        province: store.locations[0]?.province || "",
      }));

      return response
        .status(200)
        .json({ message: "Stores retrieved", data: formattedStores });
    } catch (error) {
      if (error instanceof AppError) {
        return response
          .status(error.statusCode)
          .json({ message: error.message });
      }
      const msg =
        error instanceof Error ? error.message : "Internal server error";
      return response
        .status(500)
        .json({ message: "Failed to get stores", error: msg });
    }
  }

  static async resolveNearest(request: Request, response: Response) {
    try {
      const userIdRaw = (request.query.userId ?? request.body?.userId) as any;
      const addressIdRaw = (request.query.addressId ??
        request.body?.addressId) as any;
      const latRaw = (request.query.lat ?? request.body?.lat) as any;
      const lonRaw = (request.query.lon ?? request.body?.lon) as any;

      const userId = userIdRaw ? Number(userIdRaw) : undefined;
      const addressId = addressIdRaw ? Number(addressIdRaw) : undefined;

      function buildNearestData(store: any | null, computed: any | null) {
        if (!computed || !store) {
          return {
            nearestStore: null,
            message: store ? `Nearest store: ${store.name}` : "No nearby store",
          };
        }
        return {
          nearestStore: store,
          distanceMeters: computed.distanceMeters,
          maxRadiusKm: computed.maxRadiusKm,
          inRange: computed.inRange,
          message: `Nearest store: ${store?.name ?? "unknown"}`,
        };
      }

      if (addressId && userId) {
        const addr = await prisma.userAddress.findUnique({
          where: { id: addressId },
        });
        if (!addr || !addr.latitude || !addr.longitude) {
          return response
            .status(200)
            .json({
              message: "Address has no coordinates",
              data: { nearestStore: null },
            });
        }
        const computed = await locationService.computeNearestWithDistance(
          Number(addr.latitude),
          Number(addr.longitude)
        );
        if (!computed) {
          return response
            .status(200)
            .json({ message: "No nearby store", data: { nearestStore: null } });
        }
        const store = await prisma.store.findUnique({
          where: { id: computed.storeId },
          select: { id: true, name: true, locations: true },
        });
        return response
          .status(200)
          .json({
            message: "Nearest store found",
            data: buildNearestData(store, computed),
          });
      }

      if (latRaw && lonRaw) {
        const userLat = Number(latRaw);
        const userLon = Number(lonRaw);
        if (Number.isNaN(userLat) || Number.isNaN(userLon)) {
          throw createValidationError("Invalid coordinates");
        }
        const computed = await locationService.computeNearestWithDistance(
          userLat,
          userLon
        );
        if (!computed) {
          return response
            .status(200)
            .json({ message: "No nearby store", data: { nearestStore: null } });
        }
        const store = await prisma.store.findUnique({
          where: { id: computed.storeId },
          select: { id: true, name: true, locations: true },
        });
        return response
          .status(200)
          .json({
            message: "Nearest store found",
            data: buildNearestData(store, computed),
          });
      }

      throw createValidationError("Provide userId+addressId or lat+lon");
    } catch (err) {
      if (err instanceof AppError) {
        return response.status(err.statusCode).json({ message: err.message });
      }
      const msg = err instanceof Error ? err.message : String(err);
      return response
        .status(500)
        .json({ message: "Failed to resolve nearest store", error: msg });
    }
  }
}
