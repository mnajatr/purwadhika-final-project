"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useProducts } from "@/hooks/useProduct";

export default function ProductsList() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStore, setSelectedStore] = useState("All");

  const { data: products = [], isLoading, error } = useProducts();

  if (isLoading)
    return <p className="text-center py-10">Loading products...</p>;
  if (error instanceof Error)
    return (
      <p className="text-center text-red-500 py-10">Error: {error.message}</p>
    );

  // Kategori dan store unik
  const categories = ["All", ...new Set(products.map((p) => p.category))];
  const stores = ["All", ...new Set(products.map((p) => p.store))];

  // Filter produk
  const filtered = products.filter((product) => {
    const matchCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    const matchSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());
    const matchStore =
      selectedStore === "All" || product.store === selectedStore;
    return matchCategory && matchSearch && matchStore;
  });

  return (
    <div className="w-full px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <h2 className="text-3xl md:text-4xl font-bold text-center md:text-left">
          Our Products
        </h2>
      </div>

      {/* Search */}
      <div className="flex justify-center mb-6">
        <input
          type="text"
          placeholder="Search products..."
          className="w-full md:w-2/3 lg:w-1/2 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Store filter */}
      <div className="flex justify-center mb-6">
        <select
          value={selectedStore}
          onChange={(e) => setSelectedStore(e.target.value)}
          className="w-full md:w-1/3 lg:w-1/4 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          {stores.map((store) => (
            <option key={store} value={store}>
              {store}
            </option>
          ))}
        </select>
      </div>

      {/* Category filter */}
      <div className="flex flex-wrap justify-center gap-3 mb-10">
        {categories.map((category) => (
          <button
            key={category}
            className={`px-4 py-2 rounded-full text-sm font-medium transition ${
              selectedCategory === category
                ? "bg-indigo-600 text-white shadow-md"
                : "bg-gray-200 text-gray-700 hover:bg-gray-300"
            }`}
            onClick={() => setSelectedCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.length === 0 ? (
          <p className="col-span-full text-center text-gray-500">
            No products found.
          </p>
        ) : (
          filtered.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-lg transition flex flex-col"
            >
              <div className="relative w-full h-48">
                <Image
                  src={product.imageUrl}
                  alt={product.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-6 flex flex-col flex-grow">
                <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2 flex-grow">
                  {product.description}
                </p>
                <p className="text-indigo-600 font-bold mb-3">
                  Rp {Number(product.price || 0).toLocaleString("id-ID")}
                </p>
                <div className="flex items-center justify-between mb-4">
                  <span className="inline-block px-3 py-1 text-xs bg-gray-100 text-gray-600 rounded-full">
                    {product.category}
                  </span>
                  <span className="text-xs text-gray-500">{product.store}</span>
                </div>
                <Link
                  href={`/products/${product.slug}`}
                  className="block text-center bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition mt-auto"
                >
                  Lihat Detail
                </Link>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
