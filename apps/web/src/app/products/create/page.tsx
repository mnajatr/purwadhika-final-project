"use client";

import { useForm, Controller, useFieldArray, Resolver } from "react-hook-form";
import { useCategories } from "@/hooks/useCategory";
import Image from "next/image";
import { productsService } from "@/services/products.service";
import { useStores } from "@/hooks/useStores";
import { zodResolver } from "@hookform/resolvers/zod";
import { productForCreateSchema } from "@repo/schemas";
import { toast } from "sonner";
type InventoryInput = { storeId: number };

type ProductForCreate = {
  name: string;
  slug: string;
  description?: string;
  price: number;
  weight: number;
  width?: number;
  height?: number;
  length?: number;
  categoryId: number;
  images: File[];
  inventories: InventoryInput[];
};

export default function AddProductForm() {
  const { data } = useCategories(0);
  const categories = data?.data ?? [];
  const { data: stores, isLoading } = useStores();
  const {
    register,
    handleSubmit,
    reset,
    control,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ProductForCreate>({
    resolver: zodResolver(
      productForCreateSchema
    ) as unknown as Resolver<ProductForCreate>,
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
      images: [],
      inventories: [
        {
          storeId: 0,
        },
      ],
    },
  });

  console.log("Form Errors:", errors);

  const { fields: inventoryFields } = useFieldArray({
    control,
    name: "inventories",
  });

  const images = watch("images");

  const onSubmit = async (data: ProductForCreate) => {
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
      formData.append("categoryId", String(data.categoryId));
      formData.append("inventories", JSON.stringify(data.inventories));

      (data.images || []).forEach((img) => {
        formData.append("images", img as File);
      });

      await productsService.createProduct(formData);

      toast.success(" Product created successfully!");
      reset();
    } catch (err) {
      console.error(err);
      toast.error("Failed to create product");
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
      <h2 className="text-2xl font-bold">Add Product</h2>

      {/* Name */}
      <label
        htmlFor="name"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Product Name
      </label>
      <input
        type="text"
        placeholder="Enter product name"
        {...register("name", { required: "Product name is required" })}
        className="w-full p-2 border rounded"
      />
      {errors.name && (
        <p className="text-red-500 text-sm mt-1">{errors.name.message}</p>
      )}

      {/* Slug */}
      <label
        htmlFor="slug"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Product Slug
      </label>
      <input
        type="text"
        placeholder="product-slug-example"
        {...register("slug", { required: "Slug is required" })}
        className="w-full p-2 border rounded"
      />
      <p className="text-gray-600 font-light text-sm">
        Use lowercase and dashes, e.g. <i>mineral-water-bottle</i>
      </p>
      {errors.slug && (
        <p className="text-red-500 text-sm mt-1">{errors.slug.message}</p>
      )}

      {/* Description */}
      <label
        htmlFor="description"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Product Description
      </label>
      <textarea
        placeholder="Enter product description..."
        {...register("description", { required: "Description is required" })}
        className="w-full p-2 border rounded"
      />
      {errors.description && (
        <p className="text-red-500 text-sm mt-1">
          {errors.description.message}
        </p>
      )}

      {/* Price */}
      <label
        htmlFor="price"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Product Price
      </label>
      <input
        type="number"
        placeholder="Enter price"
        {...register("price", {
          valueAsNumber: true,
          required: "Price is required",
        })}
        className="w-full p-2 border rounded"
      />
      {errors.price && (
        <p className="text-red-500 text-sm mt-1">{errors.price.message}</p>
      )}

      {/* Dimensions & Weight */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label
            htmlFor="weight"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Product Weight (grams)
          </label>
          <input
            type="number"
            placeholder="Weight"
            {...register("weight", {
              valueAsNumber: true,
              required: "Weight is required",
            })}
            className="w-full p-2 border rounded"
          />
          {errors.weight && (
            <p className="text-red-500 text-sm mt-1">{errors.weight.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="width"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Product Width (cm)
          </label>
          <input
            type="number"
            placeholder="Width"
            {...register("width", {
              valueAsNumber: true,
              required: "Width is required",
            })}
            className="w-full p-2 border rounded"
          />
          {errors.width && (
            <p className="text-red-500 text-sm mt-1">{errors.width.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="height"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Product Height (cm)
          </label>
          <input
            type="number"
            placeholder="Height"
            {...register("height", {
              valueAsNumber: true,
              required: "Height is required",
            })}
            className="w-full p-2 border rounded"
          />
          {errors.height && (
            <p className="text-red-500 text-sm mt-1">{errors.height.message}</p>
          )}
        </div>

        <div>
          <label
            htmlFor="length"
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Product Length (cm)
          </label>
          <input
            type="number"
            placeholder="Length"
            {...register("length", {
              valueAsNumber: true,
              required: "Length is required",
            })}
            className="w-full p-2 border rounded"
          />
          {errors.length && (
            <p className="text-red-500 text-sm mt-1">{errors.length.message}</p>
          )}
        </div>
      </div>

      {/* Category */}
      <label
        htmlFor="categoryId"
        className="block text-sm font-medium text-gray-700 mb-1"
      >
        Product Category
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
        <p className="text-red-500 text-sm mt-1">{errors.categoryId.message}</p>
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
        {errors.images && (
          <p className="text-red-500 text-sm mt-1">{errors.images.message}</p>
        )}

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

      {/* Inventories */}
      {inventoryFields.map((field, idx) => (
        <div key={field.id} className="grid grid-cols-2 gap-4">
          <label
            htmlFor={`inventories.${idx}.storeId`}
            className="block text-sm font-medium text-gray-700 mb-1"
          >
            Store
          </label>
          <Controller
            name={`inventories.${idx}.storeId`}
            control={control}
            render={({ field }) => (
              <select
                {...field}
                value={field.value ?? ""}
                onChange={(e) => field.onChange(Number(e.target.value))}
                className="w-full p-2 border rounded"
              >
                <option value="">-- Select Store --</option>
                {stores?.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            )}
          />
          {errors.inventories?.[idx]?.storeId && (
            <p className="text-red-500 text-sm mt-1">
              {errors.inventories[idx].storeId?.message}
            </p>
          )}
        </div>
      ))}

      {/* Submit Button */}
      <button
        type="submit"
        className="w-full bg-primary text-white py-2 rounded hover:bg-primary-dark"
      >
        Save Product
      </button>
    </form>
  );
}
