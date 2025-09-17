import { Router } from "express";
import { UsersController } from "../controllers/users.controller.js";

const usersRouter = Router();

// GET /api/users - List all users
usersRouter.get("/", UsersController.getUsers);

// GET /api/users/:id - Get single user by ID
usersRouter.get("/:id", UsersController.getUserById);

// POST /api/users - Create new user
usersRouter.post("/", UsersController.createUser);

// GET /api/users/:id/addresses - Get user addresses
usersRouter.get("/:id/addresses", UsersController.getUserAddresses);

export default usersRouter;
