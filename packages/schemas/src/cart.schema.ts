import { z } from "zod";

// ID validation helper for integers
const idSchema = z.number().int().positive("ID must be a positive integer");

// Add to Cart Schema
export const AddToCartSchema = z.object({
  productId: idSchema,
  qty: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(99, "Quantity cannot exceed 99 per item"),
  storeId: idSchema,
  userId: idSchema.optional(), // Will be from auth later
});

// Update Cart Item Schema
export const UpdateCartItemSchema = z.object({
  qty: z
    .number()
    .int("Quantity must be an integer")
    .min(1, "Quantity must be at least 1")
    .max(99, "Quantity cannot exceed 99 per item"),
  userId: idSchema.optional(), // Will be from auth later
});

// Cart Item ID param validation (string from URL params)
export const CartItemParamsSchema = z.object({
  itemId: z.string().regex(/^\d+$/, "Item ID must be a valid number"),
});

// User ID query validation (string from query params)
export const UserQuerySchema = z.object({
  userId: z
    .string()
    .regex(/^\d+$/, "User ID must be a valid number")
    .optional(),
});

// Type exports
export type AddToCartInput = z.infer<typeof AddToCartSchema>;
export type UpdateCartItemInput = z.infer<typeof UpdateCartItemSchema>;
export type CartItemParams = z.infer<typeof CartItemParamsSchema>;
export type UserQuery = z.infer<typeof UserQuerySchema>;
