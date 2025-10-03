"use client";

import { useStockDetail } from "@/hooks/useReport";

interface Props {
  month: number;
  year: number;
  storeId?: number;
}

export default function StockManagementDetail({ month, year, storeId }: Props) {
  const { data, isLoading, error } = useStockDetail({
    month,
    year,
    storeId,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data || data.length === 0) return <div>No data</div>;

  const tableData = data.map((item) => ({
    productName: item.product.name,
    qtyChange: item.qtyChange,
    reason: item.reason,
    note: item.note,
    adminEmail: item.admin.email,
    createdAt: new Date(item.createdAt).toLocaleString("id-ID"),
  }));

  return (
    <div className="overflow-x-auto">
      <table className="w-full border border-gray-200 text-sm text-left">
        <thead className="bg-gray-100">
          <tr>
            <th className="px-4 py-2 border">Product</th>
            <th className="px-4 py-2 border">Quantity Change</th>
            <th className="px-4 py-2 border">Reason</th>
            <th className="px-4 py-2 border">Note</th>
            <th className="px-4 py-2 border">Admin Email</th>
            <th className="px-4 py-2 border">Date</th>
          </tr>
        </thead>
        <tbody>
          {tableData.map((row, idx) => (
            <tr key={idx} className="hover:bg-gray-50">
              <td className="px-4 py-2 border">{row.productName}</td>
              <td className="px-4 py-2 border">{row.qtyChange}</td>
              <td className="px-4 py-2 border">{row.reason}</td>
              <td className="px-4 py-2 border">{row.note}</td>
              <td className="px-4 py-2 border">{row.adminEmail}</td>
              <td className="px-4 py-2 border">{row.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
