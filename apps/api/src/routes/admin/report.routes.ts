import { Router } from "express";
import {
  getSalesReport,
  getSalesByCategory,
  getSalesByProduct,
  getStockSummary,
  getStockDetail,
} from "../../controllers/report.controller.js";

const router = Router();

// Sales
router.get("/sales", getSalesReport);
router.get("/sales/by-category", getSalesByCategory);
router.get("/sales/by-product", getSalesByProduct);

// Stock
router.get("/stock/summary", getStockSummary);
router.get("/stock/detail", getStockDetail);

export default router;
