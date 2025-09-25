import express, { Application, Request, Response } from "express";
import cors from "cors";
import cartRouter from "./routes/cart.routes.js";
import ordersRouter from "./routes/orders.routes.js";
import productRoutes from "./routes/product.routes.js";
import adminRouter from "./routes/admin.routes.js";
import usersRouter from "./routes/users.routes.js";
import storesRouter from "./routes/stores.routes.js";
import discountRouter from "./routes/admin/discount.routes.js";
import categoryRouter from "./routes/admin/category.routes.js";
import reportRouter from "./routes/admin/report.routes.js";
import paymentRoutes from "./routes/payment.routes.js";
import debugRoutes from "./routes/debug.routes.js";
import { setupCloudinary } from "./configs/cloudinary.config.js";
import logger from "./utils/logger.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import { notFoundMiddleware } from "./middleware/notFound.middleware.js";
import { apiRateLimit } from "./middleware/rateLimit.middleware.js";
// Boot background workers/queues (side-effects)
import "./workers/orderCancelWorker.js";
import "./workers/orderConfirmWorker.js";
import "./workers/autoConfirmWorker.js";

export class App {
  app: Application;

  constructor() {
    this.app = express();
    setupCloudinary();
    this.setupMiddleware();
    this.setupRoutes();
    this.setupErrorHandling();
  }

  setupMiddleware() {
    this.app.use(
      cors({
        origin: process.env.API_CORS_ORIGIN || "http://localhost:3000",
        credentials: true,
      })
    );
    this.app.use(apiRateLimit);
    this.app.use(express.json());
  }

  setupRoutes() {
    this.app.use("/api/cart", cartRouter);
    this.app.use("/api/orders", ordersRouter);
    this.app.use("/api/products", productRoutes);
    this.app.use("/api/admin", adminRouter);
    this.app.use("/api/users", usersRouter);
    this.app.use("/api/stores", storesRouter);
    this.app.use("/api/discounts", discountRouter);
    this.app.use("/api/category", categoryRouter);
    this.app.use("/api/reports", reportRouter);
    this.app.use("/api/payments", paymentRoutes);
    if (process.env.NODE_ENV !== "production") {
      this.app.use("/api/debug", debugRoutes);
    }
    // Debug routes removed for production; keep local/dev-only debug routes out of main app.

    this.app.get("/api/health", (request: Request, response: Response) =>
      response.status(200).json({ message: "API running!" })
    );
  }

  setupErrorHandling() {
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
