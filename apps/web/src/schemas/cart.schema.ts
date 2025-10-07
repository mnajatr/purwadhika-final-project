import { z } from "zod";

const idSchema = z.number().int().positive("ID must be a positive integer");

export const AddToCartSchema = z.object({
  productId: idSchema,
  qty: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(99, "Quantity cannot exceed 99 per item"),
  storeId: idSchema,
  userId: idSchema.optional(),
});

export const UpdateCartItemSchema = z.object({
  qty: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(99, "Quantity cannot exceed 99 per item"),
  userId: idSchema.optional(),
});

export const CartItemParamsSchema = z.object({
  itemId: z.string().regex(/^\d+$/, "Item ID must be a valid number"),
});

export const UserQuerySchema = z.object({
  userId: z
    .string()
    .regex(/^\d+$/, "User ID must be a valid number")
    .optional(),
});

export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
export type CartItemParams = z.infer<typeof CartItemParamsSchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;

// Response shapes (useful for FE typings)
export const ProductSummarySchema = z.object({
  id: idSchema,
  name: z.string(),
  slug: z.string(),
  description: z.string().nullable(),
  price: z.number(),
  isActive: z.boolean(),
});

export const CartItemResponseSchema = z.object({
  id: idSchema,
  productId: idSchema,
  qty: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
  product: ProductSummarySchema,
  storeInventory: z.object({ stockQty: z.number() }).optional(),
});

export const CartResponseSchema = z.object({
  id: idSchema,
  userId: idSchema,
  createdAt: z.string(),
  updatedAt: z.string(),
  items: z.array(CartItemResponseSchema),
});

export const CartTotalsSchema = z.object({
  totalItems: z.number(),
  totalQuantity: z.number(),
  subtotal: z.number(),
  items: z.array(
    z.object({
      id: idSchema,
      productId: idSchema,
      productName: z.string(),
      quantity: z.number(),
      unitPrice: z.number(),
      total: z.number(),
    })
  ),
});

export type ProductSummary = z.infer<typeof ProductSummarySchema>;
export type CartItemResponse = z.infer<typeof CartItemResponseSchema>;
export type CartResponse = z.infer<typeof CartResponseSchema>;
export type CartTotals = z.infer<typeof CartTotalsSchema>;
