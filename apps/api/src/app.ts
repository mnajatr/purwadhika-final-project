import express from "express";
import cors from "cors";
import cartRouter from "./routes/cart.routes.js";
import ordersRouter from "./routes/orders.routes.js";
import productRoutes from "./routes/product.routes.js";
import { v2 as cloudinary } from "cloudinary";
import logger from "./utils/logger.js";
import { prisma } from "@repo/database";
import { CreateUserSchema } from "@repo/schemas";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/notFound.middleware.js";
import { apiRateLimit } from "./middleware/rateLimit.middleware.js";
// Boot background workers/queues
import "./workers/orderCancelWorker.js";

export class App {
  public app: express.Application;

  constructor() {
    this.app = express();

    // Configure Cloudinary at startup from env to ensure SDK has credentials
    try {
      if (process.env.CLOUDINARY_URL) {
        // cloudinary://<api_key>:<api_secret>@<cloud_name>
        try {
          const parsed = new URL(process.env.CLOUDINARY_URL);
          const apiKey = parsed.username;
          const apiSecret = parsed.password;
          const cloudName = parsed.hostname;
          if (apiKey && apiSecret && cloudName) {
            cloudinary.config({
              cloud_name: cloudName,
              api_key: apiKey,
              api_secret: apiSecret,
              secure: true,
            });
            logger.info("Cloudinary configured from CLOUDINARY_URL");
          } else {
            cloudinary.config({ secure: true });
            logger.warn("CLOUDINARY_URL present but parsing failed");
          }
        } catch (err) {
          cloudinary.config({ secure: true });
          logger.warn("Failed to parse CLOUDINARY_URL:", String(err));
        }
      } else if (process.env.CLOUDINARY_CLOUD_NAME) {
        cloudinary.config({
          cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
          api_key: process.env.CLOUDINARY_API_KEY,
          api_secret: process.env.CLOUDINARY_API_SECRET,
          secure: true,
        });
        logger.info("Cloudinary configured from CLOUDINARY_CLOUD_NAME/API_KEY");
      }
    } catch (err) {
      logger.warn("Cloudinary configuration error:", String(err));
    }

    this.app.use(cors({ origin: "http://localhost:3000", credentials: true }));
    this.app.use(apiRateLimit);
    this.app.use(express.json());

    this.app.use("/api/cart", cartRouter);
    this.app.use("/api/orders", ordersRouter);
    this.app.use("/api/products", productRoutes);

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

    // Internal debug: report Cloudinary configuration status (non-sensitive)
    this.app.get("/api/_internal/cloudinary", (req, res) => {
      try {
        const cfg = cloudinary.config();
        // only return cloud_name and whether CLOUDINARY_URL exists
        res.json({
          cloud_name: cfg.cloud_name || null,
          has_url_env: !!process.env.CLOUDINARY_URL,
          has_key_env: !!process.env.CLOUDINARY_API_KEY,
        });
      } catch (err) {
        logger.error(String(err));
        res.status(500).json({ error: String(err) });
      }
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

    this.app.post("/api/products", async (req, res) => {
      try {
        const product = await prisma.product.create({
          data: {
            name: req.body.name,
            slug: req.body.slug,
            description: req.body.description,
            price: req.body.price,
            weight: req.body.weight,
            width: req.body.width,
            height: req.body.height,
            length: req.body.length,
            category: {
              connect: { id: req.body.categoryId },
            },
            images: req.body.images
              ? {
                  create: req.body.images.map((img: any) => ({
                    imageUrl: img.imageUrl,
                  })),
                }
              : undefined,
            inventories: req.body.inventories
              ? {
                  create: req.body.inventories.map((inv: any) => ({
                    stockQty: inv.stockQty,
                    store: { connect: { id: inv.storeId } },
                  })),
                }
              : undefined,
          },
          include: {
            category: true,
            inventories: { include: { store: true } },
            images: true,
          },
        });

        res.status(201).json({ message: "Product created", product });
      } catch (err) {
        res
          .status(500)
          .json({ message: "Failed to create product", error: String(err) });
      }
    });

    this.app.use(notFoundMiddleware);
    this.app.use(errorMiddleware);
  }

  listen(port: number | string) {
    this.app.listen(port, () => {
      logger.info(`Server is listening on port: ${port}`);
    });
  }
}

export default App;
