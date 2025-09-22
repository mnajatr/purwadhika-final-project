"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { useSalesByCategory } from "@/hooks/useReport";

interface Props {
  month: number;
  year: number;
  storeId?: number;
}

export default function SalesByCategoryChart({ month, year, storeId }: Props) {
  const { data, isLoading, error } = useSalesByCategory({
    month,
    year,
    storeId,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data || data.length === 0) return <div>No data</div>;

  const chartData = data.map((item) => ({
    category: item.category,
    sales: item.totalSales,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <XAxis dataKey="category" />
        <YAxis />
        <Tooltip />
        <Bar dataKey="sales" fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  );
}
