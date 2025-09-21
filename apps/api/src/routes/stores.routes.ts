import { Router } from "express";
import { StoresController } from "../controllers/stores.controller.js";

const storesRouter = Router();

// GET /api/stores - Get all active stores
storesRouter.get("/", StoresController.getStores);
// GET /api/stores/resolve?lat=..&lon=.. - Resolve nearest store for coordinates
storesRouter.get("/resolve", StoresController.resolveNearest);

export default storesRouter;
