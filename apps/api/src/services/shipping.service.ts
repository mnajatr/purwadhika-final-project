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

/**
 * ShippingService handles all shipping-related calculations and operations.
 * Pure calculation functions do not modify database state.
 * Transaction-aware functions accept Prisma tx client for atomic operations.
 */
export class ShippingService {
  /**
   * Calculate shipping cost and resolve shipping method.
   * This is a pure calculation that can be called before checkout.
   *
   * @param input - Shipping calculation parameters
   * @param tx - Optional Prisma transaction client for database queries
   * @returns Shipping details including method, cost, and carrier info
   */
  async calculateShipping(
    input: ShippingCalculationInput,
    tx?: Prisma.TransactionClient
  ): Promise<ShippingCalculationResult> {
    const client = tx ?? prisma;
    const { shippingMethod, shippingOption } = input;

    let methodId: number;
    let cost = 0; // Default cost (can be enhanced with actual calculation logic)
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
        // Fallback to standard
        carrier = "Standard";
        serviceCode = "STANDARD";
        methodId = -1; // Needs creation
      }
    }

    // TODO: Add actual cost calculation logic based on:
    // - Distance between store and delivery address
    // - Package weight/dimensions
    // - Shipping method rates
    // - Any active shipping promotions

    return {
      methodId,
      cost,
      carrier,
      serviceCode,
    };
  }

  /**
   * Resolve or create shipping method within a transaction.
   * This ensures the shipping method exists and returns its ID.
   *
   * @param shippingData - Shipping method details
   * @param tx - Prisma transaction client
   * @returns Shipping method ID
   */
  async resolveShippingMethod(
    shippingData: {
      shippingMethod?: string;
      shippingOption?: string;
    },
    tx: Prisma.TransactionClient
  ): Promise<number> {
    const { shippingMethod, shippingOption } = shippingData;

    if (shippingMethod) {
      // Try to find existing method
      const existingMethod = await tx.shippingMethod.findFirst({
        where: {
          OR: [{ carrier: shippingMethod }, { serviceCode: shippingMethod }],
        },
      });

      if (existingMethod) {
        return existingMethod.id;
      }

      // Create new method if it doesn't exist
      const newMethod = await tx.shippingMethod.create({
        data: {
          carrier: shippingMethod,
          serviceCode: shippingOption || shippingMethod,
          isActive: true,
        },
      });
      return newMethod.id;
    }

    // Use default method
    const defaultMethod = await tx.shippingMethod.findFirst({
      where: { isActive: true },
      orderBy: { id: "asc" },
    });

    if (defaultMethod) {
      return defaultMethod.id;
    }

    // Create default if none exists
    const newDefault = await tx.shippingMethod.create({
      data: {
        carrier: "Standard",
        serviceCode: "STANDARD",
        isActive: true,
      },
    });
    return newDefault.id;
  }

  /**
   * Create shipment record within a transaction.
   * This should only be called as part of order creation transaction.
   *
   * @param tx - Prisma transaction client
   * @param orderId - Order ID
   * @param methodId - Shipping method ID
   * @param cost - Shipping cost
   * @returns Created shipment record
   */
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
