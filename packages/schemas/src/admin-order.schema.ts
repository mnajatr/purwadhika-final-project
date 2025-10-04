import { z } from "zod";
import { OrderStatusEnum, PaymentMethodEnum, PaymentStatusEnum } from "./order.schema.js";

const idSchema = z.number().int().positive();

export const AdminOrderUserSchema = z.object({
  id: idSchema, 
  name: z.string(),
  email: z.string(),
});

export const AdminOrderStoreSchema = z.object({
  id: idSchema,
  name: z.string(),
});

export const AdminOrderProductSchema = z.object({
  id: idSchema,
  name: z.string(),
  price: z.string(),
});

export const AdminOrderItemSchema = z.object({
  id: idSchema,
  productId: idSchema,
  qty: z.number().int().positive(),
  totalAmount: z.number(),
  product: AdminOrderProductSchema,
});

export const AdminOrderPaymentSchema = z.object({
  id: idSchema,
  status: PaymentStatusEnum,
  proofImageUrl: z.string().nullable(),
  reviewedAt: z.string().nullable(),
});

export const AdminOrderListItemSchema = z.object({
  id: idSchema,
  userId: idSchema,
  storeId: idSchema,
  status: OrderStatusEnum,
  grandTotal: z.number(),
  totalItems: z.number(),
  createdAt: z.string(),
  paymentMethod: PaymentMethodEnum,
  payment: AdminOrderPaymentSchema.nullable(),
  items: z.array(AdminOrderItemSchema),
  user: AdminOrderUserSchema.optional(),
  store: AdminOrderStoreSchema.optional(),
});

export const AdminOrdersListResponseSchema = z.object({
  items: z.array(AdminOrderListItemSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
});

export const AdminOrdersFilterSchema = z.object({
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
  status: z.string().optional(),
  q: z.string().optional(),
  storeId: z.number().int().positive().optional(),
  from: z.date().optional(),
  to: z.date().optional(),
});

export type AdminOrderUser = z.infer<typeof AdminOrderUserSchema>;
export type AdminOrderStore = z.infer<typeof AdminOrderStoreSchema>;
export type AdminOrderProduct = z.infer<typeof AdminOrderProductSchema>;
export type AdminOrderItem = z.infer<typeof AdminOrderItemSchema>;
export type AdminOrderPayment = z.infer<typeof AdminOrderPaymentSchema>;
export type AdminOrderListItem = z.infer<typeof AdminOrderListItemSchema>;
export type AdminOrdersListResponse = z.infer<typeof AdminOrdersListResponseSchema>;
export type AdminOrdersFilter = z.infer<typeof AdminOrdersFilterSchema>;
