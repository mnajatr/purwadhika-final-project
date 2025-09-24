"use client";

import { useForm, Controller, useFieldArray } from "react-hook-form";
import { useCategories } from "@/hooks/useCategory";
import Image from "next/image";
import { productsService } from "@/services/products.service";
import { ProductResponse } from "@/types/products.type";

type InventoryInput = { stockQty: number; storeId: number };
type ProductForUpdate = {
  name?: string;
  slug?: string;
  description?: string;
  price?: number;
  weight?: number;
  width?: number;
  height?: number;
  length?: number;
  categoryId?: number;
  images?: File[];
  inventories?: InventoryInput[];
};

interface UpdateProductFormProps {
  product: ProductResponse;
}

export default function UpdateProductForm({ product }: UpdateProductFormProps) {
  const { data: categories = [] } = useCategories();

  const { register, handleSubmit, reset, control, setValue, watch } =
    useForm<ProductForUpdate>({
      defaultValues: {
        name: product?.name ?? "",
        slug: product?.slug ?? "",
        description: product?.description ?? "",
        price: product?.price ?? 0,
        weight: product?.weight ?? 0,
        width: product?.width ?? 0,
        height: product?.height ?? 0,
        length: product?.length ?? 0,
        categoryId: product?.categoryId ?? undefined,
        images: [],
        inventories: product?.inventories?.map((inv) => ({
          stockQty: inv.stockQty,
          storeId: Number(localStorage.getItem("storeId")) ?? 0,
        })),
      },
    });

  const { fields: inventoryFields } = useFieldArray({
    control,
    name: "inventories",
  });

  const images = watch("images");

  const onSubmit = async (data: ProductForUpdate) => {
    try {
      if (!product?.slug) {
        alert("Produk tidak valid: slug tidak tersedia");
        return;
      }

      const formData = new FormData();

      formData.append("name", data.name || "");
      formData.append("slug", data.slug || "");
      if (data.description) formData.append("description", data.description);
      formData.append("price", String(data.price ?? 0));
      formData.append("weight", String(data.weight ?? 0));
      if (data.width) formData.append("width", String(data.width));
      if (data.height) formData.append("height", String(data.height));
      if (data.length) formData.append("length", String(data.length));
      if (data.categoryId)
        formData.append("categoryId", String(data.categoryId));

      // Inventories
      formData.append("inventories", JSON.stringify(data.inventories));

      // Images
      (data.images || []).forEach((img) => {
        formData.append("images", img);
      });

      await productsService.updateProduct(product.slug, formData);

      alert("Produk berhasil diperbarui!");
      reset(data);
    } catch (err) {
      console.error(err);
      alert("Gagal memperbarui produk");
    }
  };

  const handleFiles = (files: FileList) => {
    const newFiles = Array.from(files);
    setValue("images", newFiles);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl mx-auto p-6 bg-white shadow rounded-lg space-y-6 m-10"
    >
      <h2 className="text-2xl font-bold">Edit Produk</h2>

      {/* Nama & Slug */}
      <input
        type="text"
        placeholder="Nama Produk"
        {...register("name", { required: true })}
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        placeholder="Slug Produk"
        {...register("slug", { required: true })}
        className="w-full p-2 border rounded"
      />

      {/* Deskripsi */}
      <textarea
        placeholder="Deskripsi produk..."
        {...register("description")}
        className="w-full p-2 border rounded"
      />

      {/* Harga */}
      <input
        type="number"
        placeholder="Harga"
        {...register("price", { valueAsNumber: true })}
        className="w-full p-2 border rounded"
      />

      {/* Dimensi & Berat */}
      <div className="grid grid-cols-2 gap-4">
        <input
          type="number"
          placeholder="Berat"
          {...register("weight", { valueAsNumber: true })}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Lebar"
          {...register("width", { valueAsNumber: true })}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Tinggi"
          {...register("height", { valueAsNumber: true })}
          className="w-full p-2 border rounded"
        />
        <input
          type="number"
          placeholder="Panjang"
          {...register("length", { valueAsNumber: true })}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Kategori */}
      <select
        {...register("categoryId", { required: true })}
        className="w-full p-2 border rounded"
      >
        <option value="">-- Pilih Kategori --</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>

      {/* Gambar */}
      <div>
        <label className="block mb-1 font-medium">Gambar Produk</label>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => {
            const files = e.target.files;
            if (!files) return;
            handleFiles(files);
          }}
          className="w-full p-2 border rounded"
        />

        <div className="flex flex-wrap gap-2 mt-2">
          {images?.map((img, idx) => {
            let src: string | undefined;

            if (img instanceof File) {
              src = URL.createObjectURL(img);
            }

            if (!src) return null;

            return (
              <div key={idx} className="relative w-32 h-32">
                <Image
                  src={src}
                  alt={`Image ${idx + 1}`}
                  fill
                  className="object-cover rounded"
                />
                <button
                  type="button"
                  onClick={() =>
                    setValue(
                      "images",
                      images?.filter((_, i) => i !== idx) || []
                    )
                  }
                  className="absolute top-0 right-0 bg-red-500 text-white rounded px-1"
                >
                  X
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Inventories */}
      {inventoryFields.map((field, idx) => (
        <div key={idx} className="grid grid-cols-2 gap-4">
          <Controller
            name={`inventories.${idx}.stockQty`}
            control={control}
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
            name={`inventories.${idx}.storeId`}
            control={control}
            render={({ field }) => (
              <input
                type="number"
                disabled
                {...field}
                onChange={(e) => field.onChange(Number(e.target.value))}
                placeholder="Store ID"
                className="w-full p-2 border rounded"
              />
            )}
          />
        </div>
      ))}

      <button
        type="submit"
        className="w-full bg-primary text-white py-2 rounded hover:bg-primary-dark"
      >
        Update Produk
      </button>
    </form>
  );
}
