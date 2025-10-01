"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useProducts } from "@/hooks/useProduct";
import Sidebar from "@/components/admin/sidebar";
import DeleteProductButton from "@/components/products/DeleteButtonProduct";
import DeactivateButtonProduct from "@/components/products/DeactivateButtonProduct";
import ActivateButtonProduct from "@/components/products/ActivateButtonProduct";
import { useStores } from "@/hooks/useStores";
import { useCategories } from "@/hooks/useCategory";

export default function ProductsList() {
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedStore, setSelectedStore] = useState("All");
  const [role, setRole] = useState("");
  const [storeId, setStoreId] = useState("");

  useEffect(() => {
    const r = localStorage.getItem("role") || "";
    const s = localStorage.getItem("storeId") || "";
    setRole(r);
    setStoreId(s);
    setSelectedStore("All");
  }, []);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data, isLoading, error } = useProducts(
    page,
    Number(storeId) === 0 ? undefined : Number(storeId)
  );

  const products = data?.products || [];
  const totalData = data?.total;
  const safeProducts = Array.isArray(products) ? products : [];
  const { data: dataz } = useCategories(0);
  const categories = dataz?.data ?? [];
  const { data: stores } = useStores();
  const filtered = safeProducts.filter((product) => {
    const matchCategory =
      selectedCategory === "All" || product.category === selectedCategory;
    const matchSearch = product.name
      .toLowerCase()
      .includes(search.toLowerCase());

    const matchStore = product.store === selectedStore;
    return selectedStore === "All"
      ? matchCategory && matchSearch
      : matchCategory && matchSearch && matchStore;
  });

  if (isLoading) {
    return <p className="text-center py-10">Loading products...</p>;
  }
  if (error instanceof Error) {
    return (
      <p className="text-center text-red-500 py-10">Error: {error.message}</p>
    );
  }

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <aside className="w-48 bg-gray-800 text-white p-4 space-y-4 sticky top-0 h-screen">
        <Sidebar />
      </aside>

      {/* Konten utama */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-12 overflow-x-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <h2 className="text-3xl md:text-4xl font-bold text-center md:text-left">
            List Products
          </h2>

          {role === "SUPER_ADMIN" && (
            <Link
              href="/products/create"
              className="bg-indigo-500 text-white px-5 py-2 rounded-lg shadow hover:bg-indigo-700 transition text-center"
            >
              + Tambah Produk
            </Link>
          )}
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

        {/* Store filter (SUPER_ADMIN only) */}
        {role === "SUPER_ADMIN" && (
          <div className="flex justify-center mb-6">
            <select
              value={selectedStore}
              onChange={(e) => setSelectedStore(e.target.value)}
              className="w-full md:w-1/3 lg:w-1/4 px-4 py-2 border rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="All"> All Store </option>
              {stores?.map((store) => (
                <option key={store.id} value={store.name}>
                  {store.name}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Category filter */}
        <div className="flex flex-wrap justify-center gap-3 mb-10">
          {categories.map((category) => (
            <button
              key={category.id}
              className={`px-4 py-2 rounded-full text-sm font-medium transition ${
                selectedCategory === category.name
                  ? "bg-indigo-600 text-white shadow-md"
                  : "bg-gray-200 text-gray-700 hover:bg-gray-300"
              }`}
              onClick={() => setSelectedCategory(category.name)}
            >
              {category.name}
            </button>
          ))}
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <p className="text-center text-gray-500">No products found.</p>
          ) : (
            <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Thumbnail
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Name
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Category
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Store
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Price
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Stock
                  </th>
                  {role === "SUPER_ADMIN" && (
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filtered.map((product, index) => (
                  <tr key={index + 1} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      {product.imageUrl && (
                        <div className="w-16 h-16 relative rounded-md overflow-hidden">
                          <Image
                            src={product.imageUrl}
                            alt={product.name}
                            fill
                            className="object-cover"
                          />
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-800">
                      {product.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {product.category}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {product.store}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-indigo-600">
                      Rp {Number(product.price || 0).toLocaleString("id-ID")}
                    </td>
                    <td className="px-4 py-3 text-sm font-semibold text-indigo-600">
                      {product.stock}
                    </td>

                    {role === "SUPER_ADMIN" && (
                      <td className="px-4 py-3 text-sm flex gap-2">
                        <Link
                          href={`/products/${product.slug}/update?storeId=${product.storeId}`}
                          className="text-indigo-600 hover:underline"
                        >
                          Edit
                        </Link>
                        <DeleteProductButton slug={product.slug} />
                        <DeactivateButtonProduct slug={product.slug} />
                        {!product.isActive && (
                          <>
                            <span className="mx-1">|</span>
                            <ActivateButtonProduct slug={product.slug} />
                          </>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
        <div className="mt-6 flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <button
              className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              Previous
            </button>
            <button
              className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={page * pageSize >= (totalData ?? 0)}
              onClick={() => setPage((p) => p + 1)}
            >
              Next
            </button>
          </div>
          <div className="text-sm text-gray-700">
            Showing {(page - 1) * pageSize + 1} to{" "}
            {Math.min(page * pageSize, totalData ?? 0)} of {totalData ?? 0}{" "}
            results
          </div>
        </div>
      </div>
    </div>
  );
}
