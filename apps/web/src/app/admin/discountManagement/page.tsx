"use client";

import { useState } from "react";
import Sidebar from "@/components/admin/sidebar";

export default function ManageDiscounts() {
  const [discounts, setDiscounts] = useState([
    { id: 1, code: "WELCOME10", percentage: 10 },
    { id: 2, code: "SALE20", percentage: 20 },
  ]);

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}

      <Sidebar />

      {/* Konten utama */}
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-12 overflow-x-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
          <h1 className="text-2xl md:text-3xl font-bold">Manage Discounts</h1>
          <button className="bg-indigo-500 text-white px-4 py-2 rounded-lg shadow hover:bg-indigo-700 transition">
            + Add Discount
          </button>
        </div>

        {/* Table */}
        {discounts.length === 0 ? (
          <p className="text-center text-gray-500">No discounts available.</p>
        ) : (
          <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Code
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Percentage
                </th>
                <th className="px-4 py-3 text-left text-sm font-medium text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {discounts.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm font-medium text-gray-800">
                    {d.code}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {d.percentage}%
                  </td>
                  <td className="px-4 py-3 text-sm flex gap-3">
                    <button className="text-indigo-600 hover:underline">
                      Edit
                    </button>
                    <button className="text-red-600 hover:underline">
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
