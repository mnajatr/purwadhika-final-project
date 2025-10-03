"use client";

import { useStockSummary } from "@/hooks/useReport";

interface Props {
  month: number;
  year: number;
  storeId?: number;
}

export default function StockManagementSummary({
  month,
  year,
  storeId,
}: Props) {
  const { data, isLoading, error } = useStockSummary({
    month,
    year,
    storeId,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data || data.length === 0) return <div>No data</div>;

  const tableData = data.map((item) => ({
    productName: item.productName,
    totalIn: item.totalIn,
    totalOut: item.totalOut,
    endingStock: item.endingStock,
  }));

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-gray-200 text-sm text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">Product</th>
            <th className="px-4 py-2 border">Total In</th>
            <th className="px-4 py-2 border">Total Out</th>
            <th className="px-4 py-2 border">Ending Stock</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-4 py-2 border">{row.productName}</td>
              <td className="px-4 py-2 border">{row.totalIn}</td>
              <td className="px-4 py-2 border">{row.totalOut}</td>
              <td className="px-4 py-2 border">{row.endingStock}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
