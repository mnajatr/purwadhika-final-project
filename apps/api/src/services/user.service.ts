import { prisma } from "@repo/database";
import { CreateUserInput, UpdateUserInput } from "@repo/schemas";

export class UsersService {
  // ================= CREATE USER =================
  async createUser(data: CreateUserInput) {
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

  // ================= GET ALL USERS =================
  async getAll() {
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

  // ================= GET ALL WITH PAGINATION =================
  async getAllPaginated(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        skip,
        take: limit,
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          profile: { select: { fullName: true, avatarUrl: true } },
        },
      }),
      prisma.user.count(),
    ]);

    return {
      data: users,
      total,
      page,
      limit,
    };
  }

  // ================= GET USER BY ID =================
  async getById(id: number) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true },
    });

    if (!user) throw new Error(`User with id ${id} not found`);
    return user;
  }

  // ================= UPDATE USER =================
  async updateUser(id: number, data: UpdateUserInput) {
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

  // ================= DELETE USER =================
  async deleteUser(id: number) {
    return prisma.user.delete({ where: { id } });
  }

  // ================= GET USER ADDRESSES =================
  async getUserAddresses(userId: number) {
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
