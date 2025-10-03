import { prisma } from "@repo/database";
import type { Prisma } from "@repo/database/generated/prisma/index.js";

export interface ShippingCalculationInput {
  shippingMethod?: string;
  shippingOption?: string;
  addressId?: number;
  storeId?: number;
}

export interface ShippingCalculationResult {
  methodId: number;
  cost: number;
  carrier: string;
  serviceCode: string;
}

export class ShippingService {
  async calculateShipping(
    input: ShippingCalculationInput,
    tx?: Prisma.TransactionClient
  ): Promise<ShippingCalculationResult> {
    const client = tx ?? prisma;
    const { shippingMethod, shippingOption } = input;

    let methodId: number;
    let cost = 0;
    let carrier: string;
    let serviceCode: string;

    if (shippingMethod) {
      // Try to find existing shipping method
      const existingMethod = await client.shippingMethod.findFirst({
        where: {
          OR: [{ carrier: shippingMethod }, { serviceCode: shippingMethod }],
        },
      });

      if (existingMethod) {
        methodId = existingMethod.id;
        carrier = existingMethod.carrier;
        serviceCode = existingMethod.serviceCode;
      } else {
        // If method doesn't exist, we'll need to create it in transaction
        // For now, return the data to be created by checkout service
        // This keeps the calculation pure
        carrier = shippingMethod;
        serviceCode = shippingOption || shippingMethod;
        methodId = -1; // Sentinel value indicating "needs creation"
      }
    } else {
      // Use default shipping method
      const defaultMethod = await client.shippingMethod.findFirst({
        where: { isActive: true },
        orderBy: { id: "asc" },
      });

      if (defaultMethod) {
        methodId = defaultMethod.id;
        carrier = defaultMethod.carrier;
        serviceCode = defaultMethod.serviceCode;
      } else {
        carrier = "Standard";
        serviceCode = "STANDARD";
        methodId = -1;
      }
    }

    return {
      methodId,
      cost,
      carrier,
      serviceCode,
    };
  }

  async resolveShippingMethod(
    shippingData: {
      shippingMethod?: string;
      shippingOption?: string;
    },
    tx: Prisma.TransactionClient
  ): Promise<number> {
    const { shippingMethod, shippingOption } = shippingData;

    if (shippingMethod) {
      const existingMethod = await tx.shippingMethod.findFirst({
        where: {
          OR: [{ carrier: shippingMethod }, { serviceCode: shippingMethod }],
        },
      });

      if (existingMethod) {
        return existingMethod.id;
      }

      const newMethod = await tx.shippingMethod.create({
        data: {
          carrier: shippingMethod,
          serviceCode: shippingOption || shippingMethod,
          isActive: true,
        },
      });
      return newMethod.id;
    }

    const defaultMethod = await tx.shippingMethod.findFirst({
      where: { isActive: true },
      orderBy: { id: "asc" },
    });

    if (defaultMethod) {
      return defaultMethod.id;
    }

    const newDefault = await tx.shippingMethod.create({
      data: {
        carrier: "Standard",
        serviceCode: "STANDARD",
        isActive: true,
      },
    });
    return newDefault.id;
  }
  async createShipment(
    tx: Prisma.TransactionClient,
    orderId: number,
    methodId: number,
    cost: number
  ) {
    return tx.shipment.create({
      data: {
        orderId,
        methodId,
        trackingNumber: null,
        cost,
        status: "PENDING",
        shippedAt: null,
        deliveredAt: null,
      },
    });
  }
}

export const shippingService = new ShippingService();
