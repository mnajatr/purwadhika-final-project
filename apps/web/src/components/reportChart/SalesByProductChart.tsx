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
import { useSalesByProduct } from "@/hooks/useReport";

interface Props {
  month: number;
  year: number;
  storeId?: number;
}

export const COLORS = [
  "#8884d8",
  "#82ca9d",
  "#ffc658",
  "#ff8042",
  "#0088fe",
  "#00c49f",
  "#ffbb28",
  "#ff4444",
];

export default function SalesByProductChart({ month, year, storeId }: Props) {
  const { data, isLoading, error } = useSalesByProduct({
    month,
    year,
    storeId,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  if (!data || data.length === 0) return <div>No data</div>;
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
  const chartData = data.map((item) => ({
    product: item.productName,
    sales: item.totalSales,
    quantity: item.totalQty,
  }));

  return (
    <ResponsiveContainer width="100%" height={300}>
      <BarChart data={chartData}>
        <XAxis dataKey="product" />
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
