import { z } from "zod";

const idSchema = z.number().int().positive("ID must be a positive integer");

export const OrderStatusEnum = z.enum([
  "PENDING_PAYMENT",
  "PAYMENT_REVIEW",
  "PAID",
  "PROCESSING",
  "SHIPPED",
  "COMPLETED",
  "CONFIRMED",
  "CANCELLED",
  "EXPIRED",
]);

export const PaymentMethodEnum = z.enum([
  "MANUAL_TRANSFER",
  "GATEWAY",
  "UNKNOWN",
]);

export const PaymentStatusEnum = z.enum([
  "PENDING",
  "PAID",
  "FAILED",
  "REJECTED",
]);

export const ProductImageSchema = z.object({
  imageUrl: z.string(),
  url: z.string().optional(),
});

export const OrderProductSchema = z.object({
  id: idSchema,
  name: z.string(),
  price: z.number().optional(),
  images: z.array(ProductImageSchema).optional(),
});

export const OrderItemSchema = z.object({
  id: idSchema,
  productId: idSchema,
  qty: z.number().int().positive(),
  totalAmount: z.number().optional(),
  product: OrderProductSchema.nullable().optional(),
});

export const OrderAddressSchema = z.object({
  recipientName: z.string(),
  addressLine: z.string(),
  city: z.string(),
  province: z.string(),
  postalCode: z.string(),
  phoneNumber: z.string().optional(),
});

export const StoreLocationSchema = z.object({
  city: z.string(),
  province: z.string(),
  addressLine: z.string().optional(),
});

export const OrderStoreSchema = z.object({
  id: idSchema,
  name: z.string(),
  locations: z.array(StoreLocationSchema).optional(),
});

export const OrderPaymentSchema = z.object({
  status: PaymentStatusEnum.optional(),
  amount: z.number().optional(),
  proofUrl: z.string().optional(),
});

export const OrderDetailSchema = z.object({
  id: idSchema,
  status: OrderStatusEnum,
  paymentMethod: PaymentMethodEnum.nullable().optional(),
  grandTotal: z.number().optional(),
  createdAt: z.union([z.string(), z.date()]).nullable().optional(),
  updatedAt: z.union([z.string(), z.date()]).nullable().optional(),
  shippedAt: z.union([z.string(), z.date()]).nullable().optional(),
  confirmedAt: z.union([z.string(), z.date()]).nullable().optional(),
  items: z.array(OrderItemSchema),
  payment: OrderPaymentSchema.nullable().optional(),
  address: OrderAddressSchema.nullable().optional(),
  store: OrderStoreSchema.nullable().optional(),
  userId: idSchema.optional(),
});

export const OrderListItemSchema = OrderDetailSchema.partial({
  items: true,
  payment: true,
  address: true,
  store: true,
});

export const CreateOrderItemSchema = z.object({
  productId: idSchema,
  qty: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(99, "Quantity cannot exceed 99 per item"),
});

export const CreateOrderSchema = z.object({
  items: z.array(CreateOrderItemSchema).min(1, "At least one item is required"),
  userId: idSchema,
  storeId: idSchema.optional(),
  idempotencyKey: z.string().optional(),
  userLat: z.number().optional(),
  userLon: z.number().optional(),
  addressId: idSchema.optional(),
  paymentMethod: z.string().optional(),
  shippingMethod: z.string().optional(),
  shippingOption: z.string().optional(),
});

export const OrdersFilterSchema = z.object({
  q: z.union([z.string(), z.number()]).optional(),
  status: z.string().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().max(100).optional(),
});

export const OrdersListResponseSchema = z.object({
  items: z.array(OrderListItemSchema).optional(),
  total: z.number().optional(),
  page: z.number().optional(),
  pageSize: z.number().optional(),
});

export type OrderStatus = z.infer<typeof OrderStatusEnum>;
export type PaymentMethod = z.infer<typeof PaymentMethodEnum>;
export type PaymentStatus = z.infer<typeof PaymentStatusEnum>;
export type OrderItem = z.infer<typeof OrderItemSchema>;
export type OrderDetail = z.infer<typeof OrderDetailSchema>;
export type OrderListItem = z.infer<typeof OrderListItemSchema>;
export type CreateOrderItem = z.infer<typeof CreateOrderItemSchema>;
export type CreateOrderInput = z.infer<typeof CreateOrderSchema>;
export type OrdersFilter = z.infer<typeof OrdersFilterSchema>;
export type OrdersListResponse = z.infer<typeof OrdersListResponseSchema>;
