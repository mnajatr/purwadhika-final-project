import { Router } from "express";
import { UsersController } from "../controllers/users.controller.js";
import { adminAuth } from "../middleware/admin.middleware.js";

const router = Router();

// CRUD User
router.post("/", adminAuth, UsersController.createUser); // Create
router.get("/", UsersController.getUsers); // Read all
router.get("/:id", UsersController.getUserById); // Read by ID
router.put("/:id", adminAuth, UsersController.updateUser); // Update
router.delete("/:id", adminAuth, UsersController.deleteUser); // Delete

// Get User Addresses
router.get("/:id/addresses", UsersController.getUserAddresses);

export default router;
