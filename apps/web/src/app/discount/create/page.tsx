"use client";

import { useForm } from "react-hook-form";
import { useCreateDiscount } from "@/hooks/useDiscount";
import { useProducts } from "@/hooks/useProduct";
import {
  CreateDiscount,
  ValueType,
  DiscountType,
} from "@/types/discount.types";
import { useEffect, useState } from "react";

interface CreateDiscountForm extends Omit<CreateDiscount, "store" | "product"> {
  storeId: number;
  productId: number;
}

export default function CreateDiscountForm() {
  const createDiscount = useCreateDiscount();

  const { data } = useProducts();
  const products = data?.products ?? [];

  const [storeId, setStoreId] = useState<number>(0);

  // Ambil storeId dari localStorage setelah mount
  useEffect(() => {
    const id = localStorage.getItem("storeId");
    if (id) setStoreId(Number(id));
  }, []);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CreateDiscountForm>({
    defaultValues: {
      name: "",
      value: ValueType.PRODUCT_DISCOUNT,
      type: DiscountType.PERCENTAGE,
      amount: undefined,
      minPurchase: undefined,
      maxDiscount: undefined,
      expiredAt: "",
      storeId: 0, // sementara 0
      productId: undefined,
      buyQty: 1,
      getQty: 1,
    },
  });

  // Update storeId di form setelah didapat dari localStorage
  useEffect(() => {
    if (storeId) setValue("storeId", storeId);
  }, [storeId, setValue]);

  const selectedValue = watch("value");

  const onSubmit = (data: CreateDiscountForm) => {
    const payload: CreateDiscount = {
      name: data.name,
      value: data.value,
      type: data.type,
      amount: data.amount ? Number(data.amount) : undefined,
      minPurchase: data.minPurchase ? Number(data.minPurchase) : undefined,
      maxDiscount: data.maxDiscount ? Number(data.maxDiscount) : undefined,
      expiredAt: new Date(data.expiredAt + "T23:59:59Z").toISOString(),
      store: { id: Number(data.storeId) },
      product: { id: Number(data.productId) },
      buyQty: data.buyQty ?? 1,
      getQty: data.getQty ?? 1,
    };

    createDiscount.mutate(payload, {
      onSuccess: () => {
        alert("✅ Discount created successfully!");
        reset();
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl mx-auto p-6 bg-white shadow rounded-lg space-y-4"
    >
      <h2 className="text-2xl font-bold mb-4">Tambah Discount</h2>

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
        disabled
      />
      {errors.storeId && (
        <p className="text-sm text-red-500">{errors.storeId.message}</p>
      )}

      {/* Product select */}
      <select
        {...register("productId", { required: "Product wajib dipilih" })}
        className="w-full p-2 border rounded"
      >
        <option value="">-- Pilih Product --</option>
        {products.map((prd) => (
          <option key={prd.id} value={prd.id}>
            {prd.name}
          </option>
        ))}
      </select>
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

      {/* Type & Amount */}
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
            {...register("amount", {
              required: "Amount wajib diisi untuk Product Discount",
              valueAsNumber: true,
            })}
            className="w-full p-2 border rounded"
          />
          {errors.amount && (
            <p className="text-sm text-red-500">{errors.amount.message}</p>
          )}
        </>
      )}

      {/* Buy X Get Y */}
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
        disabled={createDiscount.isPending}
        className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {createDiscount.isPending ? "Menyimpan..." : "Simpan Discount"}
      </button>
    </form>
  );
}
