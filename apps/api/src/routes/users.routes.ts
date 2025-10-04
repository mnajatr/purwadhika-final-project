import { Router } from "express";
import { UsersController } from "../controllers/users.controller.js";
import { adminAuth } from "../middleware/admin.middleware.js";
import { authMiddleware } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/", adminAuth, UsersController.createUser);
router.get("/", UsersController.getUsers);
router.get("/:id", authMiddleware, UsersController.getUserById);
router.put("/:id", adminAuth, UsersController.updateUser);
router.delete("/:id", adminAuth, UsersController.deleteUser);

router.get("/:id/addresses", authMiddleware, UsersController.getUserAddresses);

export default router;
