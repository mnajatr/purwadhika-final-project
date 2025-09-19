import { z } from "zod";

export const CreateUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  role: z.enum(["USER", "SUPER_ADMIN", "STORE_ADMIN"]).optional(),
  profile: z
    .object({
      fullName: z.string().min(3, "Full name must be at least 3 characters"),
      avatarUrl: z.string().url("Invalid URL").optional(),
    })
    .optional(),
});

export const UpdateUserSchema = z.object({
  email: z.string().email("Invalid email format").optional(),
  password: z
    .string()
    .min(6, "Password must be at least 6 characters")
    .optional(),
  role: z.enum(["USER", "SUPER_ADMIN", "STORE_ADMIN"]).optional(),
  profile: z
    .object({
      fullName: z.string().min(3, "Full name must be at least 3 characters"),
      avatarUrl: z.string().url("Invalid URL").optional(),
    })
    .optional(),
});

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
