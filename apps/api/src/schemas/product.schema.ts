import { z } from "zod";

const MAX_FILE_SIZE = 1024 * 1024; // 1MB
const ACCEPTED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/jpg",
];

export const inventorySchema = z.object({
  storeId: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val), "Store harus dipilih"),
});

export const productForCreateSchema = z.object({
  name: z.string().min(1, "Nama wajib diisi"),
  slug: z.string().min(1, "Slug wajib diisi"),
  description: z.string().optional(),
  price: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => val > 0, "Harga harus lebih dari 0"),
  weight: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => val > 0, "Berat harus lebih dari 0"),
  width: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
  height: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
  length: z
    .union([z.string(), z.number()])
    .optional()
    .transform((val) => (val ? Number(val) : undefined)),
  categoryId: z
    .union([z.string(), z.number()])
    .transform((val) => Number(val))
    .refine((val) => !isNaN(val), "Kategori harus dipilih"),
  images: z
    .array(z.any())
    .optional()
    .refine(
      (files) =>
        !files ||
        files.every((file: File) => ACCEPTED_IMAGE_TYPES.includes(file.type)),
      "Hanya file .jpg, .jpeg, .png, .gif yang diperbolehkan"
    )
    .refine(
      (files) =>
        !files || files.every((file: File) => file.size <= MAX_FILE_SIZE),
      "Ukuran maksimum file adalah 1MB"
    ),
  inventories: z
    .union([z.string(), z.array(inventorySchema)])
    .transform((val) => (typeof val === "string" ? JSON.parse(val) : val))
    .optional(),
});
