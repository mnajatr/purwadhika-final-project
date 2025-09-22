"use client";

import { useUpdateProduct } from "@/hooks/useProduct";
import { useForm, Controller } from "react-hook-form";
import { useEffect } from "react";
import useLocationStore from "@/stores/locationStore";

type InventoryInput = { stockQty: number; storeId: number };
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
  inventories?: InventoryInput[];
};

export default function UpdateProductForm({ product }: { product: ProductForEdit | null }) {
  const categories = [
    { id: 1, name: "Fruits & Vegetables" },
    { id: 2, name: "Dairy & Eggs" },
    { id: 3, name: "Meat & Poultry" },
    { id: 4, name: "Seafood" },
    { id: 5, name: "Bakery" },
    { id: 6, name: "Pantry Essentials" },
    { id: 7, name: "Beverages" },
    { id: 8, name: "Snacks" },
  ];

  // Hooks must be called unconditionally
  const updateProduct = useUpdateProduct();

  const nearestStoreId = useLocationStore((s) => s.nearestStoreId) ?? 1;
  const { register, handleSubmit, reset, control, watch } = useForm<ProductForEdit>({
    defaultValues: {
      name: "",
      slug: "",
      description: "",
      price: 0,
      weight: 0,
      width: 0,
      height: 0,
      length: 0,
      categoryId: 1,
      images: [{ imageUrl: "" }],
      inventories: [{ stockQty: 0, storeId: nearestStoreId }],
    },
  });

  // Set default values dari product
  useEffect(() => {
    if (product) {
      reset({
        name: product.name,
        slug: product.slug,
        description: product.description,
        price: product.price,
        weight: product.weight,
        width: product.width,
        height: product.height,
        length: product.length,
        categoryId: product.categoryId,
        images: product.images?.length ? product.images : [{ imageUrl: "" }],
        inventories: product.inventories?.length
          ? product.inventories
          : [{ stockQty: 0, storeId: nearestStoreId }],
      });
    }
  }, [product, reset, nearestStoreId]);

  // read full form values and access categoryId to avoid typed overloads
  const formValues = watch();
  const selectedCategoryId = formValues?.categoryId as number | undefined;

  const onSubmit = (data: ProductForEdit) => {
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
      inventories: data.inventories?.length
        ? data.inventories.map((i: InventoryInput) => ({
            stockQty: Number(i.stockQty),
            storeId: Number(i.storeId),
          }))
        : [{ stockQty: 0, storeId: nearestStoreId }],
    };

    if (!product?.slug) {
      alert("Produk tidak valid: slug tidak tersedia");
      return;
    }

    updateProduct.mutate(
      { slug: product.slug, data: payload },
      {
        onSuccess: () => {
          alert("Produk berhasil diperbarui!");
        },
        onError: (err: Error) => {
          alert("Gagal memperbarui produk: " + err.message);
        },
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl mx-auto p-6 bg-white shadow rounded-lg space-y-4"
    >
      <h2 className="text-2xl font-bold mb-4">Edit Produk</h2>

      {/* Nama Produk */}
      <input
        type="text"
        placeholder="Nama Produk"
        {...register("name", { required: true })}
        className="w-full p-2 border rounded"
      />

      {/* Slug */}
      <input
        type="text"
        placeholder="Slug"
        {...register("slug", { required: true })}
        className="w-full p-2 border rounded"
      />

      {/* Deskripsi */}
      <textarea
        placeholder="Deskripsi"
        {...register("description", { required: true })}
        className="w-full p-2 border rounded"
      />

      {/* Harga */}
      <input
        type="number"
        {...register("price", { required: true, valueAsNumber: true })}
        placeholder="Price"
        className="w-full p-2 border rounded"
      />

      {/* Dimensi & Berat */}
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
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => reset({ ...watch(), categoryId: cat.id })}
              className={`px-4 py-2 rounded-full border transition ${
                selectedCategoryId === cat.id
                  ? "bg-indigo-600 text-white border-indigo-600"
                  : "bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200"
              }`}
            >
              {cat.name}
            </button>
          ))}
        </div>
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

      {/* Inventories */}
      <div className="grid grid-cols-2 gap-4">
        <Controller
          control={control}
          name="inventories.0.stockQty"
          render={({ field }) => (
            <input
              type="number"
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
              placeholder="Stok"
              className="w-full p-2 border rounded"
            />
          )}
        />
        <Controller
          control={control}
          name="inventories.0.storeId"
          render={({ field }) => (
            <input
              type="number"
              {...field}
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
