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
