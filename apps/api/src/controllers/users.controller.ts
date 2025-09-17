import { Request, Response } from "express";
import { prisma } from "@repo/database";
import { CreateUserSchema } from "@repo/schemas";

export class UsersController {
  // GET /api/users - List all users
  static async getUsers(_request: Request, response: Response) {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          profile: { select: { fullName: true } },
        },
      });
      response.status(200).json(users);
    } catch (error) {
      response.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  // GET /api/users/:id - Get single user by ID
  static async getUserById(request: Request, response: Response) {
    try {
      const { id } = request.params;
      const user = await prisma.user.findUnique({
        where: { id: parseInt(id) },
        select: {
          id: true,
          email: true,
          role: true,
          createdAt: true,
          profile: { select: { fullName: true } },
        },
      });

      if (!user) {
        return response.status(404).json({ message: "User not found" });
      }

      response.status(200).json(user);
    } catch (error) {
      response.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  // POST /api/users - Create new user
  static async createUser(request: Request, response: Response) {
    try {
      const parsedData = CreateUserSchema.safeParse(request.body);

      if (!parsedData.success) {
        return response.status(400).json({ message: parsedData.error });
      }

      // parsedData.data should already be validated by CreateUserSchema
      const pd = parsedData.data as {
        email: string;
        password?: string;
        role?: string;
      };

      // Narrow and validate role to the allowed union to satisfy Prisma types
      type UserRole = "USER" | "SUPER_ADMIN" | "STORE_ADMIN";
      const roleCandidate = pd.role;
      const userRole =
        roleCandidate === "USER" ||
        roleCandidate === "SUPER_ADMIN" ||
        roleCandidate === "STORE_ADMIN"
          ? (roleCandidate as UserRole)
          : undefined;

      const userData: any = {
        email: pd.email,
        password: pd.password || "",
      };
      if (userRole) userData.role = userRole;

      const user = await prisma.user.create({ data: userData });
      response.status(201).json({ message: "User created", user });
    } catch (error) {
      response.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }

  // GET /api/users/:id/addresses - Get user addresses
  static async getUserAddresses(request: Request, response: Response) {
    try {
      const { id } = request.params;
      const userId = parseInt(id as string);

      if (!userId) {
        return response.status(400).json({ message: "Invalid user id" });
      }

      const addresses = await prisma.userAddress.findMany({
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

      return response.status(200).json(addresses);
    } catch (error) {
      response.status(500).json({
        success: false,
        message:
          error instanceof Error ? error.message : "Internal server error",
      });
    }
  }
}
