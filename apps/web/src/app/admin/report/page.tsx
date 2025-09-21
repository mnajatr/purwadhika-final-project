"use client";

import Sidebar from "@/components/admin/sidebar";
import SalesByCategoryChart from "@/components/reportChart/ReportChart";

export default function ReportChart() {
  const today = new Date();
  const month = today.getMonth() + 1;
  const year = today.getFullYear();

  return (
    <div className="flex min-h-screen">
      <aside className="w-48 bg-gray-800 text-white p-4 sticky top-0 h-screen">
        <Sidebar />
      </aside>
      <div className="flex-1 px-4 sm:px-6 lg:px-8 py-12 overflow-x-auto">
        <h2 className="text-3xl md:text-4xl font-bold text-center md:text-left mb-10">
          Report Sales
        </h2>
        <SalesByCategoryChart month={month} year={year} />
      </div>
    </div>
  );
}
