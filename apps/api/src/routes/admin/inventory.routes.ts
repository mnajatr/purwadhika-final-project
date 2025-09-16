import { Router } from "express";
import { inventoryController } from "../../controllers/inventory.controller.js";
import {
  transferInventoryValidation,
  updateStockValidation,
  getStockJournalsValidation,
  getStoreInventoryValidation,
  getInventoryReportValidation,
} from "../../middleware/inventory.validation.js";

const router = Router();

// GET /admin/inventory/stores - Get all stores for dropdown
router.get("/stores", inventoryController.getAllStores);

// GET /admin/inventory/stores/:storeId/inventory - Get inventory for specific store
router.get("/stores/:storeId", 
  getStoreInventoryValidation,
  inventoryController.getStoreInventories
);

// POST /admin/inventory/transfer - Transfer inventory between stores
router.post("/transfer", 
  transferInventoryValidation,
  inventoryController.transferInventory
);

// GET /admin/inventory/stock-journals - Get stock journal entries
router.get("/stock-journals", 
  getStockJournalsValidation,
  inventoryController.getStockJournals
);

// POST /admin/inventory/update-stock - Manual stock adjustment
router.post("/update-stock", 
  updateStockValidation,
  inventoryController.updateStockManual
);

// GET /admin/inventory/report - Get inventory report
router.get("/report", 
  getInventoryReportValidation,
  inventoryController.getInventoryReport
);

export default router;