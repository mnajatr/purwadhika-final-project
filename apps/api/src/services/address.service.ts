import { prisma } from "@repo/database";

export class AddressService {
  /**
   * Resolve address ID for order creation
   * If no addressId provided, finds user's primary or first address
   * If no address exists, creates a default one
   * @param userId - User ID
   * @param addressId - Optional specific address ID to use
   * @returns Resolved address ID
   */
  async resolveAddressId(userId: number, addressId?: number): Promise<number> {
    let chosenAddressId = addressId;

    if (typeof chosenAddressId !== "number") {
      // Pick user's primary or first address
      const addr = await prisma.userAddress.findFirst({ 
        where: { userId },
        orderBy: { id: "asc" } // Get the first address consistently
      });
      
      if (addr) {
        chosenAddressId = addr.id;
      } else {
        // Auto-create a lightweight placeholder so DB constraints are satisfied
        const createdAddr = await prisma.userAddress.create({
          data: {
            userId,
            recipientName: "Default Recipient",
            addressLine: "Auto-created address",
            province: "Unknown",
            city: "Unknown",
            district: null,
            postalCode: "00000",
            latitude: 0,
            longitude: 0,
          },
        });
        chosenAddressId = createdAddr.id;
      }
    } else {
      // Validate ownership: ensure the provided address belongs to the user
      const addr = await prisma.userAddress.findUnique({
        where: { id: chosenAddressId },
      });
      
      if (!addr || addr.userId !== userId) {
        throw new Error("Address not found or does not belong to user");
      }
    }

    return chosenAddressId;
  }

  /**
   * Get address coordinates for location-based operations
   * @param addressId - Address ID to get coordinates for
   * @returns Coordinates object or null if not found/no coordinates
   */
  async getAddressCoordinates(addressId: number): Promise<{ lat: number; lon: number } | null> {
    const addr = await prisma.userAddress.findUnique({
      where: { id: addressId },
      select: { latitude: true, longitude: true },
    });

    if (addr && addr.latitude && addr.longitude) {
      return {
        lat: Number(addr.latitude),
        lon: Number(addr.longitude),
      };
    }

    return null;
  }

  /**
   * Get user's primary address coordinates
   * @param userId - User ID to get primary address for
   * @returns Coordinates object or null if not found/no coordinates
   */
  async getUserPrimaryAddressCoordinates(userId: number): Promise<{ lat: number; lon: number } | null> {
    const addr = await prisma.userAddress.findFirst({
      where: { userId },
      select: { latitude: true, longitude: true },
      orderBy: { id: "asc" }, // Get first address consistently
    });

    if (addr && addr.latitude && addr.longitude) {
      return {
        lat: Number(addr.latitude),
        lon: Number(addr.longitude),
      };
    }

    return null;
  }
}

export const addressService = new AddressService();
