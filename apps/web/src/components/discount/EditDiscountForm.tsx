"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  DiscountResponse,
  UpdateDiscount,
  ValueType,
  DiscountType,
} from "@/types/discount.types";
import { useUpdateDiscount } from "@/hooks/useDiscount";

type FormValues = {
  name?: string;
  value?: ValueType;
  type?: DiscountType;
  amount?: number;
  minPurchase?: number;
  maxDiscount?: number;
  expiredAt?: string;
  storeId?: number;
  productId?: number;
  buyQty?: number;
  getQty?: number;
};

export default function EditDiscountForm({
  discount,
}: {
  discount: DiscountResponse;
}) {
  const updateDiscount = useUpdateDiscount();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors },
  } = useForm<FormValues>({
    defaultValues: {
      name: "",
      value: ValueType.PRODUCT_DISCOUNT,
      type: DiscountType.PERCENTAGE,
      amount: undefined,
      minPurchase: undefined,
      maxDiscount: undefined,
      expiredAt: "",
      storeId: undefined,
      productId: undefined,
      buyQty: 1,
      getQty: 1,
    },
  });

  const selectedValue = watch("value");

  useEffect(() => {
    if (!discount) return;

    const expiredRaw = discount.expiredAt;
    const expired = expiredRaw
      ? typeof expiredRaw === "string"
        ? expiredRaw.split("T")[0]
        : new Date(expiredRaw).toISOString().split("T")[0]
      : "";

    reset({
      name: discount.name ?? "",
      value: discount.value ?? ValueType.PRODUCT_DISCOUNT,
      type: discount.type ?? DiscountType.PERCENTAGE,
      amount: discount.amount ?? undefined,
      minPurchase: discount.minPurchase ?? undefined,
      maxDiscount: discount.maxDiscount ?? undefined,
      expiredAt: expired,
      storeId: discount.store?.id ?? undefined,
      productId: discount.product?.id ?? undefined,
      buyQty: discount.buyQty ?? 1,
      getQty: discount.getQty ?? 1,
    });
  }, [discount, reset]);

  const onSubmit = (data: FormValues) => {
    const payload: UpdateDiscount = {
      name: data.name,
      value: data.value,
      type: data.type,
      amount: data.amount !== undefined ? Number(data.amount) : undefined,
      minPurchase:
        data.minPurchase !== undefined ? Number(data.minPurchase) : undefined,
      maxDiscount:
        data.maxDiscount !== undefined ? Number(data.maxDiscount) : undefined,
      expiredAt: data.expiredAt
        ? new Date(data.expiredAt + "T23:59:59Z").toISOString()
        : undefined,
      store: data.storeId ? { id: Number(data.storeId) } : undefined,
      product: data.productId ? { id: Number(data.productId) } : undefined,
      buyQty: data.buyQty ?? 1,
      getQty: data.getQty ?? 1,
    };

    updateDiscount.mutate(
      { id: discount.id, data: payload },
      {
        onSuccess: () => alert("✅ Discount updated"),
        onError: (err: any) => alert("Update failed: " + (err?.message ?? err)),
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl mx-auto p-6 bg-white shadow rounded-lg space-y-4"
    >
      <h2 className="text-2xl font-bold mb-4">Edit Discount</h2>

      {/* Name */}
      <input
        type="text"
        placeholder="Discount Name"
        {...register("name", { required: "Name wajib diisi" })}
        className="w-full p-2 border rounded"
      />
      {errors.name && (
        <p className="text-sm text-red-500">{errors.name.message}</p>
      )}

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
        {...register("value", { required: true })}
        className="w-full p-2 border rounded"
      >
        <option value={ValueType.PRODUCT_DISCOUNT}>Product Discount</option>
        <option value={ValueType.BUY1GET1}>Buy 1 Get 1</option>
      </select>

      {/* Product Discount */}
      {selectedValue === ValueType.PRODUCT_DISCOUNT && (
        <>
          <p className="text-sm font-semibold">Type</p>
          <select
            {...register("type", { required: true })}
            className="w-full p-2 border rounded"
          >
            <option value={DiscountType.PERCENTAGE}>Percentage</option>
            <option value={DiscountType.NOMINAL}>Nominal</option>
          </select>

          <input
            type="number"
            placeholder="Discount Amount"
            {...register("amount", { valueAsNumber: true })}
            className="w-full p-2 border rounded"
          />
        </>
      )}

      {/* Buy 1 Get 1 */}
      {selectedValue === ValueType.BUY1GET1 && (
        <div className="grid grid-cols-2 gap-4">
          <input
            type="number"
            placeholder="Buy Quantity"
            {...register("buyQty", { valueAsNumber: true })}
            className="w-full p-2 border rounded"
          />
          <input
            type="number"
            placeholder="Get Quantity"
            {...register("getQty", { valueAsNumber: true })}
            className="w-full p-2 border rounded"
          />
        </div>
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
        disabled={updateDiscount.isPending}
        className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {updateDiscount.isPending ? "Menyimpan..." : "Update Discount"}
      </button>
    </form>
  );
}
