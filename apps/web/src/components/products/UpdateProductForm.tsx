"use client";

import { useForm } from "react-hook-form";
import Image from "next/image";
import { productsService } from "@/services/products.service";
import { useCategories } from "@/hooks/useCategory";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { toast } from "sonner";

export type ProductForUpdate = {
  id: number;
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
};

export default function UpdateProductForm({
  product,
}: {
  product: ProductForUpdate;
}) {
  const { data } = useCategories(0);
  const categories = data?.data ?? [];
  const searchParams = useSearchParams();
  const storeIdz = searchParams.get("storeId") ?? "1";
  const storeId = Number(storeIdz);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductForUpdate>({
    defaultValues: {
      id: product.id,
      name: product?.name || "",
      slug: product?.slug || "",
      description: product?.description || "",
      price: product?.price ?? 0,
      weight: product?.weight ?? 0,
      width: product?.width ?? 0,
      height: product?.height ?? 0,
      length: product?.length ?? 0,
      categoryId: product?.categoryId ?? undefined,
      images: [],
    },
  });

  const images = watch("images");

  // reset form kalau product berubah
  useEffect(() => {
    async function initForm() {
      reset({
        id: product.id,
        name: product?.name || "",
        slug: product?.slug || "",
        description: product?.description || "",
        price: product?.price ?? 0,
        weight: product?.weight ?? 0,
        width: product?.width ?? 0,
        height: product?.height ?? 0,
        length: product?.length ?? 0,
        categoryId:
          categories.length > 0 ? product?.categoryId ?? undefined : undefined,
        images: product.images,
      });
    }

    if (product) {
      initForm();
    }
  }, [product, storeId, reset, categories]);

  const onSubmit = async (data: ProductForUpdate) => {
    try {
      const formData = new FormData();

      formData.append("name", data.name || "");
      formData.append("slug", data.slug || "");
      if (data.description) formData.append("description", data.description);
      formData.append("price", String(data.price ?? 0));
      formData.append("weight", String(data.weight ?? 0));
      if (data.width) formData.append("width", String(data.width));
      if (data.height) formData.append("height", String(data.height));
      if (data.length) formData.append("length", String(data.length));
      formData.append("categoryId", String(data.categoryId ?? 0));

      (data.images || []).forEach((img) => {
        if (img instanceof File) {
          formData.append("images", img);
        }
      });

      if (!product.slug) throw new Error("Slug produk tidak ada!");
      await productsService.updateProduct(product.slug, formData);

      toast.success("✅ Product updated successfully!");
      reset();
    } catch (err) {
      console.error(err);
      toast.error("❌ Failed to update product");
    }
  };

  const handleFiles = (files: FileList) => {
    const newFiles = Array.from(files);
    setValue("images", [...(images || []), ...newFiles]);
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl mx-auto p-6 bg-white shadow rounded-lg space-y-6 m-10"
    >
      <h2 className="text-2xl font-bold">Edit Product</h2>

      {/* Name */}
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Product Name
      </label>
      <input
        type="text"
        placeholder="Enter product name"
        {...register("name", { required: "Product name is required" })}
        className="w-full p-2 border rounded"
      />
      {errors.name && (
        <p className="text-red-500 text-sm">{errors.name.message}</p>
      )}

      {/* Slug */}
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Product Slug
      </label>
      <input
        type="text"
        placeholder="product-slug-example"
        {...register("slug", { required: "Product slug is required" })}
        className="w-full p-2 border rounded"
      />
      {errors.slug && (
        <p className="text-red-500 text-sm">{errors.slug.message}</p>
      )}

      {/* Description */}
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Description
      </label>
      <textarea
        placeholder="Enter product description..."
        {...register("description")}
        className="w-full p-2 border rounded"
      />

      {/* Price */}
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Price
      </label>
      <input
        type="number"
        placeholder="Enter product price"
        {...register("price", {
          required: "Price is required",
          valueAsNumber: true,
        })}
        className="w-full p-2 border rounded"
      />
      {errors.price && (
        <p className="text-red-500 text-sm">{errors.price.message}</p>
      )}

      {/* Dimensions & Weight */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Weight (grams)
          </label>
          <input
            type="number"
            placeholder="Weight in grams"
            {...register("weight", { valueAsNumber: true })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Width (cm)
          </label>
          <input
            type="number"
            placeholder="Width in cm"
            {...register("width", { valueAsNumber: true })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Height (cm)
          </label>
          <input
            type="number"
            placeholder="Height in cm"
            {...register("height", { valueAsNumber: true })}
            className="w-full p-2 border rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Length (cm)
          </label>
          <input
            type="number"
            placeholder="Length in cm"
            {...register("length", { valueAsNumber: true })}
            className="w-full p-2 border rounded"
          />
        </div>
      </div>

      {/* Category */}
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Category
      </label>
      <select
        {...register("categoryId", { required: "Category is required" })}
        className="w-full p-2 border rounded"
      >
        <option value="">-- Select Category --</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.name}
          </option>
        ))}
      </select>
      {errors.categoryId && (
        <p className="text-red-500 text-sm">{errors.categoryId.message}</p>
      )}

      {/* Images */}
      <div>
        <label className="block mb-1 font-medium">Product Images</label>
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
            } else if (typeof img === "string") {
              src = img;
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
                  onClick={() => {
                    setValue(
                      "images",
                      images?.filter((_, i) => i !== idx) || []
                    );
                  }}
                  className="absolute top-0 right-0 bg-red-500 text-white rounded px-1"
                >
                  X
                </button>
              </div>
            );
          })}
        </div>
      </div>

      {/* Store */}
      <label className="block text-sm font-medium text-gray-700 mb-1">
        Store ID
      </label>
      <input
        type="number"
        disabled
        value={storeId}
        placeholder="Store ID"
        className="w-full p-2 border rounded"
      />

      <button
        type="submit"
        className="w-full bg-primary text-white py-2 rounded hover:bg-primary-dark"
      >
        Update Product
      </button>
    </form>
  );
}
