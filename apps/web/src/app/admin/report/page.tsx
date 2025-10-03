"use client";

import Sidebar from "@/components/admin/sidebar";
import SalesByCategoryChart from "@/components/reportChart/SalesByCategoryChart";
import SalesByProductChart from "@/components/reportChart/SalesByProductChart";
import StockManagementDetail from "@/components/reportChart/StockManagementDetail";
import StockManagementSummary from "@/components/reportChart/StockManagementSummary";
import { Button } from "@/components/ui/button";
import { useStores } from "@/hooks/useStores";
import { useEffect, useState } from "react";

export default function ReportChart() {
  const [activeTab, setActiveTab] = useState<
    "bycategory" | "byproduct" | "smsummary" | "smdetail"
  >("bycategory");
  const [role, setRole] = useState("");
  const [storeId, setStoreId] = useState<number | undefined>(undefined);
  useEffect(() => {
    const r = localStorage.getItem("role") || "";
    const s = localStorage.getItem("storeId") ?? undefined;
    setRole(r);
    setStoreId(Number(s));
  }, []);
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth() + 1);
  const currentYear = today.getFullYear();
  const [year, setYear] = useState(currentYear);

  // Generate 10 tahun terakhir
  const yearOptions = Array.from({ length: 10 }, (_, i) => currentYear - i);

  const monthOption = [
    { id: 1, name: "January" },
    { id: 2, name: "February" },
    { id: 3, name: "March" },
    { id: 4, name: "April" },
    { id: 5, name: "May" },
    { id: 6, name: "June" },
    { id: 7, name: "July" },
    { id: 8, name: "August" },
    { id: 9, name: "September" },
    { id: 10, name: "October" },
    { id: 11, name: "November" },
    { id: 12, name: "December" },
  ];

  const { data: stores } = useStores();

  return (
    <div className="flex min-h-screen bg-amber-200-50">
      {/* Sidebar */}
      <aside className="w-56 bg-gray-800 text-white p-4 sticky top-0 h-screen">
        <Sidebar />
      </aside>

      {/* Main Content */}
      <main className="flex-1 px-6 lg:px-12 py-10 overflow-x-auto">
        <div className="mb-8">
          <div className="border-b border-gray-200">
            <nav className="-mb-px flex space-x-8">
              <Button
                variant={activeTab === "bycategory" ? "default" : "ghost"}
                onClick={() => setActiveTab("bycategory")}
                className="py-2 px-1 border-b-2  bg-amber-500 font-medium text-sm  text-white"
              >
                By Category
              </Button>
              <Button
                variant={activeTab === "byproduct" ? "default" : "ghost"}
                onClick={() => setActiveTab("byproduct")}
                className="py-2 px-1 border-b-2  bg-amber-500 font-medium text-sm text-white"
              >
                By Product
              </Button>
              <Button
                variant={activeTab === "smsummary" ? "default" : "ghost"}
                onClick={() => setActiveTab("smsummary")}
                className="py-2 px-1 border-b-2  bg-amber-500 font-medium text-sm text-white"
              >
                Stock Management Summary
              </Button>
              <Button
                variant={activeTab === "smdetail" ? "default" : "ghost"}
                onClick={() => setActiveTab("smdetail")}
                className="py-2 px-1 border-b-2  bg-amber-500 font-medium text-sm  text-white"
              >
                Stock Management Detail
              </Button>
            </nav>
          </div>
        </div>
        <h2 className="text-3xl font-bold mb-10 text-gray-800">
          📊 Report Sales and Stock
        </h2>

        {/* Filter Section */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8 flex flex-col sm:flex-row gap-6 sm:items-end">
          {/* Month */}
          <div className="flex flex-col">
            <label htmlFor="month" className="font-medium text-gray-700 mb-2">
              Month
            </label>
            <select
              id="month"
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {monthOption.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </div>

          {/* Year */}
          <div className="flex flex-col">
            <label htmlFor="year" className="font-medium text-gray-700 mb-2">
              Year
            </label>
            <select
              id="year"
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {yearOptions.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          {/* Store */}
          {role === "SUPER_ADMIN" && (
            <div className="flex flex-col">
              <label htmlFor="store" className="font-medium text-gray-700 mb-2">
                Store
              </label>
              <select
                id="store"
                value={storeId ?? ""}
                onChange={(e) =>
                  setStoreId(
                    e.target.value ? Number(e.target.value) : undefined
                  )
                }
                className="border border-gray-300 rounded-lg px-3 py-2 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">-- Select Store --</option>
                {stores?.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Chart */}
        {activeTab === "bycategory" && (
          <div className="bg-white rounded-xl shadow-md border p-8">
            <SalesByCategoryChart month={month} year={year} storeId={storeId} />
          </div>
        )}
        {activeTab === "byproduct" && (
          <div className="bg-white rounded-xl shadow-md border p-8">
            <SalesByProductChart month={month} year={year} storeId={storeId} />
          </div>
        )}
        {activeTab === "smsummary" && (
          <div className="bg-white rounded-xl shadow-md border p-8">
            <StockManagementSummary
              month={month}
              year={year}
              storeId={storeId}
            />
          </div>
        )}
        {activeTab === "smdetail" && (
          <div className="bg-white rounded-xl shadow-md border p-8">
            <StockManagementDetail
              month={month}
              year={year}
              storeId={storeId}
            />
          </div>
        )}
      </main>
    </div>
  );
}
