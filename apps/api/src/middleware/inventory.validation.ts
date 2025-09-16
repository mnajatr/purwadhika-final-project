import {
  TransferBodySchema,
  UpdateStockBodySchema,
  StockJournalsQuerySchema,
  StoreInventoryParamsSchema,
  StoreInventoryQuerySchema,
  InventoryReportQuerySchema,
} from "@repo/schemas";

import {
  validateBody,
  validateParams,
  validateQuery,
} from "./validation.middleware.js";

export const transferInventoryValidation = validateBody(TransferBodySchema);
export const updateStockValidation = validateBody(UpdateStockBodySchema);
export const getStockJournalsValidation = validateQuery(StockJournalsQuerySchema);
export const getStoreInventoryValidation = [
  validateParams(StoreInventoryParamsSchema),
  validateQuery(StoreInventoryQuerySchema),
];
export const getInventoryReportValidation = validateQuery(InventoryReportQuerySchema);
