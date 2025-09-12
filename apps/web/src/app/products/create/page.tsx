"use client";

import { useState } from "react";
import { useCreateProduct } from "@/hooks/useProduct";

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

  const [form, setForm] = useState({
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
    inventories: [{ stockQty: 0, storeId: 1 }],
  });

  const createProduct = useCreateProduct();

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]:
        name === "price" ||
        name === "weight" ||
        name === "width" ||
        name === "height" ||
        name === "length"
          ? Number(value)
          : value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createProduct.mutate(form, {
      onSuccess: () => {
        alert("Produk berhasil ditambahkan!");
        setForm({
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
          inventories: [{ stockQty: 0, storeId: 1 }],
        });
      },
      onError: (err: any) => {
        console.error(err);
        alert("Gagal menambahkan produk");
      },
    });
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="max-w-2xl mx-auto p-6 bg-white shadow rounded-lg space-y-4"
    >
      <h2 className="text-2xl font-bold mb-4">Tambah Produk</h2>

      {/* Nama produk */}
      <input
        type="text"
        name="name"
        placeholder="Nama Produk"
        value={form.name}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />

      {/* Slug */}
      <input
        type="text"
        name="slug"
        placeholder="Slug (contoh: stroberi-segar-250gr)"
        value={form.slug}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />

      {/* Deskripsi */}
      <textarea
        name="description"
        placeholder="Deskripsi"
        value={form.description}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />

      {/* Harga */}
      <p>Price</p>
      <input
        type="number"
        name="price"
        placeholder="Harga (Rp)"
        value={form.price}
        onChange={handleChange}
        className="w-full p-2 border rounded"
        required
      />

      {/* Dimensi & berat */}
      <div className="grid grid-cols-2 gap-4">
        <p>Weight</p>
        <input
          type="number"
          name="weight"
          placeholder="Berat (gr)"
          value={form.weight}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <p>Width</p>
        <input
          type="number"
          name="width"
          placeholder="Lebar (cm)"
          value={form.width}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <p>Height</p>
        <input
          type="number"
          name="height"
          placeholder="Tinggi (cm)"
          value={form.height}
          onChange={handleChange}
          className="w-full p-2 border rounded"
        />
        <p>Length</p>
        <input
          type="number"
          name="length"
          placeholder="Panjang (cm)"
          value={form.length}
          onChange={handleChange}
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
              onClick={() =>
                setForm((prev) => ({ ...prev, categoryId: cat.id }))
              }
              className={`px-4 py-2 rounded-full border transition ${
                form.categoryId === cat.id
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
      <input
        type="text"
        placeholder="URL Gambar"
        value={form.images[0].imageUrl}
        onChange={(e) =>
          setForm((prev) => ({
            ...prev,
            images: [{ imageUrl: e.target.value }],
          }))
        }
        className="w-full p-2 border rounded"
      />

      {/* Inventories */}
      <div className="grid grid-cols-2 gap-4">
        <p>Stok</p>
        <input
          type="number"
          placeholder="Stok"
          value={form.inventories[0].stockQty}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              inventories: [
                { ...prev.inventories[0], stockQty: Number(e.target.value) },
              ],
            }))
          }
          className="w-full p-2 border rounded"
        />
        <p>Store id</p>
        <input
          type="number"
          placeholder="Store ID"
          value={form.inventories[0].storeId}
          onChange={(e) =>
            setForm((prev) => ({
              ...prev,
              inventories: [
                { ...prev.inventories[0], storeId: Number(e.target.value) },
              ],
            }))
          }
          className="w-full p-2 border rounded"
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
