"use client";

import { useCreateProduct } from "@/hooks/useProduct";
import { useForm, Controller } from "react-hook-form";
import useLocationStore from "@/stores/locationStore";

export default function AddProductForm() {
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

  const createProduct = useCreateProduct();

  const nearestStoreId = useLocationStore((s) => s.nearestStoreId) ?? 1;
  const { register, handleSubmit, reset, control, watch } = useForm({
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

  const onSubmit = (data: any) => {
    createProduct.mutate(data, {
      onSuccess: () => {
        alert("Produk berhasil ditambahkan!");
        reset();
      },
      onError: () => {
        alert("Gagal menambahkan produk");
      },
    });
  };

  const selectedCategoryId = watch("categoryId");

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl mx-auto p-6 bg-white shadow rounded-lg space-y-4"
    >
      <h2 className="text-2xl font-bold mb-4">Tambah Produk</h2>

      {/* Nama produk */}
      <input
        type="text"
        placeholder="Nama Produk"
        {...register("name", { required: true })}
        className="w-full p-2 border rounded"
      />

      {/* Slug */}
      <input
        type="text"
        placeholder="Slug (contoh: stroberi-segar-250gr)"
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
      <p>Price</p>
      <input
        type="number"
        placeholder="Harga (Rp)"
        {...register("price", { required: true, valueAsNumber: true })}
        className="w-full p-2 border rounded"
      />

      {/* Dimensi & berat */}
      <div className="grid grid-cols-2 gap-4">
        <p>Weight</p>
        <input
          type="number"
          placeholder="Berat (gr)"
          {...register("weight", { valueAsNumber: true })}
          className="w-full p-2 border rounded"
        />
        <p>Width</p>
        <input
          type="number"
          placeholder="Lebar (cm)"
          {...register("width", { valueAsNumber: true })}
          className="w-full p-2 border rounded"
        />
        <p>Height</p>
        <input
          type="number"
          placeholder="Tinggi (cm)"
          {...register("height", { valueAsNumber: true })}
          className="w-full p-2 border rounded"
        />
        <p>Length</p>
        <input
          type="number"
          placeholder="Panjang (cm)"
          {...register("length", { valueAsNumber: true })}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Pilih kategori */}
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
        <p>Stok</p>
        <Controller
          control={control}
          name="inventories.0.stockQty"
          render={({ field }) => (
            <input
              type="number"
              placeholder="Stok"
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className="w-full p-2 border rounded"
            />
          )}
        />
        <p>Store id</p>
        <Controller
          control={control}
          name="inventories.0.storeId"
          render={({ field }) => (
            <input
              type="number"
              placeholder="Store ID"
              {...field}
              onChange={(e) => field.onChange(Number(e.target.value))}
              className="w-full p-2 border rounded"
            />
          )}
        />
      </div>

      {/* Tombol submit */}
      <button
        type="submit"
        disabled={createProduct.isLoading}
        className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 disabled:opacity-50"
      >
        {createProduct.isLoading ? "Menyimpan..." : "Simpan Produk"}
      </button>
    </form>
  );
}
