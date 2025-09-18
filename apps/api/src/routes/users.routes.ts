import { Router } from "express";
import { UsersController } from "../controllers/users.controller.js";

const router = Router();

// CRUD User
router.post("/", UsersController.createUser); // Create
router.get("/", UsersController.getUsers); // Read all
router.get("/:id", UsersController.getUserById); // Read by ID
router.put("/:id", UsersController.updateUser); // Update
router.delete("/:id", UsersController.deleteUser); // Delete

// Get User Addresses
router.get("/:id/addresses", UsersController.getUserAddresses);

export default router;
