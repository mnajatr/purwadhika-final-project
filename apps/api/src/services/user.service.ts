import { prisma } from "@repo/database";
import { CreateUserInput, UpdateUserInput } from "@repo/schemas";

export class UsersService {
  static async createUser(data: CreateUserInput) {
    return prisma.user.create({
      data: {
        email: data.email,
        password: data.password,
        role: data.role || "USER",
        profile: data.profile
          ? {
              create: {
                fullName: data.profile.fullName,
                avatarUrl: data.profile.avatarUrl,
              },
            }
          : undefined,
      },
      include: { profile: true },
    });
  }
  static async getUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        email: true,
        role: true,
        createdAt: true,
        profile: { select: { fullName: true, avatarUrl: true } },
      },
    });
  }

  static async getUserById(id: number) {
    return prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });
  }

  static async updateUser(id: number, data: UpdateUserInput) {
    return prisma.user.update({
      where: { id },
      data: {
        email: data.email,
        password: data.password,
        role: data.role,
        profile: data.profile
          ? {
              upsert: {
                create: {
                  fullName: data.profile.fullName,
                  avatarUrl: data.profile.avatarUrl,
                },
                update: {
                  fullName: data.profile.fullName,
                  avatarUrl: data.profile.avatarUrl,
                },
              },
            }
          : undefined,
      },
      include: { profile: true },
    });
  }

  static async deleteUser(id: number) {
    return prisma.user.delete({ where: { id } });
  }

  static async getUserAddresses(userId: number) {
    return prisma.userAddress.findMany({
      where: { userId },
      select: {
        id: true,
        recipientName: true,
        addressLine: true,
        province: true,
        city: true,
        postalCode: true,
        latitude: true,
        longitude: true,
        isPrimary: true,
      },
    });
  }
}
