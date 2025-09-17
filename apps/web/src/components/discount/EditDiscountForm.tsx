"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { DiscountResponse } from "@/types/discount.types";
import { useUpdateDiscount } from "@/hooks/useDiscount";

interface EditDiscountFormProps {
  discount?: DiscountResponse;
  onClose?: () => void;
}

export default function EditDiscountForm({
  discount,
  onClose,
}: EditDiscountFormProps) {
  const updateDiscount = useUpdateDiscount();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<DiscountResponse>({
    defaultValues: {
      id: 0,
      storeId: 0,
      productId: 0,
      value: "PRODUCT_DISCOUNT",
      type: "PERCENTAGE",
      minPurchase: 0,
      maxDiscount: 0,
      expiredAt: "",
    },
  });

  // Prefill form saat discount tersedia
  useEffect(() => {
    if (discount) {
      reset({
        id: discount.id,
        storeId: discount.storeId,
        productId: discount.productId,
        value: discount.value,
        type: discount.type,
        minPurchase: discount.minPurchase ?? 0,
        maxDiscount: discount.maxDiscount ?? 0,
        expiredAt: discount.expiredAt
          ? new Date(discount.expiredAt).toISOString().split("T")[0]
          : "",
      });
    }
  }, [discount, reset]);

  const onSubmit = (data: DiscountResponse) => {
    console.log("SUBMIT", data);
    if (!discount?.id) return;

    const payload = {
      ...data,
      storeId: Number(data.storeId),
      productId: Number(data.productId),
      minPurchase: data.minPurchase !== null ? Number(data.minPurchase) : null,
      maxDiscount: data.maxDiscount !== null ? Number(data.maxDiscount) : null,
      expiredAt: data.expiredAt ? new Date(data.expiredAt).toISOString() : null,
    };

    updateDiscount.mutate(
      { id: discount.id, data: payload },
      {
        onSuccess: () => {
          alert("Discount berhasil diperbarui!");
          onClose?.();
        },
        onError: (err: any) => {
          alert("Gagal memperbarui discount: " + err.message);
        },
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl mx-auto p-6 bg-white shadow rounded-lg space-y-4"
    >
      <h2 className="text-2xl font-bold mb-4">Edit Discount</h2>

      {/* Store ID */}
      <input
        type="number"
        placeholder="Store ID"
        {...register("storeId", {
          required: "Store ID wajib diisi",
          valueAsNumber: true,
        })}
        className="w-full p-2 border rounded"
      />
      {errors.storeId && (
        <p className="text-sm text-red-500">{errors.storeId.message}</p>
      )}

      {/* Product ID */}
      <input
        type="number"
        placeholder="Product ID"
        {...register("productId", {
          required: "Product ID wajib diisi",
          valueAsNumber: true,
        })}
        className="w-full p-2 border rounded"
      />
      {errors.productId && (
        <p className="text-sm text-red-500">{errors.productId.message}</p>
      )}

      {/* Value */}
      <p className="text-sm font-semibold">Value</p>
      <select
        {...register("value", { required: "Value wajib dipilih" })}
        className="w-full p-2 border rounded"
      >
        <option value="PRODUCT_DISCOUNT">Product Discount</option>
        <option value="BUY1GET1">Buy 1 Get 1</option>
      </select>
      {errors.value && (
        <p className="text-sm text-red-500">{errors.value.message}</p>
      )}

      {/* Type */}
      <p className="text-sm font-semibold">Type</p>
      <select
        {...register("type", { required: "Type wajib dipilih" })}
        className="w-full p-2 border rounded"
      >
        <option value="PERCENTAGE">Percentage</option>
        <option value="NOMINAL">Nominal</option>
      </select>
      {errors.type && (
        <p className="text-sm text-red-500">{errors.type.message}</p>
      )}

      {/* Min & Max */}
      <div className="grid grid-cols-2 gap-4">
        <input
          type="number"
          placeholder="Minimum Purchase"
          {...register("minPurchase", { valueAsNumber: true })}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Maximum Discount"
          {...register("maxDiscount", { valueAsNumber: true })}
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
        disabled={updateDiscount.isLoading}
        className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {updateDiscount.isLoading ? "Menyimpan..." : "Update Discount"}
      </button>
    </form>
  );
}
