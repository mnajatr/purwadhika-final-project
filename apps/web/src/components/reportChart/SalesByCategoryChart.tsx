"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  TooltipProps,
} from "recharts";
import { useSalesByCategory } from "@/hooks/useReport";
import { COLORS } from "./SalesByProductChart";

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

  const grouped = Object.values(
    data.reduce((acc, item) => {
      if (!acc[item.categoryId]) {
        acc[item.categoryId] = {
          categoryId: item.categoryId,
          categoryName: item.categoryName,
          totalQty: 0,
          totalSales: 0,
        };
      }
      acc[item.categoryId].totalQty += item.totalQty;
      acc[item.categoryId].totalSales += item.totalSales;
      return acc;
    }, {} as Record<number, { categoryId: number; categoryName: string; totalQty: number; totalSales: number }>)
  );
  interface ChartPayload {
    product: string;
    sales: number;
    quantity: number;
  }

  type CustomTooltipProps = TooltipProps<number, string> & {
    payload?: { payload: ChartPayload }[];
    label?: string;
  };

  const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white border rounded p-2 shadow text-sm">
          <p className="font-semibold">{label}</p>
          <p>Sales: {data.sales}</p>
          <p>Quantity: {data.quantity}</p>
        </div>
      );
    }
    return null;
  };

  const chartData = grouped.map((item) => ({
    category: item.categoryName,
    sales: item.totalSales,
    quantity: item.totalQty,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <XAxis dataKey="category" />
        <YAxis />
        <Tooltip content={<CustomTooltip />} />
        <Bar dataKey="sales">
          {chartData.map((entry, index) => (
            <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
