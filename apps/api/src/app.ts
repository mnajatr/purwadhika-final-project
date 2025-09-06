import express from "express";
import cors from "cors";
import cartRouter from "./routes/cart.routes.js";
import ordersRouter from "./routes/orders.routes.js";
import { prisma } from "@repo/database";
import { CreateUserSchema } from "@repo/schemas";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/notFound.middleware.js";
import { apiRateLimit } from "./middleware/rateLimit.middleware.js";

export class App {
  public app: express.Application;

  constructor() {
    this.app = express();

    this.app.use(cors({ origin: "http://localhost:3000", credentials: true }));
    this.app.use(apiRateLimit);
    this.app.use(express.json());

    this.app.use("/api/cart", cartRouter);
    this.app.use("/api/orders", ordersRouter);

    this.app.get("/api/health", (request, response) =>
      response.status(200).json({ message: "API running!" })
    );

    this.app.get("/api/users", async (request, response) => {
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
    });

    this.app.get("/api/users/:id", async (request, response) => {
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
    });

    // Return addresses for a user (used by frontend checkout)
    this.app.get("/api/users/:id/addresses", async (request, response) => {
      const { id } = request.params;
      const userId = parseInt(id as string);
      if (!userId)
        return response.status(400).json({ message: "Invalid user id" });
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
    });

    this.app.post("/api/users", async (request, response) => {
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
    });

    this.app.use(notFoundMiddleware);
    this.app.use(errorMiddleware);
  }

  listen(port: number | string) {
    this.app.listen(port, () => {
      console.info(`Server is listening on port: ${port}`);
    });
  }
}

export default App;
