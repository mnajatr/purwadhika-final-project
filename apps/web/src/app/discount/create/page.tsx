"use client";

import { useForm } from "react-hook-form";
import { useCreateDiscount } from "@/hooks/useDiscount";
import { DiscountResponse } from "@/types/discount.types";

export default function CreateDiscountForm() {
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DiscountResponse>({
    defaultValues: {
      value: "PRODUCT_DISCOUNT",
      type: "PERCENTAGE",
    },
  });

  const createDiscount = useCreateDiscount();

  const onSubmit = (data: DiscountResponse) => {
    createDiscount.mutate(
      {
        ...data,
        storeId: Number(data.storeId),
        productId: Number(data.productId),
        minPurchase: data.minPurchase ? Number(data.minPurchase) : undefined,
        maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : undefined,
        expiredAt: new Date(data.expiredAt + "T23:59:59Z"),
      },
      {
        onSuccess: () => {
          alert("✅ Discount created successfully!");
          reset();
        },
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl mx-auto p-6 bg-white shadow rounded-lg space-y-4"
    >
      <h2 className="text-2xl font-bold mb-4">Tambah Discount</h2>

      {/* Store ID */}
      <input
        type="number"
        placeholder="Store ID"
        {...register("storeId", { required: "Store ID wajib diisi" })}
        className="w-full p-2 border rounded"
      />
      {errors.storeId && (
        <p className="text-sm text-red-500">{errors.storeId.message}</p>
      )}

      {/* Product ID */}
      <input
        type="number"
        placeholder="Product ID"
        {...register("productId", { required: "Product ID wajib diisi" })}
        className="w-full p-2 border rounded"
      />
      {errors.productId && (
        <p className="text-sm text-red-500">{errors.productId.message}</p>
      )}

      {/* Value */}
      <p className="text-sm font-semibold">Value</p>
      <select
        {...register("value", { required: true })}
        className="w-full p-2 border rounded"
      >
        <option value="PRODUCT_DISCOUNT">Product Discount</option>
        <option value="BUY1GET1">Buy 1 Get 1</option>
      </select>

      {/* Type */}
      <p className="text-sm font-semibold">Type</p>
      <select
        {...register("type", { required: true })}
        className="w-full p-2 border rounded"
      >
        <option value="PERCENTAGE">Percentage</option>
        <option value="NOMINAL">Nominal</option>
      </select>

      {/* Min & Max */}
      <div className="grid grid-cols-2 gap-4">
        <input
          type="number"
          placeholder="Minimum Purchase"
          {...register("minPurchase")}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Maximum Discount"
          {...register("maxDiscount")}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Expired At */}
      <p className="text-sm font-semibold">Expired At</p>
      <input
        type="date"
        {...register("expiredAt", { required: "Tanggal wajib diisi" })}
        className="w-full p-2 border rounded"
      />
      {errors.expiredAt && (
        <p className="text-sm text-red-500">{errors.expiredAt.message}</p>
      )}

      {/* Submit */}
      <button
        type="submit"
        disabled={createDiscount.isPending}
        className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {createDiscount.isPending ? "Menyimpan..." : "Simpan Discount"}
      </button>
    </form>
  );
}
