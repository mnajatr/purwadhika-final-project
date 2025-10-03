"use client";

import Sidebar from "@/components/admin/sidebar";
import Link from "next/link";
import { useDiscounts, useDeleteDiscount } from "@/hooks/useDiscount";
import { useEffect, useState } from "react";

export default function ManageDiscounts() {
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const { data, isLoading } = useDiscounts(page);
  const deleteDiscount = useDeleteDiscount();
  const totalData = data?.total;

  const [role, setRole] = useState("");
  const [storeId, setStoreId] = useState("");

  useEffect(() => {
    setRole(localStorage.getItem("role") || "");
    setStoreId(localStorage.getItem("storeId") || "");
  }, []);
  const discounts = data?.data ?? [];

  const filteredDiscounts = discounts.filter((d) => {
    if (role === "SUPER_ADMIN") return true;
    if (role === "STORE_ADMIN") return d.store?.id === Number(storeId);
    return false;
  });

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this discount?")) {
      deleteDiscount.mutate(id);
    }
  };

  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-12 overflow-x-auto">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Manage Discounts</h1>
          {role === "STORE_ADMIN" && (
            <Link
              href={`/discount/create`}
              className="bg-primary-gradient text-white px-5 py-2 rounded-lg shadow hover:bg-amber-700 transition text-center"
            >
              Create Discount
            </Link>
          )}
        </div>

        {isLoading ? (
          <p className="text-center text-gray-500">Loading discounts...</p>
        ) : filteredDiscounts.length === 0 ? (
          <p className="text-center text-gray-500">No discounts available.</p>
        ) : (
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Store
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Name
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Product
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Type
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Value
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Expired At
                </th>
                {role === "STORE_ADMIN" && (
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                    Actions
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredDiscounts.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-800">
                    {d.store?.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-800">{d.name}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {d.product?.name}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{d.type}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">{d.value}</td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {d.expiredAt?.toLocaleDateString()}
                  </td>
                  {role === "STORE_ADMIN" && (
                    <td className="px-4 py-3 text-sm flex gap-3">
                      <>
                        <Link
                          href={`/discount/${d.id}/update`}
                          className="text-indigo-500 hover:underline"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(d.id)}
                          className="text-red-600 hover:underline"
                          disabled={deleteDiscount.isPending}
                        >
                          {deleteDiscount.isPending ? "Deleting..." : "Delete"}
                        </button>
                      </>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        )}
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
