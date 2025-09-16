import { z } from "zod";

// --- helpers ---------------------------------------------------------------
// coerce strings -> numbers and enforce integer positive constraints
const positiveInt = z.coerce.number().int().min(1);
const optionalPositiveInt = positiveInt.optional();

const dateString = (name = "date") =>
  z.string().optional().refine((val) => !val || !isNaN(Date.parse(val)), { message: `${name} must be a valid ISO8601 date` });

const clampLimit = (max = 100) =>
  optionalPositiveInt.transform((v) => (v === undefined ? undefined : Math.min(v, max))).optional();

// --- item / body schemas --------------------------------------------------
export const ItemSchema = z.object({
  productId: positiveInt,
  qty: positiveInt,
});

export const TransferBodySchema = z.object({
  fromStoreId: positiveInt,
  toStoreId: positiveInt,
  items: z.array(ItemSchema).min(1),
  note: z.string().min(1).max(500).optional(),
}).superRefine((data, ctx) => {
  if (data.fromStoreId === data.toStoreId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["toStoreId"], message: "Source and destination stores must be different" });
  }
});

export const UpdateStockBodySchema = z.object({
  storeId: positiveInt,
  productId: positiveInt,
  qtyChange: positiveInt,
  reason: z.enum(["ADD", "REMOVE"]),
});

// --- query / params schemas -----------------------------------------------
export const StockJournalsQuerySchema = z.object({
  storeId: optionalPositiveInt,
  productId: optionalPositiveInt,
  page: optionalPositiveInt,
  limit: clampLimit(100),
  reason: z.enum(["ADD", "REMOVE", "TRANSFER_IN", "TRANSFER_OUT", "RESERVE", "RELEASE"]).optional(),
  startDate: dateString("startDate"),
  endDate: dateString("endDate"),
}).superRefine((data, ctx) => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate as string);
    const end = new Date(data.endDate as string);
    if (end < start) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "End date must be after start date" });
  }
});

export const StoreInventoryParamsSchema = z.object({ storeId: positiveInt });

export const StoreInventoryQuerySchema = z.object({
  page: optionalPositiveInt,
  limit: clampLimit(100),
  search: z.string().min(1).max(100).optional(),
});

export const InventoryReportQuerySchema = z.object({
  storeId: optionalPositiveInt,
  startDate: dateString("startDate"),
  endDate: dateString("endDate"),
}).superRefine((data, ctx) => {
  if (data.startDate && data.endDate) {
    const start = new Date(data.startDate as string);
    const end = new Date(data.endDate as string);
    if (end < start) ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["endDate"], message: "End date must be after start date" });
  }
});

// --- types ---------------------------------------------------------------
export type TransferBody = z.infer<typeof TransferBodySchema>;
export type UpdateStockBody = z.infer<typeof UpdateStockBodySchema>;
export type StockJournalsQuery = z.infer<typeof StockJournalsQuerySchema>;
export type StoreInventoryParams = z.infer<typeof StoreInventoryParamsSchema>;
export type StoreInventoryQuery = z.infer<typeof StoreInventoryQuerySchema>;
export type InventoryReportQuery = z.infer<typeof InventoryReportQuerySchema>;

