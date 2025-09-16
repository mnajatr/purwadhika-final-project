import { body, query, param } from "express-validator";

export const transferInventoryValidation = [
  body("fromStoreId")
    .isInt({ min: 1 })
    .withMessage("From store ID must be a valid positive integer"),
  
  body("toStoreId")
    .isInt({ min: 1 })
    .withMessage("To store ID must be a valid positive integer")
    .custom((value, { req }) => {
      if (value === req.body.fromStoreId) {
        throw new Error("Source and destination stores must be different");
      }
      return true;
    }),
  
  body("items")
    .isArray({ min: 1 })
    .withMessage("Items must be a non-empty array"),
  
  body("items.*.productId")
    .isInt({ min: 1 })
    .withMessage("Product ID must be a valid positive integer"),
  
  body("items.*.qty")
    .isInt({ min: 1 })
    .withMessage("Quantity must be a positive integer"),

  // optional note for transfer/adjustment
  body("note")
    .optional()
    .isLength({ min: 1, max: 500 })
    .withMessage("Note must be between 1 and 500 characters"),
];

export const updateStockValidation = [
  body("storeId")
    .isInt({ min: 1 })
    .withMessage("Store ID must be a valid positive integer"),
  
  body("productId")
    .isInt({ min: 1 })
    .withMessage("Product ID must be a valid positive integer"),
  
  body("qtyChange")
    .isInt({ min: 1 })
    .withMessage("Quantity change must be a positive integer"),
  
  body("reason")
    .isIn(["ADD", "REMOVE"])
    .withMessage("Reason must be either ADD or REMOVE"),
];

export const getStockJournalsValidation = [
  query("storeId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Store ID must be a valid positive integer"),
  
  query("productId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Product ID must be a valid positive integer"),
  
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  
  query("reason")
    .optional()
    .isIn(["ADD", "REMOVE", "TRANSFER_IN", "TRANSFER_OUT", "RESERVE", "RELEASE"])
    .withMessage("Invalid reason value"),
  
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO8601 date"),
  
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO8601 date"),
];

export const getStoreInventoryValidation = [
  param("storeId")
    .isInt({ min: 1 })
    .withMessage("Store ID must be a valid positive integer"),
  
  query("page")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Page must be a positive integer"),
  
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
  
  query("search")
    .optional()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search query must be between 1 and 100 characters"),
];

export const getInventoryReportValidation = [
  query("storeId")
    .optional()
    .isInt({ min: 1 })
    .withMessage("Store ID must be a valid positive integer"),
  
  query("startDate")
    .optional()
    .isISO8601()
    .withMessage("Start date must be a valid ISO8601 date"),
  
  query("endDate")
    .optional()
    .isISO8601()
    .withMessage("End date must be a valid ISO8601 date")
    .custom((value, { req }) => {
      if (req.query?.startDate && value) {
        const startDate = new Date(req.query.startDate as string);
        const endDate = new Date(value);
        if (endDate < startDate) {
          throw new Error("End date must be after start date");
        }
      }
      return true;
    }),
];
