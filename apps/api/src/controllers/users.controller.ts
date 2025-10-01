import { Request, Response } from "express";
import { UsersService } from "../services/user.service.js";
import { CreateUserSchema, UpdateUserSchema } from "@repo/schemas";

const service = new UsersService();

export class UsersController {
  // ================= GET ALL USERS =================
  static async getUsers(req: Request, res: Response) {
    try {
      const { page = "1", limit = "10" } = req.query;
      const pageNumber = parseInt(page as string) || 1;
      const limitNumber = parseInt(limit as string) || 10;

      const result = await service.getAllPaginated(pageNumber, limitNumber);

      res.json({
        data: result.data,
        total: result.total,
        page: result.page,
        limit: result.limit,
        message: "List of users",
      });
    } catch (err: any) {
      console.error("Get all users error:", err);
      res.status(500).json({ message: err.message || "Failed to get users" });
    }
  }

  // ================= GET USER BY ID =================
  static async getUserById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = await service.getById(id);
      res.json(user);
    } catch (err: any) {
      console.error("Get user by id error:", err);
      res.status(404).json({ message: err.message || "User not found" });
    }
  }

  // ================= CREATE USER =================
  static async createUser(req: Request, res: Response) {
    try {
      const parsed = CreateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Validation error",
          errors: parsed.error.issues,
        });
      }

      const user = await service.createUser(parsed.data);
      res.status(201).json(user);
    } catch (err: any) {
      console.error("Create user error:", err);
      res.status(500).json({ message: err.message || "Failed to create user" });
    }
  }

  // ================= UPDATE USER =================
  static async updateUser(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const parsed = UpdateUserSchema.safeParse(req.body);
      if (!parsed.success) {
        return res.status(400).json({
          message: "Validation error",
          errors: parsed.error.issues,
        });
      }

      const updated = await service.updateUser(id, parsed.data);
      res.json(updated);
    } catch (err: any) {
      console.error("Update user error:", err);
      res.status(500).json({ message: err.message || "Failed to update user" });
    }
  }

  // ================= DELETE USER =================
  static async deleteUser(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await service.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (err: any) {
      console.error("Delete user error:", err);
      res.status(500).json({ message: err.message || "Failed to delete user" });
    }
  }

  // ================= GET USER ADDRESSES =================
  static async getUserAddresses(req: Request, res: Response) {
    try {
      const userId = Number(req.params.id);
      if (!userId) return res.status(400).json({ message: "Invalid user id" });

      const addresses = await service.getUserAddresses(userId);
      res.json(addresses);
    } catch (err: any) {
      console.error("Get user addresses error:", err);
      res
        .status(500)
        .json({ message: err.message || "Failed to get addresses" });
    }
  }
}
