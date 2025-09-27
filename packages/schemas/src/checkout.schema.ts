import { z } from "zod";

export const CheckoutSchema = z.object({
  items: z
    .array(
      z.object({
        productId: z.number().int().positive(),
        qty: z.number().int().positive(),
      })
    )
    .min(1, "Order must contain at least one item"),
  idempotencyKey: z.string().optional(),
  userLat: z.number().optional(),
  userLon: z.number().optional(),
  addressId: z.number().int().positive("Delivery address is required"),
  paymentMethod: z.enum(["Manual", "Gateway"]).refine(val => val, {
    message: "Payment method is required",
  }),
  shippingMethod: z.enum(["JNE", "J&T", "Ninja Xpress"]).refine(val => val, {
    message: "Shipping method is required",
  }),
  shippingOption: z.string().optional(),
});

export type CheckoutData = z.infer<typeof CheckoutSchema>;