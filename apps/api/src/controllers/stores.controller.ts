import { Request, Response } from "express";
import { prisma } from "@repo/database";

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
}
