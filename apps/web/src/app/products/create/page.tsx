"use client";

import { useCreateProduct } from "@/hooks/useProduct";
import { useForm, Controller } from "react-hook-form";
import useLocationStore from "@/stores/locationStore";
import { useCategories } from "@/hooks/useCategory";

export default function AddProductForm() {
  const createProduct = useCreateProduct();
  const nearestStoreId = useLocationStore((s) => s.nearestStoreId) ?? 1;

  const { data: categories = [] } = useCategories();

  const { register, handleSubmit, reset, control } = useForm({
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
      inventories: [{ stockQty: 0, storeId: nearestStoreId }],
    },
  });

  const onSubmit = (data: any) => {
    createProduct.mutate(
      { ...data, categoryId: Number(data.categoryId) },
      {
        onSuccess: () => {
          alert("Produk berhasil ditambahkan!");
          reset();
        },
        onError: () => {
          alert("Gagal menambahkan produk");
        },
      }
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-2xl mx-auto p-6 bg-white shadow rounded-lg space-y-6 m-10"
    >
      <h2 className="text-2xl font-bold">Tambah Produk</h2>

      {/* Nama Produk */}
      <div>
        <label className="block mb-1 font-medium">Nama Produk</label>
        <input
          type="text"
          placeholder="Nama Produk"
          {...register("name", { required: true })}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Slug */}
      <div>
        <label className="block mb-1 font-medium">Slug Produk</label>
        <input
          type="text"
          placeholder="contoh: stroberi-segar-250gr"
          {...register("slug", { required: true })}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Deskripsi */}
      <div>
        <label className="block mb-1 font-medium">Deskripsi</label>
        <textarea
          placeholder="Deskripsi produk..."
          {...register("description")}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Harga */}
      <div>
        <label className="block mb-1 font-medium">Harga Produk (Rp)</label>
        <input
          type="number"
          placeholder="Harga"
          {...register("price", { required: true, valueAsNumber: true })}
          className="w-full p-2 border rounded"
        />
      </div>

      {/* Dimensi & Berat */}
      <div>
        <label className="block mb-2 font-medium">Dimensi & Berat</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm">Berat (gr)</label>
            <input
              type="number"
              {...register("weight", { valueAsNumber: true })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm">Lebar (cm)</label>
            <input
              type="number"
              {...register("width", { valueAsNumber: true })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm">Tinggi (cm)</label>
            <input
              type="number"
              {...register("height", { valueAsNumber: true })}
              className="w-full p-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm">Panjang (cm)</label>
            <input
              type="number"
              {...register("length", { valueAsNumber: true })}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
      </div>

      {/* Kategori */}
      <div>
        <label className="block mb-1 font-medium">Kategori</label>
        <select
          {...register("categoryId", { required: true })}
          className="w-full px-3 py-2 border rounded bg-white"
        >
          <option value="">-- Pilih kategori --</option>
          {categories.map((cat) => (
            <option key={cat.id} value={cat.id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>

      {/* Gambar */}
      <div>
        <label className="block mb-1 font-medium">URL Gambar</label>
        <Controller
          control={control}
          name="images.0.imageUrl"
          render={({ field }) => (
            <input
              type="text"
              placeholder="https://example.com/image.jpg"
              {...field}
              className="w-full p-2 border rounded"
            />
          )}
        />
      </div>

      {/* Inventories */}
      <div>
        <label className="block mb-2 font-medium">Inventori</label>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm">Stok</label>
            <Controller
              control={control}
              name="inventories.0.stockQty"
              render={({ field }) => (
                <input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              )}
            />
          </div>
          <div>
            <label className="block text-sm">Store ID</label>
            <Controller
              control={control}
              name="inventories.0.storeId"
              render={({ field }) => (
                <input
                  type="number"
                  {...field}
                  onChange={(e) => field.onChange(Number(e.target.value))}
                  className="w-full p-2 border rounded"
                />
              )}
            />
          </div>
        </div>
      </div>

      {/* Tombol */}
      <button
        type="submit"
        disabled={createProduct.isLoading}
        className="w-full bg-primary text-white py-2 rounded hover:bg-primary-dark disabled:opacity-50"
      >
        {createProduct.isLoading ? "Menyimpan..." : "Simpan Produk"}
      </button>
    </form>
  );
}
