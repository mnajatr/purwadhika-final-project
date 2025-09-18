import { Request, Response } from "express";
import { UsersService } from "../services/user.service.js";
import { CreateUserSchema, UpdateUserSchema } from "@repo/schemas";

export class UsersController {
  static async createUser(req: Request, res: Response) {
    try {
      const parsed = CreateUserSchema.safeParse(req.body);

      if (!parsed.success) {
        return res.status(400).json({
          message: "Validation error",
          errors: parsed.error.issues,
        });
      }

      const user = await UsersService.createUser(parsed.data);
      res.status(201).json(user);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  static async getUsers(_req: Request, res: Response) {
    try {
      const users = await UsersService.getUsers();
      res.json(users);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  static async getUserById(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const user = await UsersService.getUserById(id);
      if (!user) return res.status(404).json({ message: "User not found" });
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

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

      const user = await UsersService.updateUser(id, parsed.data);
      res.json(user);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  static async deleteUser(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await UsersService.deleteUser(id);
      res.json({ message: "User deleted successfully" });
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }

  static async getUserAddresses(req: Request, res: Response) {
    try {
      const userId = Number(req.params.id);
      if (!userId) return res.status(400).json({ message: "Invalid user id" });

      const addresses = await UsersService.getUserAddresses(userId);
      res.json(addresses);
    } catch (err) {
      res.status(500).json({ message: (err as Error).message });
    }
  }
}
