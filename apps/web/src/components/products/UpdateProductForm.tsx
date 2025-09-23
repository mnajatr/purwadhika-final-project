"use client";

import { useUpdateProduct } from "@/hooks/useProduct";
import { useForm, Controller } from "react-hook-form";
import { useEffect } from "react";
import useLocationStore from "@/stores/locationStore";
import { useCategories } from "@/hooks/useCategory";

type ImageInput = { imageUrl: string };

type ProductForEdit = {
  id?: number;
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  weight?: number;
  width?: number;
  height?: number;
  length?: number;
  categoryId?: number;
  images?: ImageInput[];
  stockQty?: number; // terpisah dari array
  storeId?: number; // terpisah dari array
};

export default function UpdateProductForm({
  product,
}: {
  product: ProductForEdit | null;
}) {
  const updateProduct = useUpdateProduct();
  const nearestStoreId = useLocationStore((s) => s.nearestStoreId) ?? 1;
  const { data: categories = [] } = useCategories();

  const { register, handleSubmit, reset, control } = useForm<ProductForEdit>({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      weight: 0,
      width: 0,
      height: 0,
      length: 0,
      categoryId: undefined,
      images: [{ imageUrl: "" }],
      stockQty: 0,
      storeId: nearestStoreId,
    },
  });

  useEffect(() => {
    if (product) {
      reset({
        name: product.name || "",
        slug: product.slug || "",
        description: product.description || "",
        price: Number(product.price) || 0,
        weight: Number(product.weight) || 0,
        width: Number(product.width) || 0,
        height: Number(product.height) || 0,
        length: Number(product.length) || 0,
        categoryId: product.categoryId ?? undefined,
        images: product.images?.length ? product.images : [{ imageUrl: "" }],
        stockQty: product.stockQty ?? product.inventories?.[0]?.stockQty ?? 0,
        storeId:
          product.storeId ??
          product.inventories?.[0]?.storeId ??
          nearestStoreId,
      });
    }
  }, [product, reset, nearestStoreId]);

  const onSubmit = (data: ProductForEdit) => {
    if (!product?.slug) return alert("Produk tidak valid: slug tidak tersedia");

    const payload = {
      name: data.name,
      slug: data.slug,
      description: data.description,
      price: Number(data.price),
      weight: Number(data.weight),
      width: Number(data.width),
      height: Number(data.height),
      length: Number(data.length),
      categoryId: Number(data.categoryId),
      images: data.images?.length ? data.images : [{ imageUrl: "" }],
      inventories: [
        {
          stockQty: Number(data.stockQty ?? 0),
          storeId: Number(data.storeId ?? nearestStoreId),
        },
      ],
    };

    updateProduct.mutate(
      { slug: product.slug, data: payload },
      {
        onSuccess: () => alert("Produk berhasil diperbarui!"),
        onError: (err: Error) =>
          alert("Gagal memperbarui produk: " + err.message),
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl mx-auto p-6 bg-white shadow rounded-lg space-y-4"
    >
      <h2 className="text-2xl font-bold mb-4">Edit Produk</h2>

      <input
        type="text"
        placeholder="Nama Produk"
        {...register("name", { required: true })}
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Slug"
        {...register("slug", { required: true })}
        className="w-full p-2 border rounded"
      />
      <textarea
        placeholder="Deskripsi"
        {...register("description", { required: true })}
        className="w-full p-2 border rounded"
      />
      <input
        type="number"
        {...register("price", { required: true, valueAsNumber: true })}
        placeholder="Price"
        className="w-full p-2 border rounded"
      />

      <div className="grid grid-cols-2 gap-4">
        <input
          type="number"
          {...register("weight", { valueAsNumber: true })}
          placeholder="Weight"
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          {...register("width", { valueAsNumber: true })}
          placeholder="Width"
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          {...register("height", { valueAsNumber: true })}
          placeholder="Height"
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          {...register("length", { valueAsNumber: true })}
          placeholder="Length"
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Kategori */}
      <div>
        <p className="text-sm font-semibold mb-2">Pilih Kategori</p>
        <Controller
          name="categoryId"
          control={control}
          render={({ field }) => (
            <select
              {...field}
              value={field.value ?? ""}
              className="w-full px-4 py-2 border rounded-lg bg-white shadow-sm"
            >
              <option value="">-- Pilih kategori --</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          )}
        />
      </div>

      {/* URL Gambar */}
      <Controller
        control={control}
        name="images.0.imageUrl"
        render={({ field }) => (
          <input
            type="text"
            placeholder="URL Gambar"
            {...field}
            className="w-full p-2 border rounded"
          />
        )}
      />

      {/* Stock & Store */}
      <div className="grid grid-cols-2 gap-4">
        <Controller
          name="stockQty"
          control={control}
          render={({ field }) => (
            <input
              type="number"
              {...field}
              value={field.value ?? 0}
              onChange={(e) => field.onChange(Number(e.target.value))}
              placeholder="Stok"
              className="w-full p-2 border rounded"
            />
          )}
        />
        <Controller
          name="storeId"
          control={control}
          render={({ field }) => (
            <input
              type="number"
              {...field}
              value={field.value ?? nearestStoreId}
              onChange={(e) => field.onChange(Number(e.target.value))}
              placeholder="Store ID"
              className="w-full p-2 border rounded"
            />
          )}
        />
      </div>

      <button
        type="submit"
        disabled={updateProduct.isPending}
        className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {updateProduct.isPending ? "Menyimpan..." : "Update Produk"}
      </button>
    </form>
  );
}
